import { Platform } from 'react-native';

type HandwritingInput = {
  base64?: string;
  uri?: string;
};

// ── Gemini Vision API ────────────────────────────────────────────────────────
// Uses Google Gemini Vision as the primary OCR engine for handwriting.
// Requires EXPO_PUBLIC_GEMINI_API_KEY to be set. Works on web and native.
//
// Security note: EXPO_PUBLIC_ vars are embedded in the client bundle. Restrict
// your key to only the Generative Language API and set referrer/IP restrictions
// in Google Cloud Console so that the key cannot be abused if extracted.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

async function recognizeWithGemini(imageBase64: string, mimeType = 'image/jpeg'): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured (EXPO_PUBLIC_GEMINI_API_KEY).');
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: 'Transcribe all handwritten text from this image exactly as written. Output only the transcribed text with no additional commentary, labels, or formatting.',
          },
          {
            inline_data: { mime_type: mimeType, data: imageBase64 },
          },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 2048 },
  };

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
  return text;
}

// ── Tesseract.js (web fallback) ──────────────────────────────────────────────

let nativeOcrModulePromise: Promise<any> | null = null;
let tesseractScriptPromise: Promise<void> | null = null;

function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { value: String(error) };
}

async function ensureTesseractWebLoaded() {
  if (tesseractScriptPromise) {
    return tesseractScriptPromise;
  }

  tesseractScriptPromise = new Promise<void>((resolve, reject) => {
    const webWindow = globalThis as any;
    if (webWindow.Tesseract) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Tesseract.js script.'));
    document.head.appendChild(script);
  });

  try {
    await tesseractScriptPromise;
  } catch (error) {
    tesseractScriptPromise = null;
    throw error;
  }
}

