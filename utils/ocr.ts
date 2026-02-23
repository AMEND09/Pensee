import { Platform } from 'react-native';

type HandwritingInput = {
  base64: string;
};

let trocrPipelinePromise: Promise<any> | null = null;

async function getTrocrPipeline() {
  if (!trocrPipelinePromise) {
    trocrPipelinePromise = (async () => {
      const transformers = await import('@huggingface/transformers');
      const { pipeline, env } = transformers as any;

      // Prefer cached local/browser execution once fetched.
      if (env) {
        env.allowLocalModels = false;
        env.useBrowserCache = true;
      }

      return pipeline('image-to-text', 'microsoft/trocr-base-handwritten', {
        dtype: 'q8',
      });
    })();
  }

  return trocrPipelinePromise;
}

function extractGeneratedText(raw: any): string {
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (typeof first === 'string') return first;
    if (first && typeof first.generated_text === 'string') return first.generated_text;
    if (first && typeof first.text === 'string') return first.text;
  }

  if (raw && typeof raw.generated_text === 'string') return raw.generated_text;
  if (typeof raw === 'string') return raw;
  return '';
}

async function recognizeHandwritingWeb(base64: string): Promise<string> {
  const imageDataUrl = `data:image/jpeg;base64,${base64}`;
  const pipe = await getTrocrPipeline();
  const output = await pipe(imageDataUrl, {
    max_new_tokens: 128,
  });

  return extractGeneratedText(output).trim();
}

export async function recognizeHandwriting(input: HandwritingInput): Promise<string> {
  // TrOCR via transformers.js is web-first in this app.
  if (Platform.OS !== 'web') {
    return '';
  }

  try {
    return await recognizeHandwritingWeb(input.base64);
  } catch {
    return '';
  }
}
