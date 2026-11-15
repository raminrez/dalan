# Dalan Engineering Specification & Roadmap (Ask Matt Tracer-Bullet Spec)

This document specifies the ongoing architectural roadmap and tracer-bullet tickets for Dalan (دالان) following the **Ask Matt** (`/ask-matt`) engineering framework.

---

## Completed Tracer-Bullet Tickets (Sprint 1)
* **[x] DLN-001: PWA Web Manifest & Service Worker** (`docs/issues/DLN-001-pwa-manifest.md`)
  - Standalone PWA manifest, service worker registration, and offline caching strategy.
* **[x] DLN-002: Offline Tessdata & Font IndexedDB Cache** (`docs/issues/DLN-002-offline-caching.md`)
  - Self-hosted `tessdata_fast` models (`fas.traineddata`, `ara.traineddata`) with 60-day cache invalidation.
* **[x] DLN-003: Live Hashti Chamber Page Preview & Telemetry** (`docs/issues/DLN-003-live-preview.md`)
  - Real-time thumbnail rendering of active PDF pages during Web Worker conversion.
* **[x] DLN-004: Production Edge Verification & CI/CD Hardening** (`docs/issues/DLN-004-edge-verification.md`)
  - Production edge deployment to `dalan.raminrez.dev` via Cloudflare Pages.
* **[x] DLN-005: Paknevis/Davat Persian Orthography & NFKC Decoding** (`docs/issues/DLN-005-persian-orthography.md`)
  - Unicode NFKC normalization folding presentation forms (`U+FB50..U+FEFF`), ZWNJ (نیم‌فاصله) regex boundaries for prefixes and suffixes, Arabic-to-Persian letter standardization, and punctuation rules.

---

## Next Tracer-Bullet Ticket Graph (Sprint 2)

```
[DLN-006: Hashti Pure Component UI & Multi-Language / Light-Dark Landing]
                           │
                           ▼ (blocks)
[DLN-007: PDF Outlines & Semantic Chapter TOC Detection]
                           │
                           ▼ (blocks)
[DLN-008: Dual-Column Reflow & Text Boundary Segmentation]
                           │
                           ▼ (blocks)
[DLN-009: Embedded Illustration & Image Extraction for Kindle Reflow]
```

---

## Detailed Sprint 2 Tickets

### Ticket DLN-006: Hashti Pure Component UI & Multi-Language / Light-Dark Landing
* **File:** `docs/issues/DLN-006-hashti-i18n-landing.md`
* **Status:** Ready
* **Goal:** Deliver a production-grade, architecturally sound landing surface using pure `@hashti/react` primitives without ad-hoc custom styles, supporting Persian (RTL) & English (LTR) and seamless Light/Dark theme switching.
* **Acceptance Criteria:**
  1. Root application wrapped in Hashti `<Theme theme={theme} locale={locale} direction={dir}>`.
  2. Language switcher supporting Persian (`fa`, RTL) and English (`en`, LTR) with automatic UI mirroring.
  3. Theme toggle between Light and Dark modes backed by `@hashti/tokens` and CSS custom variables.
  4. Landing sections (Hero/Darvazeh, Pipeline/Hashti, Results/Hayati, FAQ/Architecture) composed strictly using native Hashti components (`Card`, `Button`, `Badge`, `Switch`, `Dropzone`, `ProgressBar`).
  5. Zero custom CSS overrides that break Hashti design token encapsulation.

### Ticket DLN-007: PDF Outlines & Semantic Chapter TOC Detection
* **File:** `docs/issues/DLN-007-pdf-outlines-toc.md`
* **Status:** Blocked by DLN-006
* **Goal:** Extract native PDF bookmarks (`doc.getOutline()`) and regex-detect Persian/English chapter titles (`فصل ۱`, `بخش دوم`, `Chapter 1`) to construct native Kindle Table of Contents (`nav.xhtml` & `toc.ncx`).
* **Acceptance Criteria:**
  1. Worker queries PDF outline tree and maps named destinations to EPUB spine chapters.
  2. Fallback heuristic detects major headings from font size clustering and Persian chapter phrases.
  3. Generated EPUB displays an interactive navigation hierarchy in Kindle reader sidebar.

### Ticket DLN-008: Dual-Column Reflow & Text Boundary Segmentation
* **File:** `docs/issues/DLN-008-dual-column-reflow.md`
* **Status:** Blocked by DLN-007
* **Goal:** Prevent sentence interleaving in multi-column PDFs (academic papers, magazines) by segmenting columns before baseline sorting.
* **Acceptance Criteria:**
  1. Detect multi-column gutters by analyzing X-coordinate clustering of text items.
  2. Order text items RTL-column by RTL-column (right column first in Persian/Arabic, left first in English).

### Ticket DLN-009: Embedded Illustration & Image Extraction for Kindle Reflow
* **File:** `docs/issues/DLN-009-image-extraction.md`
* **Status:** Blocked by DLN-008
* **Goal:** Extract figures, diagrams, and cover images from PDF pages and embed them reflowed into the EPUB package.
* **Acceptance Criteria:**
  1. High-resolution cover image generated from page 1 thumbnail and declared as `properties="cover-image"` in EPUB manifest.
  2. Inline images scaled, compressed (WebP/JPEG), and placed within corresponding `<figure>` elements.
