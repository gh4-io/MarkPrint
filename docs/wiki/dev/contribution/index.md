---
title: "Contribution Guide Index"
summary: "Defines coding, testing, and documentation expectations for contributors."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - contribution
---

# Contribution Guide Index

## Scope
Document how to propose changes, run tests, update docs, and coordinate releases. Tie each guideline back to the workflows described in `.plan/MarkPrint-impromptu-proposal.md` and the PRP.

## Guides
| File | Description |
| --- | --- |
| [Coding Standards](coding-standards.md) | Node/VS Code extension conventions, logging requirements. |
| [Testing Expectations](testing.md) | Required test suites and verification flows. |
| [Documentation Policy](docs-policy.md) | Metadata, changelog, wiki maintenance rules. |

## Contribution Checklist
1. Branch off the latest mainline, follow naming guidelines (e.g., `feature/`, `docs/`).
2. Update code, tests, and docs together.
3. Run `npm run test:download-vscode` once per environment, then `npm test`.
4. Update `docs/meta/docs-changelog.md` and relevant indexes.
5. Submit PR with summary + validation evidence.

## Change History
- 2025-12-06: Created contribution index scaffold (Codex).
