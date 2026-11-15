# Issue DLN-007: PDF Outlines & Semantic Chapter TOC Detection

* **Parent Spec:** `docs/SPEC.md`
* **Status:** Done
* **Blocks:** DLN-008

## Problem Statement
Currently, long books without explicit page breaks are split into arbitrary 10-page chapters, and the Kindle navigation bar lacks hierarchical table of contents entries (`nav.xhtml` and `toc.ncx`).

## Scope of Work
1. Query `doc.getOutline()` via `pdfjs-dist` to parse native PDF bookmark trees and destinations.
2. Implement heuristic fallback when bookmarks are missing: inspect top heading font sizes and match Persian/English chapter keywords (`فصل`, `بخش`, `گفتار`, `Chapter`, `Part`).
3. Build nested EPUB navigation documents (`nav.xhtml` for EPUB 3, `toc.ncx` for EPUB 2/Kindle backward compatibility).

## Acceptance Criteria
- [x] Books with PDF outlines generate a 1:1 navigable Table of Contents on Kindle.
- [x] Fallback heading detection splits chapters cleanly at section titles.
- [x] Chapter titles appear correctly in the reader menu.