async function uriToDataUrl(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image to data URL.'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error.'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Upscale image to at least `minHeight` pixels and enhance contrast so
 * Tesseract LSTM can read handwriting more accurately.
 */
async function preprocessForTesseract(dataUrl: string): Promise<string> {
  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Upscale to at least 1500 px tall so Tesseract sees larger glyphs
      const minHeight = 1500;
      const scale = img.height < minHeight ? minHeight / img.height : 1.0;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      (ctx as any).imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const n = canvas.width * canvas.height;

      // Convert to grayscale and find min/max for contrast stretching
      const grays = new Float32Array(n);
      let minG = 255, maxG = 0;
      for (let i = 0; i < n; i++) {
        const g = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
        grays[i] = g;
        if (g < minG) minG = g;
        if (g > maxG) maxG = g;
      }

      // Stretch contrast to the full 0-255 range
      const range = maxG - minG || 1;
      for (let i = 0; i < n; i++) {
        const v = Math.round(((grays[i] - minG) / range) * 255);
        d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        d[i * 4 + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

async function getNativeOcrModule() {
  if (!nativeOcrModulePromise) {
    nativeOcrModulePromise = (async () => {
      try {
        const module = await import('rn-mlkit-ocr');
        return (module as any).default ?? module;
      } catch (error) {
        nativeOcrModulePromise = null;
        throw error;
      }
    })();
  }

  return nativeOcrModulePromise;
}

/**
 * Tesseract.js web fallback.
 * Uses the LSTM engine (OEM 1) with sparse-text page segmentation (PSM 11)
 * which handles handwriting significantly better than the default settings.
 */
async function recognizeWithTesseractWeb(source: string) {
  const startedAt = Date.now();
  await ensureTesseractWebLoaded();

  const webWindow = globalThis as any;
  const tesseract = webWindow.Tesseract;
  if (!tesseract?.createWorker) {
    throw new Error('Tesseract.js is not available after script load.');
  }

  // Pre-process the image to improve Tesseract accuracy on handwriting
  const processedSource = await preprocessForTesseract(source);

  // Use the Worker API to configure OEM/PSM for better handwriting recognition
  // OEM 1 = LSTM only (better neural-net engine)
  // PSM 11 = Sparse text – finds text wherever it appears, no column assumptions
  const worker = await tesseract.createWorker('eng', 1 /* OEM.LSTM_ONLY */);
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: '11', // PSM.SPARSE_TEXT
    });

    const result = await worker.recognize(processedSource);
    const text = String(result?.data?.text ?? '').trim();
    const confidence = typeof result?.data?.confidence === 'number'
      ? result.data.confidence
      : undefined;

    if (__DEV__) {
      console.log('[OCR][web] Tesseract completed in ms:', Date.now() - startedAt, {
        confidence,
        textLength: text.length,
      });
    }

    return { text, confidence };
  } finally {
    await worker.terminate().catch(() => { /* ignore cleanup errors */ });
  }
}

async function recognizeHandwritingWebFromSource(input: HandwritingInput): Promise<string> {
  let source = '';

  if (input.base64) {
    source = `data:image/jpeg;base64,${input.base64}`;
  } else if (input.uri) {
    source = input.uri.startsWith('data:')
      ? input.uri
      : await uriToDataUrl(input.uri);
  }

  if (!source) {
    if (__DEV__) {
      console.warn('[OCR][web] Missing both base64 and uri input.');
    }
    return '';
  }

  // Try Gemini Vision first — vastly superior at handwriting
  if (GEMINI_API_KEY) {
    try {
      const base64 = source.startsWith('data:')
        ? source.replace(/^data:[^;]+;base64,/, '')
        : source;
      const mimeMatch = source.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const geminiText = await recognizeWithGemini(base64, mime);
      if (geminiText) {
        if (__DEV__) {
          console.log('[OCR][web] Gemini Vision succeeded, textLength:', geminiText.length);
        }
        return geminiText;
      }
    } catch (geminiError) {
      if (__DEV__) {
        console.warn('[OCR][web] Gemini Vision failed, falling back to Tesseract:', formatError(geminiError));
      }
    }
  }

  const result = await recognizeWithTesseractWeb(source);
  return result.text;
}

async function recognizeHandwritingNative(input: HandwritingInput): Promise<string> {
  // Try Gemini Vision first — works on native via fetch, much better at handwriting
  if (GEMINI_API_KEY) {
    const base64 = input.base64 ?? '';
    if (base64) {
      try {
        const geminiText = await recognizeWithGemini(base64);
        if (geminiText) {
          if (__DEV__) {
            console.log('[OCR][native] Gemini Vision succeeded, textLength:', geminiText.length);
          }
          return geminiText;
        }
      } catch (geminiError) {
        if (__DEV__) {
          console.warn('[OCR][native] Gemini Vision failed, falling back to ML Kit:', formatError(geminiError));
        }
      }
    }
  }

  // Fall back to ML Kit on-device OCR
  if (!input.uri) return '';
  const mlkit = await getNativeOcrModule();
  const result = await mlkit.recognizeText(input.uri, 'latin');
  return (result?.text ?? '').trim();
}

export async function recognizeHandwriting(input: HandwritingInput): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('[OCR][web] Starting recognition request', {
          hasBase64: Boolean(input.base64),
          hasUri: Boolean(input.uri),
          usingGemini: Boolean(GEMINI_API_KEY),
        });
      }
      return await recognizeHandwritingWebFromSource(input);
    }

    if (__DEV__) {
      console.log('[OCR][native] Starting recognition request', {
        hasBase64: Boolean(input.base64),
        hasUri: Boolean(input.uri),
        usingGemini: Boolean(GEMINI_API_KEY),
      });
    }
    return await recognizeHandwritingNative(input);
  } catch (error) {
    if (__DEV__) {
      const formatted = formatError(error);
      console.error('[OCR] recognition failed', {
        platform: Platform.OS,
        hasBase64: Boolean(input.base64),
        hasUri: Boolean(input.uri),
        error: formatted,
      });
      console.error('[OCR] recognition failed message:', formatted.message ?? formatted.value ?? 'Unknown error');
    }
    return '';
  }
}
