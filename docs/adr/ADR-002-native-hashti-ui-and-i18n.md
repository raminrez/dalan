# ADR-002: Native Hashti Architectural UI & Bidirectional Internationalization

## Status
Accepted

## Context
Dalan's landing surface must represent the Hashti architectural philosophy:
1. Pure component composition: Strictly consume `@hashti/react` primitives (`Theme`, `Card`, `Button`, `Select`, `Switch`, `Badge`, `Dropzone`, `ProgressBar`) without custom ad-hoc CSS overrides or anti-pattern style hacks.
2. Bidirectional Internationalization (i18n): Native English (LTR) and Persian (RTL) localization, backed by React Aria `I18nProvider` via Hashti's `<Theme>`.
3. Native Theming: Automatic and toggleable Light and Dark modes using `@hashti/tokens` and CSS custom properties (`oklch` palette tokens).
4. Accessibility: Full keyboard navigation, focus visible rings, and screen reader announcements adhering to React Aria guidelines.

## Decision
- Wrap Dalan's root tree with Hashti's `<Theme theme={currentTheme} locale={currentLocale} direction={currentDirection}>`.
- Render a top-level architectural navigation threshold containing language switching (`fa` / `en`) and theme mode switching (Light / Dark).
- Ensure all structural sections (Darvazeh, Hashti, Dalan, Hayati) render with semantic Hashti `<Card>` and `<Badge>` surfaces.

## Consequences
- Guaranteed visual consistency with the Hashti design language across all screens.
- Zero maintenance burden on custom stylesheets; colors, paddings, elevations, and focus states are completely governed by design tokens.
- Seamless reading direction and layout mirroring between Persian and English.
