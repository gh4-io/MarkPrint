---
title: "Documentation Library Overview"
summary: "Entry point for navigating the MarkPrint in-repo wiki."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - documentation
  - governance
---

# Documentation Library Overview

## Overview
The `./docs` tree is the authoritative wiki for MarkPrint. It mirrors the structure defined in `.plan/WIKI_PROPOSAL.md` so that quick answers, full runbooks, and contributor material ship with the code. Every page includes metadata, is referenced from an `index.md`, and is tracked via `docs/meta/docs-changelog.md`.

## Directory Map
| Path | Purpose | Key Links |
| --- | --- | --- |
| `docs/introduction/` | High-level overview, requirements, and navigation map. | [Introduction](introduction/index.md) |
| `docs/quick-reference/` | Fast ramp content and cheat sheets. | [Quick Reference Index](quick-reference/index.md) |
| `docs/full-docs/` | Narrative guides, pipeline/renderer docs, operations runbooks. | [Full Docs Index](full-docs/index.md) |
| `docs/dev/` | Architecture, configuration, process, integrations, contribution. | [Dev Index](dev/index.md) |
| `docs/meta/` | Governance artifacts, standards, changelog. | [Documentation Change Log](meta/docs-changelog.md) |

## Navigation Tracks
### Quick Track
- Audience: operators who need exports working in minutes.
- Start with [Quick Start Export](quick-reference/quick-start-export.md) then branch to build modes or metadata fixes as needed.

### Normal Track
- Audience: publishing teams managing controlled documents.
- Use the [Full Docs Index](full-docs/index.md) to dive into pipeline governance, renderer behavior, and release runbooks.

### Dev Track
- Audience: template authors and contributors.
- Visit the [Dev Index](dev/index.md) for architecture diagrams, configuration tables, build/test/deploy processes, and contribution standards.

## Maintenance Expectations
- Follow the standards in [`.plan/WIKI_PROPOSAL.md`](../.plan/WIKI_PROPOSAL.md) (this file is mirrored into `docs/meta/` when needed).
- Update metadata dates whenever content changes or gets audited.
- Log every substantive doc change in `docs/meta/docs-changelog.md`.
- Ensure new folders include an `index.md` landing page and reference their children.

## Change History
- 2025-12-06: Created initial library overview and navigation map (Codex).
