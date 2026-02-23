import { Platform } from 'react-native';

type HandwritingInput = {
  base64?: string;
  uri?: string;
};

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

async function recognizeWithTesseractWeb(source: string) {
  const startedAt = Date.now();
  await ensureTesseractWebLoaded();

  const webWindow = globalThis as any;
  const tesseract = webWindow.Tesseract;
  if (!tesseract?.recognize) {
    throw new Error('Tesseract.js is not available after script load.');
  }

  const result = await tesseract.recognize(source, 'eng');
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
