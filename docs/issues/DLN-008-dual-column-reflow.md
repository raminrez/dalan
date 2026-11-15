# Issue DLN-008: Dual-Column Reflow & Text Boundary Segmentation

* **Parent Spec:** `docs/SPEC.md`
* **Status:** Done
* **Blocks:** DLN-009

## Problem Statement
Academic papers, older books, and periodicals often format content into two columns. Simple vertical baseline grouping interleaves column A and column B across lines, making paragraphs unreadable.

## Scope of Work
1. Detect page column structure by analyzing histogram of horizontal item coordinates ($X$).
2. Split items into column bounding boxes.
3. Order columns according to script direction (Right-to-Left for Persian/Arabic: right column first, then left column).

## Acceptance Criteria
- [x] Two-column Persian documents produce contiguous reading text without paragraph interleaving.
- [x] Single-column pages remain unaffected.
