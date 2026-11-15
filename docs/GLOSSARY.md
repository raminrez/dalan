# Glossary: Dalan (دالان)

This glossary defines the shared domain vocabulary for **Dalan**, an in-browser, zero-server document transformer converting Persian, Arabic, and multilingual PDFs into reflowable Kindle EPUB 3 ebooks.

---

## 1. Architectural & Conceptual Terms (Hashti Spatial Philosophy)

* **Hashti Spatial Philosophy**: An architectural framing rooted in Persian vernacular architecture (Isfahan, Yazd, Kashan) where private sanctuaries are shielded by intentional spatial thresholds rather than abrupt transitions.
* **Darvazeh (دروازه - The Portal)**: The entry threshold of Dalan. In the UI, this is the accessible file dropzone and document specification area where user intent is captured.
* **Hashti (هشتی - The Octagonal Vestibule)**: The sensory equilibrium chamber. In the UI, this maps to the active conversion dashboard, focus-trapping progress state, and live OCR confidence visualization.
* **Dalan (دالان - The Indirect Bent Corridor)**: The transitional corridor that shields and transforms. In Dalan, this is the transformation pipeline that bends messy fixed-layout PDFs into structured reflowable documents.
* **Hayati (حیاطی - The Courtyard Sanctuary)**: The final tranquil destination featuring the turquoise pool (*Howz*). In the UI, this is the completed download card providing Kindle delivery guidance.

---

## 2. Document & Processing Terms

* **Reflowable EPUB (EPUB 3)**: An electronic publication format whose text automatically adapts its layout and line breaks to any screen size and font scale, in contrast to fixed-layout PDFs.
* **Visual vs. Logical BiDi Order**:
  * *Visual Order*: Text stored backwards in raw character presentation forms (e.g. `ی + و + ﺮ + ﺴ + ﮐ`), typical of legacy Iranian PDFs.
  * *Logical Order*: Text stored in semantic Unicode order (`ک + س + ر + و + ی`), which modern rendering engines and e-readers shape dynamically.
* **ZWNJ (Zero-Width Non-Joiner / نیم‌فاصله - `\u200c`)**: A non-printing Unicode character crucial in Persian orthography to prevent inappropriate cursive joining in prefixes (e.g. `می‌شود`) and suffixes (`خانه‌ها`).
* **Line Clustering (Baseline Geometry)**: The algorithm that aggregates disconnected text bounding boxes (`rects`) sharing the same vertical Y-coordinate into unified right-to-left lines.
* **Tessdata Best**: Full floating-point LSTM neural network weights for Tesseract OCR that preserve subtle diacritic dots and ligatures far better than quantized `tessdata_fast`.

---

## 3. Technology Stack & Edge Primitives

* **Zero-Server Processing**: A design pattern where all computation (PDF decoding, OCR matrix multiplication, font embedding, and ZIP archiving) occurs 100% inside the client's browser threads.
* **Web Worker (`convert.worker.ts`)**: A background JavaScript thread isolated from the main UI thread, preventing layout jank or UI freezing during heavy document conversion.
* **OffscreenCanvas**: An HTML5 Canvas API that can be rendered inside a Web Worker without requiring access to the browser DOM.
* **@hashti/react**: The modern React component library built on top of React Aria Components with 44px touch targets and Persian Turquoise design tokens.
