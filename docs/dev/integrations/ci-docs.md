---
title: "CI Documentation Hooks"
summary: "Ideas for linting, sanity checks, and link validation in automation."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - integrations
  - ci
---

# CI Documentation Hooks

## Requirements
- Access to CI/CD environment (GitHub Actions, Azure Pipelines, etc.).
- Ability to run Node.js scripts within pipeline.

## Suggested Checks
1. **Metadata Lint**: Script to ensure every `docs/**/*.md` begins with YAML front matter.
2. **Index Coverage**: Validate that each directory listed in `.plan/WIKI_PROPOSAL.md` contains an `index.md`.
3. **Link Validation**: Use tools like `markdown-link-check` or custom RG-based scripts to catch broken relative links.
4. **Changelog Enforcement**: Diff detection to ensure doc changes append to `docs/meta/docs-changelog.md`.

## Limitations
- No built-in scripts yet; future `.plan/tools/` addition could provide lint command.
- Some relative links depend on GitHub rendering; ensure CI environment matches path assumptions.

## Change History
- 2025-12-06: Added CI documentation integration ideas (Codex).
