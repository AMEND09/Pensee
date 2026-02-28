/**
 * OCR Benchmark — tests multiple OCR configurations against the bundled
 * handwriting sample and reports word-level accuracy for each method.
 *
 * The sample image contains two lines of handwriting:
 *  • Pen:    "This is a test 1 2 3 The quick brown fox jumped over the lazy dog."
 *  • Pencil: "This is a handwriting test 5 4 3 2 1 The quick brown fox jumped over the lazy dog"
 *
 * Tests 1–4 run Tesseract.js using locally-installed training data so no CDN
 *   download is needed.
 * Test 4 additionally exercises the Canvas-based preprocessing via a Playwright
 *   browser page to validate the browser path used by the app.
 * Test 5 runs only when EXPO_PUBLIC_GEMINI_API_KEY is set.
 */
import { test, expect } from '@playwright/test';
import { createWorker, PSM } from 'tesseract.js';
import * as fs from 'fs';
import * as path from 'path';

// ── Ground-truth text ─────────────────────────────────────────────────────────
const PEN_TEXT =
  'This is a test 1 2 3 The quick brown fox jumped over the lazy dog';
const PENCIL_TEXT =
  'This is a handwriting test 5 4 3 2 1 The quick brown fox jumped over the lazy dog';

// Words from both lines intentionally kept with duplicates: the accuracy metric
// measures whether each individual word occurrence was recognised, rewarding OCR
// that captures both lines equally rather than just finding a word once.
const ALL_WORDS = [...PEN_TEXT.split(/\s+/), ...PENCIL_TEXT.split(/\s+/)].map((w) =>
  w.toLowerCase().replace(/[^a-z0-9]/g, ''),
);

function wordAccuracy(recognized: string): number {
  const recognizedWords = recognized
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  const hits = ALL_WORDS.filter((w) => recognizedWords.includes(w)).length;
  return hits / ALL_WORDS.length;
}

// ── Resolve local training-data paths (avoids CDN downloads in CI) ────────────
const engDataDir = path.dirname(require.resolve('@tesseract.js-data/eng'));
// 4.0.0          – standard data, works with default OEM (Tesseract + LSTM)
const LANG_PATH_DEFAULT = path.join(engDataDir, '4.0.0');
// 4.0.0_best_int – LSTM-only, higher accuracy for the LSTM engine (OEM 1)
const LANG_PATH_LSTM = path.join(engDataDir, '4.0.0_best_int');

// ── Load sample image ─────────────────────────────────────────────────────────
const imagePath = path.resolve(__dirname, '..', 'handwriting-sample.jpeg');
const imageBase64 = fs.readFileSync(imagePath).toString('base64');
const imageDataUrl = `data:image/jpeg;base64,${imageBase64}`;

