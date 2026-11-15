# Domain Documentation

This repository uses a **single-context** domain documentation layout.

## Locations

- **Glossary**: [GLOSSARY.md](../../GLOSSARY.md) at the repository root defines ubiquitous terms, domain concepts, and naming rules.
- **Architectural Decision Records (ADRs)**: Stored in [`docs/adr/`](../adr/). Each ADR documents an important architectural decision, context, and consequences.

## Rules for Agents

1. **Check the Glossary**: Before introducing new abstractions or domain terms, consult `GLOSSARY.md` to maintain consistent terminology.
2. **Consult ADRs**: Before proposing structural or architectural changes, review existing ADRs in `docs/adr/` to respect established decisions.
3. **Record New Decisions**: When introducing significant architectural shifts, draft an ADR in `docs/adr/` following the existing format.
