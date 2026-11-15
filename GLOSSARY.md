# Glossary

Domain vocabulary and ubiquitous concepts for Dalan.

## Architectural Concepts (Traditional Iranian Architecture)

- **Darvazeh (دروازه)**: The outer gateway / entry threshold. In UI terms, the initial welcome and entry view.
- **Hashti (هشتی)**: The transition foyer and central spatial design philosophy governed by `@hashti/react` and `@hashti/tokens`. Provides grounding, distribution, and layout orientation.
- **Dalan (دالان)**: The corridor or passage connecting spaces. In this app, represents the core processing pipeline and document transformation journey.
- **Hayati (حیاطی)**: The courtyard / destination space. In this app, represents the completed output, preview, and download area.

## Core Domain Terms

- **Zero-Server Client-Side**: Architecture where PDF extraction, OCR, and EPUB generation occur 100% in client device RAM via WebAssembly and Web Workers (see [ADR-001](docs/adr/ADR-001-zero-server-architecture.md)).
- **Reflowable EPUB 3**: Kindle-compatible ebook format optimized for RTL (Persian and Arabic) typography and bidirectional reading order.
- **Bidirectional Internationalization (BiDi / i18n)**: First-class support for English (LTR) and Persian (RTL), mediated by React Aria's `I18nProvider` in `@hashti/react` (see [ADR-002](docs/adr/ADR-002-native-hashti-ui-and-i18n.md)).
