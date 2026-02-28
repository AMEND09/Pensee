import { Platform } from 'react-native';

type HandwritingInput = {
  base64?: string;
  uri?: string;
};

let nativeOcrModulePromise: Promise<any> | null = null;
let tesseractWorkerPromise: Promise<any> | null = null;

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

// ---------------------------------------------------------------------------
// Image preprocessing – improves Tesseract accuracy on handwriting by
// converting to grayscale, normalizing contrast (histogram stretch), and
// scaling to an optimal resolution. Preserves detail for both pen and pencil.
// ---------------------------------------------------------------------------

function loadImageElement(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for preprocessing.'));
    img.src = source;
  });
}

function preprocessImageCanvas(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  // Scale large images down – Tesseract performs better around 2000px width
  const MAX_DIM = 2000;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (w > MAX_DIM || h > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const { data } = imageData;

  // 1. Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = data[i + 1] = data[i + 2] = gray;
  }

  // 2. Histogram normalization (contrast stretch) – spreads pixel values
  //    across the full 0-255 range, making faint pencil strokes more visible
  //    while preserving detail better than binary thresholding.
  let minVal = 255;
  let maxVal = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] < minVal) minVal = data[i];
    if (data[i] > maxVal) maxVal = data[i];
  }

  const range = maxVal - minVal || 1;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.round(((data[i] - minVal) / range) * 255);
    data[i] = data[i + 1] = data[i + 2] = v;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

async function preprocessImage(source: string): Promise<string> {
  try {
    const img = await loadImageElement(source);
    return preprocessImageCanvas(img);
  } catch (e) {
    if (__DEV__) console.warn('[OCR][preprocess] Falling back to raw image', e);
    return source;
  }
}

// ---------------------------------------------------------------------------
// Tesseract.js (web) – npm package with LSTM engine, PSM 6 for handwriting
// ---------------------------------------------------------------------------

async function getTesseractWorker() {
  if (tesseractWorkerPromise) return tesseractWorkerPromise;

  tesseractWorkerPromise = (async () => {
    try {
      const Tesseract = await import('tesseract.js');
      const createWorker = (Tesseract as any).createWorker ?? (Tesseract as any).default?.createWorker;
      if (!createWorker) throw new Error('createWorker not found in tesseract.js');

      const worker = await createWorker('eng');
      await worker.setParameters({
        tessedit_pageseg_mode: '6',   // Assume uniform block of text
      });
      return worker;
    } catch (error) {
      tesseractWorkerPromise = null;
      throw error;
    }
  })();

  return tesseractWorkerPromise;
}

async function recognizeWithTesseractWeb(source: string) {
  const startedAt = Date.now();

  const preprocessed = await preprocessImage(source);
  const worker = await getTesseractWorker();

  const result = await worker.recognize(preprocessed);
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
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Platform entry points
// ---------------------------------------------------------------------------

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

  const result = await recognizeWithTesseractWeb(source);
  return result.text;
}

async function recognizeHandwritingNative(uri: string): Promise<string> {
  const mlkit = await getNativeOcrModule();
  const result = await mlkit.recognizeText(uri, 'latin');
  return (result?.text ?? '').trim();
}

export async function recognizeHandwriting(input: HandwritingInput): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      if (__DEV__) {
        console.log('[OCR][web] Starting recognition request', {
          hasBase64: Boolean(input.base64),
          hasUri: Boolean(input.uri),
        });
      }
      return await recognizeHandwritingWebFromSource(input);
    }

    if (!input.uri) return '';
    return await recognizeHandwritingNative(input.uri);
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
