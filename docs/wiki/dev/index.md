---
title: "Developer Documentation Index"
summary: "Navigation hub for architecture, configuration, processes, integrations, and contribution docs."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - dev-track
---

# Developer Documentation Index

## Overview
This track is for template authors, extension contributors, and automation engineers. It complements the `.plan` prompts by capturing durable knowledge (architecture diagrams, environment settings, renderer strategies) under version control.

## Sections
| Path | Focus | Status |
| --- | --- | --- |
| `architecture/` | Runtime structure, renderer abstraction, template registry data flow. | Seed index in place. |
| `configuration/` | Environment variables, VS Code settings, schema references, dependency matrices. | Seed index in place. |
| `process/` | Build/test/deploy/operate phases with inputs, outputs, verification, rollback. | Seed index in place. |
| `integrations/` | External services (Chromium, Scribus tools, telemetry, CI). | Seed index in place. |
| `contribution/` | Coding standards, testing requirements, documentation duties, PR checklist. | Seed index in place. |

## Working Agreements
- Update docs whenever code changes templates, renderers, configuration defaults, or workflows.
- Add labs/tests to `test/` and document them here (especially new renderer cases).
- Reference `.plan/WIKI_PROPOSAL.md` for metadata and changelog requirements.

## Change History
- 2025-12-06: Added Dev index scaffold (Codex).
