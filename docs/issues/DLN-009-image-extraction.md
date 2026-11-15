# Issue DLN-009: Embedded Illustration & Image Extraction for Kindle Reflow

* **Parent Spec:** `docs/SPEC.md`
* **Status:** Done
* **Blocks:** None

## Problem Statement
Books containing technical charts, figures, or decorative elements currently lose all visual assets during text extraction.

## Scope of Work
1. Extract book cover from page 1 canvas render and declare it in EPUB package metadata as the official book cover.
2. Intercept raster image elements from PDF operator lists (`page.getOperatorList()`), resize/compress to WebP/JPEG, and embed in the EPUB spine reflowed alongside adjacent paragraphs.

## Acceptance Criteria
- [x] Cover image renders on Kindle library grid.
- [x] Embedded illustrations appear in their correct reading order within the text stream.
