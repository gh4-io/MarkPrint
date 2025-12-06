---
title: "Pipeline Profiles Overview"
summary: "Explains manifest anatomy, inheritance, resources, and governance requirements."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - pipelines
  - governance
---

# Pipeline Profiles Overview

## Requirements
- MarkPrint extension or workspace must include `templates/*.json` manifests plus referenced layout artifacts under `templates/layouts/`.
- `.markprint/schemas/*.json` must be accessible from either the extension path or workspace overrides.
- Node.js 18+ and VS Code 1.60+ ensure AJV validation, Template Registry loading, and telemetry hooks operate correctly.

## Quick Install / Setup
1. Clone or open the MarkPrint repo (or your downstream workspace).
2. Verify `templates/` contains at least one manifest (e.g., `standard-letter.json`).
3. Run `npm install` followed by `MarkPrint: Reload Templates` inside VS Code to load manifests into the registry.

## Manifest Anatomy
Each manifest follows `.markprint/schemas/pipeline-profile.schema.json`:

```jsonc
{
  "$schema": ".markprint/schemas/pipeline-profile.schema.json",
  "extends": "standard-letter",
  "profile": {
    "id": "dts-master-report",
    "label": "DTS Master Report",
    "schema": ".markprint/schemas/dts-master-report.schema.json",
    "renderer": { "engine": "chromium" },
    "outputs": { "pdf": { "filename_pattern": "{document_id}.pdf" } }
  },
  "layout": {
    "type": "sla",
    "source": "${extensionPath}/.plan/ref/DTS_Master_Report_Template.sla",
    "rendererHint": "scribus",
    "converter": { "type": "frameMap", "target": "chromium" }
  },
  "resources": {
    "css": ["${extensionPath}/styles/dts-master-report.css"],
    "fonts": [{ "family": "Trebuchet MS", "style": "Regular", "weight": 400 }]
  },
  "artifactMappings": {
    "scribus": { "frames": "...", "masters": { "first_page": "MP_FIRST" } }
  }
}
```

## Inheritance Model
1. Template Registry loads bundled manifests then workspace overrides.
2. `extends` merges parent → child recursively, deep-cloning JSON objects (arrays overwrite entirely).
3. Child values override parent values, except `extends` is removed after merge.

### Text Diagram
```
standard-letter (parent)
├─ profile.outputs.pdf.target_directory = "published/pdf"
└─ layout.source = templates/layouts/standard-letter.layout.json

dts-master-report (child)
└─ extends standard-letter
    ├─ inherits outputs, fonts
    └─ overrides layout.type = "sla"
```

## Layout Descriptors & Renderer Hints
- `type: "json"` or `"xml"` loads simple frame maps.
- `type: "sla"` parses Scribus files, capturing frames and margins; `rendererHint: scribus` logs desired renderer without blocking Chromium fallback.
- `type: "docbook"` / `"pandoc"` reserve metadata for future converters.
- Use `${extensionPath}`, `${workspaceFolder}`, `${manifestDir}` tokens for portability.

## Resources
- CSS entries resolve via `stylesheetResolver.js` (document → workspace → extension search).
- Font declarations document required families but do not auto-install fonts; ensure OS fonts or packaged webfonts exist.
- Assets list additional files copied into temp render directories (future release packaging).

## Governance & Compliance
- Every manifest update requires:
  1. Schema update if metadata fields changed.
  2. Changelog entries (both docs and user-facing `CHANGELOG.md` if behavior shifts).
  3. Tests (update `test/.test-workspace/` fixture + `test/suite/template.test.js` if loader behavior changes).
- Deprecated manifests should set `profile.status: "Deprecated"` (future field) and remain until references are cleared.

## Limitations
- Renderer hints are informational; Chromium is the only production renderer today.
- Layout conversion assumes SLA time units in points; unusual documents may need extra converter hooks.
- Resource arrays do not currently validate file existence at load time; missing CSS logs warnings only when rendering.

## Change History
- 2025-12-06: Authored manifest overview with inheritance and governance guidance (Codex).
