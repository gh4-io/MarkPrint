---
title: "Documentation Policy"
summary: "Rules for maintaining the in-repo wiki and changelog."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - contribution
  - documentation
---

# Documentation Policy

## Requirements
- Every Markdown file under `docs/` must start with the metadata block defined in `.plan/WIKI_PROPOSAL.md`.
- Each directory requires an `index.md` referencing its children.
- All documentation changes must append to `docs/meta/docs-changelog.md`.

## Workflow
1. Update relevant docs in the same PR as code changes.
2. Ensure Quick/Full/Dev sections stay synchronized with actual functionality.
3. If new directories created, add them to `docs/README.md` navigation table.

## Limitations
- Images are currently discouraged; use text diagrams (Mermaid/ASCII) until asset pipeline defined.
- External wiki copies (GitHub Wiki, Confluence) must treat `docs/` as source of truth.

## Change History
- 2025-12-06: Added documentation policy (Codex).
