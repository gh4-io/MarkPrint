---
title: "Scribus Integration"
summary: "How MarkPrint consumes Scribus .sla layouts and future renderer plans."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - integrations
  - scribus
---

# Scribus Integration

## Requirements
- Scribus `.sla` files included in manifests (`layout.type: "sla"`).
- Frame map JSON derived from Scribus (e.g., `templates/layouts/dts-master-report.layout.json`).
- `cheerio` available for XML parsing (`npm install` already covers).

## Workflow
1. Manifest sets `layout.type = "sla"` and `layout.source = path/to/file.sla`.
2. `layoutLoader.loadSla()` parses document/pagemargins and frames.
3. Frames stored in `template.layoutArtifact.data.pages` for downstream use.
4. `artifactMappings.scribus` references master pages and derived frame maps.

## Renderer Hint
- `layout.rendererHint: "scribus"` signals preferred renderer. Currently logged only.
- Phase 2 will route to a Scribus driver (either CLI automation or exchange format) when available.

## Limitations
- SLA parsing currently extracts geometry only; text/story content not imported.
- No direct Scribus automation yet; manual steps required to edit `.sla` sources.

## Change History
- 2025-12-06: Documented Scribus SLA integration (Codex).
