---
title: "Introduction to MarkPrint"
summary: "Overview of the utility, requirements, quick install, and documentation map."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - introduction
  - overview
---

# Introduction to MarkPrint

## General Understanding
MarkPrint is a VS Code extension and Node.js toolchain that converts Markdown with YAML front matter into high-fidelity PDFs, HTML, PNG, or JPEG outputs. It relies on **pipeline profiles** (manifests) to select layouts, renderer hints, and validation schemas. Phase 1 is Chromium-based; future phases will add multi-engine rendering while keeping the entire workflow self-contained in Node (no external CLIs unless vendored).

## Requirements
- **VS Code 1.60+** for the extension APIs and Problems panel integration.
- **Node.js 18+ / npm 9+** to run scripts, tests, and dependency installs.
- **Chromium access (~280 MB)** for the bundled renderer (automatically downloaded if not provided via `markprint.executablePath`).
- **Git workspace** containing templates, schemas, and docs (this repo or a downstream workspace following the same structure).

## Quick Install
```bash
git clone <repo>
cd MarkPrint
npm install
npm run test:download-vscode   # optional, once per environment
code .                         # open in VS Code and press F5 to launch Extension Development Host
```

## Limitations
- Renderer hints (`rendererHint: scribus`) are informational only until Phase 2’s renderer registry ships.
- Fonts referenced in CSS must exist on the system; they are not packaged automatically.
- Output automation (release packaging) is manual today; use runbooks under `docs/full-docs/operations/`.

## Documentation Map
| Track | Description | Link |
| --- | --- | --- |
| Quick Reference | Cheat sheets for five-minute tasks (exporting, build modes, metadata fixes). | [Quick Reference Index](../quick-reference/index.md) |
| Full Docs | Narrative guides for pipeline governance, renderer architecture, release runbooks. | [Full Docs Index](../full-docs/index.md) |
| Developer Docs | Architecture diagrams, configuration tables, build/test/deploy processes, contribution standards. | [Dev Index](../dev/index.md) |
| Governance & Standards | PRP, wiki rules, docs changelog. | [Docs / Meta](../meta/docs-changelog.md) |

## Related Specs
- `.plan/MarkPrint-impromptu-proposal.md`
- `.claude/prp/PRP_CORE.md`
- `docs/pipeline-profile-manifest-spec.md`
- `README.md`, `MIGRATION.md`, `TEST.md`

## Change History
- 2025-12-06: Added introduction section covering utility overview, requirements, and navigation (Codex).
