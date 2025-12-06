---
title: "Full Documentation Index"
summary: "Roadmap for narrative guides, SOPs, and policy documentation."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - normal-track
---

# Full Documentation Index

## Overview
Use this section for end-to-end explanations, policy write-ups, and SOPs that require more than a quick cheat sheet. Each subdirectory should reflect a domain (e.g., `pipelines/`, `renderers/`, `operations/`) and must include its own `index.md`.

## Current Topics
| Folder | Purpose | Key Docs |
| --- | --- | --- |
| `pipelines/` | Manifest governance, schema expectations, inheritance walkthroughs. | [Pipeline Profiles Overview](pipelines/overview.md) |
| `renderers/` | Renderer architecture today + Phase 2 plans. | [Renderer Overview](../full-docs/renderers/overview.md) |
| `operations/` | Runbooks for day-to-day publishing. | [Release Runbook](operations/release-runbook.md) |

## Authoring Checklist
1. Include the standard metadata block with owner, status, and review dates.
2. Follow the canonical outline (`Overview`, `Prerequisites`, `Steps`, `Examples`, `Troubleshooting`, `Change History`).
3. Cross-link quick-reference material and dev docs so readers can hop between depth levels.
4. Update parent indexes and the docs changelog when publishing.

## Change History
- 2025-12-06: Added Full Docs index scaffold (Codex).
