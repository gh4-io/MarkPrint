---
title: "Configuration Registry Index"
summary: "Centralizes environment variables, VS Code settings, and schema references."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - configuration
---

# Configuration Registry Index

## Scope
Track every configuration control point: `package.json` settings, `markprint.*` options, `.env` variables (if added later), and schema files under `.markprint/schemas/`.

## Guides
| File | Description |
| --- | --- |
| [Variables](variables.md) | `markprint.*` settings, defaults, scope, and impact. |
| [Schemas](schemas.md) | Overview of `.markprint/schemas/*.json` and customization tips. |
| [Outputs & Directories](outputs-and-directories.md) | How manifest outputs interact with workspace settings. |

## Authoring Notes
- Every time `package.json` or `.markprint/schemas/` changes, update this section and the docs changelog.
- Include cross-links back to relevant manifests or code modules.

## Change History
- 2025-12-06: Created configuration index scaffold (Codex).
