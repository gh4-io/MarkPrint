---
title: "Implementation Prompt: Phase 2 Renderer Enablement"
owner: "Codex"
status: "Ready"
date: "2025-12-05"
read: "docs/pipeline-profile-manifest-spec.md"
read: "templates/dts-master-report.json"
read: "templates/layouts/dts-master-report.layout.json"
read: ".plan/ref/DTS_Master_Report_Template.sla"
read: "src/templateRegistry.js"
read: "src/layoutLoader.js"
read: "extension.js"
read: "test/suite/template.test.js"
read: ".plan/MarkPrint-impromptu-proposal.md"
read: "README.md"
read: "MIGRATION.md"
---

# Objective

Complete Phase 2 by wiring the renderer abstraction so SLA/DocBook layouts can drive actual output (or a faithful stub) while keeping Chromium support intact. No prior context assumed—everything required lives in the files listed above.

# Current Baseline

1. **Pipeline profiles** (`templates/*.json`) use the new manifest structure. `pipeline_profile` selection is live; `layout_template` only aliases legacy docs.
2. **Layout loader** (`src/layoutLoader.js`) resolves CSS/JSON/SLA/XML files, parses Scribus `.sla` frames, and logs descriptive errors if artifacts are missing.
3. **Renderer hook** in `extension.js` logs renderer hints but still routes everything through Chromium (`makeHtml` + Puppeteer). Layout hints (e.g., `"scribus"`) only produce warnings.
4. **Schema validation** (`src/schemaValidator.js`) enforces profile schemas in `.markprint/schemas/`. Errors block export.
5. **Error hygiene**: `markprint.styles` resolution now surfaces exact paths tried; `readFile` throws on missing assets; exports halt with actionable toast messages.
6. **Tests**: `test/suite/template.test.js` covers profile precedence and layout loader basics. `npm test` currently fails because `.vscode-test/vscode-1.106.3/Code.exe` is missing.

# Phase 2 Requirements

## 1. Renderer Abstraction
- Introduce a renderer registry/interface (e.g., `src/renderers/index.js` with `chromiumRenderer`, `scribusRenderer`, future `weasyprintRenderer`).
- Move all Chromium-specific logic (`convertMarkdownToHtml`, `makeHtml`, `exportPdf`) into the Chromium renderer module.
- `extension.js` should select the renderer based on `template.renderer.engine` and `layout.rendererHint` (layout hint overrides profile if compatible).

## 2. Scribus / SLA Execution (MVP)
- For `layout.type === "sla"` or `layout.rendererHint === "scribus"`, call a Scribus renderer instead of Chromium.
- Minimum viable behavior: generate an exchange artifact (JSON/XML) describing metadata, frames, and content, then
  - either invoke Scribus CLI if available, or
  - write out the handoff files plus a log explaining how to run Scribus manually.
- The renderer must log: SLA source path, exchange files, intended output path, and any assumptions.
- If Scribus automation isn’t feasible yet, implement a stub renderer that writes the handoff bundle and returns a clear message so testers can review inputs manually.

## 3. DocBook / Pandoc / OpenDocument XML Support Prep
- Extend `LayoutLoader` so `type === "docbook"` / `"pandoc"` validates referenced stylesheet/filter files with the same error rigor as SLA.
- Renderer interface should surface `artifactMappings.docbook` data so future renderers can consume style maps.

## 4. Outputs & Directories
- Begin honoring `profile.outputs.*.target_directory` for HTML/PDF at least.
- Define precedence vs. `markprint.outputDirectory`. Suggested rule: profile output directory wins when defined; otherwise fall back to the setting; log whenever a conflict occurs.

## 5. Logging & Telemetry
- Every render run should log renderer name, version (if available), layout source, renderer hints, and final output path(s).
- Errors thrown by renderers must include asset paths just like Phase 1 (no silent failures).

## 6. Testing & Tooling
- Fix `npm test` by reinstating the VS Code test binary (document the manual step or automate download).
- Add unit tests for renderer selection and for the new stylesheet/layout resolution behavior.
- Include an integration test that exercises the Scribus renderer stub (verifying exchange files/logs).

## 7. Documentation
- Update `docs/` with individueal moduels, README, and MIGRATION notes to cover renderer engines, how `profile.outputs` now affects directories, and what users must install/configure for Scribus.
- Document the manual steps to enable Scribus in real environments (even if it’s “install Scribus CLI manually and configure this setting”).

# Constraints

- Chromium rendering must remain the default and fully functional.
- No assumptions about user environment; list every dependency or manual step explicitly.
- Keep path resolution robust—reuse helpers for `${extensionPath}` tokens and logging style.
- Be explicit about behavior when features are stubs (e.g., Scribus renderer writes a bundle but doesn’t invoke Scribus yet).

# Deliverables Checklist

- [ ] Renderer registry/interface with Chromium + Scribus implementations.
- [ ] Chromium renderer extracted from `extension.js`.
- [ ] Scribus renderer stub or real CLI hook with clear handoff artifacts.
- [ ] Layout loader/docbook validation enhancements.
- [ ] `extension.js` simplified to select renderer + honor `profile.outputs`.
- [ ] Output directory precedence implemented and logged.
- [ ] Documentation updates (README, MIGRATION, pipeline profile spec).
- [ ] Tests covering renderer selection, Scribus stub, and path resolution.
- [ ] VS Code test binary restored so `npm test` runs successfully.

This prompt is self-contained; the next implementer should be able to start Phase 2 using only this file and the resources listed in the front matter.
