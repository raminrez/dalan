# Architectural Decision Record: ADR-001
## Zero-Server Client-Side Document Transformation Architecture

* **Status:** Accepted
* **Date:** 2026-11-15
* **Author:** Ramin & Antigravity

---

### Context & Problem Statement

Converting Persian and Arabic PDFs into Kindle-compatible reflowable EPUB 3 books traditionally requires heavy server-side processing:
1. Python/C++ binaries (like Tesseract and Poppler/PDFium).
2. Large server infrastructure (CPU/GPU) to handle memory-intensive PDF rasterization and OCR.
3. Severe privacy risks: Users must upload confidential books, documents, or personal research to a third-party server.
4. Bandwidth and hosting costs that scale with user volume.

### Decision Drivers

* **Zero Hosting Cost:** The platform must run on free edge static hosting (Cloudflare Pages or GitHub Pages) with $0 compute overhead.
* **Absolute Privacy:** User documents must never leave the browser.
* **Accessibility & Design:** The interface must implement the Hashti Spatial Philosophy and modern ergonomics (`@hashti/react`).
* **Offline First:** Users should be able to convert books without an active internet connection after initial load.

### Considered Options

1. **Option 1: Serverless Cloud Function (Python backend with Tesseract)**
   * *Cons:* Cloudflare Workers has strict 128MB memory/CPU limits; AWS Lambda incurs cold starts and egress bills; privacy compromised.
2. **Option 2: Pure Client-Side Wasm + Web Workers (Selected)**
   * Use `pdfjs-dist` inside an isolated Web Worker to rasterize pages and extract text layers.
   * Use `tesseract.js` (WebAssembly with SIMD) inside the Worker to run local OCR when pages are scanned photocopies.
   * Use pure TypeScript modules for Persian text normalization and in-memory ZIP building (`jszip`).

### Decision Outcome

**Chosen: Option 2 (Pure Client-Side Wasm + Web Worker).**

#### Consequences
* **Positive:**
  * Zero server costs: 100,000 conversions cost the same as 1 conversion ($0).
  * 100% privacy: Documents remain entirely in device RAM.
  * Works offline via Progressive Web App (PWA) caching.
* **Negative & Mitigations:**
  * Processing speed is bound to the client's device CPU/GPU. *Mitigation:* Heavy computation is isolated in a Web Worker, and pages stream sequentially with live progress feedback.
  * Initial language model download: *Mitigation:* Language weights (`fas.traineddata`) are cached in browser `IndexedDB` after first load.
