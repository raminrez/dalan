# Issue DLN-006: Hashti Pure Component UI & Multi-Language / Light-Dark Landing

* **Parent Spec:** `docs/SPEC.md`
* **Status:** Ready
* **Estimated Effort:** 1 Session
* **Blocks:** DLN-007

## Problem Statement
The current landing interface in Dalan needs to be elevated to a complete, beautiful landing experience that represents the Iranian architectural philosophy of Hashti while remaining strictly accessible, bilingual (Persian RTL and English LTR), and capable of dynamic Light/Dark mode switching.
Crucially, all components must come directly from `@hashti/react` without ad-hoc custom style overrides or CSS rule clashes.

## Scope of Work
1. **Hashti `<Theme>` Integration:**
   - Wrap the root component with Hashti's `<Theme>` provider.
   - Support `theme="hashti-light"` and `theme="hashti-dark"`.
   - Support `locale="fa"` (with `direction="rtl"`) and `locale="en"` (with `direction="ltr"`).
2. **Top Architectural Bar:**
   - App title, Hashti architectural badge, language switcher, and theme toggle switch.
3. **Hero Section (Darvazeh):**
   - Architectural greeting explaining zero-server privacy, in-browser WASM, and Kindle EPUB 3 reflow.
   - Integrated Hashti `<Dropzone>` / file picker.
4. **Hashti Chamber (Live Conversion):**
   - Active step indicator (`Badge`), real-time progress (`ProgressBar`), page telemetry, and live thumbnail preview inside a Hashti `<Card>`.
5. **Hayati Sanctuary (Download & Sync):**
   - Download EPUB button (`Button` variant primary), Send-to-Kindle instructions, and metadata summary.
6. **Architecture & Features Section:**
   - Cards explaining the 4 thresholds (Darvazeh, Hashti, Dalan, Hayati), client-side privacy, and font embedding.
7. **Zero Custom Style Pollution:**
   - Use Hashti CSS tokens (`--hashti-*`) exclusively.

## Acceptance Criteria
- [ ] Language switch toggles instantly between Persian (`fa`) and English (`en`), mirroring layout and typography.
- [ ] Theme switch toggles smoothly between Light and Dark modes.
- [ ] No unstyled or custom-overridden components; 100% Hashti design system compliance.
- [ ] Responsive across mobile, tablet, and desktop viewports.