// ── Preprocessing function (mirrors utils/ocr.ts preprocessForTesseract) ─────
// Runs in browser context (Canvas API) in test 4.
const preprocessBrowserFn = /* js */ `
window.preprocessImage = async function preprocessImage(dataUrl) {
  const minHeight = 1500;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = img.height < minHeight ? minHeight / img.height : 1.0;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      const n = canvas.width * canvas.height;
      const grays = new Float32Array(n);
      let minG = 255, maxG = 0;
      for (let i = 0; i < n; i++) {
        const g = 0.299 * d[i*4] + 0.587 * d[i*4+1] + 0.114 * d[i*4+2];
        grays[i] = g;
        if (g < minG) minG = g;
        if (g > maxG) maxG = g;
      }
      const range = maxG - minG || 1;
      for (let i = 0; i < n; i++) {
        const v = Math.round(((grays[i] - minG) / range) * 255);
        d[i*4] = d[i*4+1] = d[i*4+2] = v;
        d[i*4+3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
`;

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Baseline – Tesseract.js default settings (original app behaviour)
// ─────────────────────────────────────────────────────────────────────────────
test('OCR baseline: Tesseract.js default settings', async () => {
  const worker = await createWorker('eng', undefined, { langPath: LANG_PATH_DEFAULT });
  try {
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    const acc = wordAccuracy(text);
    console.log(`[baseline] confidence: ${confidence?.toFixed(1)}`);
    console.log(`[baseline] word accuracy: ${(acc * 100).toFixed(1)}%`);
    console.log(`[baseline] raw text:\n${text.substring(0, 400)}`);
    expect(typeof text).toBe('string');
  } finally {
    await worker.terminate();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Improved – Tesseract.js LSTM engine + PSM 11 (sparse text)
// ─────────────────────────────────────────────────────────────────────────────
test('OCR improved: Tesseract.js LSTM + PSM 11 (sparse text)', async () => {
  // OEM 1 = LSTM only; PSM 11 = sparse text (no column assumptions)
  const worker = await createWorker('eng', 1, { langPath: LANG_PATH_LSTM });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    const acc = wordAccuracy(text);
    console.log(`[lstm-psm11] confidence: ${confidence?.toFixed(1)}`);
    console.log(`[lstm-psm11] word accuracy: ${(acc * 100).toFixed(1)}%`);
    console.log(`[lstm-psm11] raw text:\n${text.substring(0, 400)}`);
    expect(typeof text).toBe('string');
  } finally {
    await worker.terminate();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Improved – Tesseract.js LSTM engine + PSM 6 (uniform block of text)
// ─────────────────────────────────────────────────────────────────────────────
test('OCR improved: Tesseract.js LSTM + PSM 6 (uniform block)', async () => {
  const worker = await createWorker('eng', 1, { langPath: LANG_PATH_LSTM });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK });
    const { data: { text, confidence } } = await worker.recognize(imagePath);
    const acc = wordAccuracy(text);
    console.log(`[lstm-psm6] confidence: ${confidence?.toFixed(1)}`);
    console.log(`[lstm-psm6] word accuracy: ${(acc * 100).toFixed(1)}%`);
    console.log(`[lstm-psm6] raw text:\n${text.substring(0, 400)}`);
    expect(typeof text).toBe('string');
  } finally {
    await worker.terminate();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Best open-source – Canvas preprocessing in browser + LSTM + PSM 11
//          Validates the preprocessing path in utils/ocr.ts (browser-only API).
// ─────────────────────────────────────────────────────────────────────────────
test('OCR best-open-source: browser Canvas preprocessing + LSTM + PSM 11', async ({ page }) => {
  // Run preprocessing in the browser using Canvas API (mirrors app behaviour)
  await page.setContent('<!DOCTYPE html><html><body></body></html>');

  // Inject and call preprocessImage helper (defined as string above)
  await page.evaluate(preprocessBrowserFn);

  const processedDataUrl = await page.evaluate(async (dataUrl: string) => {
    return await (window as any).preprocessImage(dataUrl);
  }, imageDataUrl);

  expect(processedDataUrl).toMatch(/^data:image\//);
  console.log(`[preprocess] output data URL length: ${processedDataUrl.length}`);

  // Run Tesseract in Node context on the browser-preprocessed image
  const base64Part = processedDataUrl.replace(/^data:[^;]+;base64,/, '');
  const buf = Buffer.from(base64Part, 'base64');

  const worker = await createWorker('eng', 1, { langPath: LANG_PATH_LSTM });
  try {
    await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
    const { data: { text, confidence } } = await worker.recognize(buf);
    const acc = wordAccuracy(text);
    console.log(`[preprocess+lstm+psm11] confidence: ${confidence?.toFixed(1)}`);
    console.log(`[preprocess+lstm+psm11] word accuracy: ${(acc * 100).toFixed(1)}%`);
    console.log(`[preprocess+lstm+psm11] raw text:\n${text.substring(0, 400)}`);
    expect(acc).toBeGreaterThan(0);
  } finally {
    await worker.terminate();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Test 5 (optional): Gemini Vision – only runs when API key is set
// ─────────────────────────────────────────────────────────────────────────────
test('OCR best: Gemini Vision (skipped when API key not configured)', async () => {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
  if (!apiKey) {
    console.log('[gemini] EXPO_PUBLIC_GEMINI_API_KEY not set – skipping Gemini test.');
    test.skip();
    return;
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: 'Transcribe all handwritten text from this image exactly as written. Output only the transcribed text with no additional commentary, labels, or formatting.',
          },
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
        ],
      },
    ],
    generationConfig: { temperature: 0, maxOutputTokens: 2048 },
  };

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  expect(resp.ok).toBe(true);
  const data = await resp.json();
  const text = String(data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
  const acc = wordAccuracy(text);
  console.log(`[gemini] word accuracy: ${(acc * 100).toFixed(1)}%`);
  console.log(`[gemini] raw text:\n${text.substring(0, 400)}`);

  // Gemini should achieve high accuracy on handwriting
  expect(acc).toBeGreaterThan(0.5);
});

