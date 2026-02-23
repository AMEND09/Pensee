# Local OCR Research (Web + Mobile, Handwriting Focus)

## Requirements
- Must run on **web and mobile**.
- Must run **locally on-device** (no external OCR API calls).
- Must be **strong for handwriting recognition**.

## Options Reviewed

### 1) TrOCR (`microsoft/trocr-base-handwritten`) via `@huggingface/transformers`
- **Handwriting quality:** Strong for line-level handwriting (IAM fine-tune).
- **Local execution:** Yes (in-browser ONNX/WASM/WebGPU runtime).
- **Web support:** Excellent.
- **Mobile React Native support:** Not practical in this Expo app path without a larger custom runtime stack.
- **Tradeoff:** Best handwriting model quality among reviewed options, but not a simple RN drop-in.

### 2) Tesseract.js
- **Handwriting quality:** Generally weaker for cursive/modern handwriting than TrOCR and modern neural OCR.
- **Local execution:** Yes.
- **Web support:** Excellent.
- **Mobile RN support:** No straightforward high-quality shared runtime in this app architecture.
- **Tradeoff:** Great portability, weaker handwriting performance.

### 3) ONNX Runtime custom cross-platform pipeline (`onnxruntime-web` + `onnxruntime-react-native`)
- **Handwriting quality:** Potentially very strong (if deploying TrOCR/other handwriting models).
- **Local execution:** Yes.
- **Web/mobile support:** Yes.
- **Tradeoff:** Highest engineering complexity (custom pre/post-processing, tokenizer/decoder flow, model packaging).

### 4) Native mobile OCR via ML Kit / Vision wrappers (`rn-mlkit-ocr`)
- **Handwriting quality:** Good practical performance on many handwritten notes, especially printed/mixed handwriting.
- **Local execution:** Yes (on-device).
- **Web support:** No (mobile only).
- **Tradeoff:** Best practical mobile integration in Expo with local inference.

## Final Architecture Chosen
- **Web:** Keep TrOCR (`@huggingface/transformers`) for high-quality local handwriting OCR.
- **Mobile (iOS/Android):** Use `rn-mlkit-ocr` for local on-device OCR with bundled Latin model.
- **No external OCR API fallback:** Removed entirely.

This gives:
- local-only inference on both platform groups,
- stronger handwriting quality on web,
- robust native performance on mobile,
- minimal invasive changes to existing app flow.

## Notes on “Best Handwriting” vs Practicality
If the product needs **state-of-the-art handwriting quality on mobile equal to TrOCR**, the next step is a full custom ONNX pipeline across web and RN. That is feasible but significantly larger in scope than this change and would require dedicated model packaging + runtime optimization work.
