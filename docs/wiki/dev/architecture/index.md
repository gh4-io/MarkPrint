---
title: "Architecture Notes Index"
summary: "Tracks renderers, registries, and layout loaders."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - architecture
---

# Architecture Notes Index

## Scope
Document the moving parts that turn Markdown + metadata into outputs: `extension.js`, Template Registry, Layout Loader, renderer adapters, and planned multi-engine drivers.

## Guides
| File | Description |
| --- | --- |
| [Renderer Abstraction](renderer-abstraction.md) | Current Chromium flow plus roadmap for multi-engine support. |
| [Template Registry Flow](template-registry-flow.md) | Loading manifests, inheritance resolution, fallback selection. |
| [Layout Loader](layout-loader.md) | Descriptor resolution, SLA parsing, renderer hints. |

## Contribution Tips
- Prefer sequence diagrams or tables to describe flows.
- Include data contracts (what metadata enters/exits each module).
- Keep `## Change History` per page.

## Change History
- 2025-12-06: Created architecture index scaffold (Codex).
