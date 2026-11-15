# Dalan Engineering Specification & Tracer-Bullet Tickets

This document serves as the implementation plan and ticket breakdown following the **Ask Matt** tracer-bullet engineering standard.

---

## Tracer-Bullet Ticket Graph

```
[DLN-001: PWA Web Manifest & Service Worker]
       │
       ▼ (blocks)
[DLN-002: Offline Tessdata & Font IndexedDB Cache]
       │
       ▼ (blocks)
[DLN-003: Live Hashti Chamber Page Preview & Telemetry]
       │
       ▼ (blocks)
[DLN-004: Production Edge Verification & CI/CD Hardening]
```

---

## Ticket Breakdown

### Ticket DLN-001: PWA Web Manifest & Service Worker
* **File:** `docs/issues/DLN-001-pwa-manifest.md`
* **Status:** Ready
* **Goal:** Turn Dalan into an installable, standalone Progressive Web App with offline assets.
* **Acceptance Criteria:**
  1. `manifest.webmanifest` created with icons, `theme_color: "#08BDBA"`, and `display: "standalone"`.
  2. Registered Service Worker that precaches static shell assets (HTML, CSS, Vazirmatn font).

### Ticket DLN-002: Offline Tessdata & Font IndexedDB Cache
* **File:** `docs/issues/DLN-002-offline-caching.md`
* **Status:** Blocked by DLN-001
* **Goal:** Ensure Tesseract Wasm and Persian language models are cached client-side in `IndexedDB`.
* **Acceptance Criteria:**
  1. Language data (`fas.traineddata`) served locally or persistently cached in `IndexedDB`.
  2. Zero network requests required on subsequent conversions.

### Ticket DLN-003: Live Hashti Chamber Page Preview & Telemetry
* **File:** `docs/issues/DLN-003-live-preview.md`
* **Status:** Blocked by DLN-002
* **Goal:** Display real-time thumbnail rendering of the active PDF page being converted inside the Hashti Chamber.
* **Acceptance Criteria:**
  1. Worker emits thumbnail data URL for current processing page.
  2. React UI renders animated thumbnail frame alongside the `@hashti/react` ProgressBar.

### Ticket DLN-004: Production Edge Verification & CI/CD Hardening
* **File:** `docs/issues/DLN-004-edge-verification.md`
* **Status:** Blocked by DLN-003
* **Goal:** Verify automated build pipeline and test cross-platform conversion in browser environments.
* **Acceptance Criteria:**
  1. Production build passes cleanly without warnings.
  2. Playwright / Agent-Browser verification proves full conversion flow.
