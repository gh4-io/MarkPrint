---
title: "Implementation Prompt: Pipeline Profiles & Multi-Engine Layouts"
owner: "Codex (handoff)"
status: "Ready"
date: "2025-12-04"
read: ".plan/MarkPrint-impromptu-proposal.md"
read: ".plan/ref/plan/ssp-automation-implementation-plan.md"
read: "whats-next.md"
read: ".plan/ref/layout_profile_dts_master_report.json"
read: ".plan/ref/DTS_Master_Report_Template.sla"
read: "templates/dts-master-report.json"
read: "templates/standard-letter.json"
read: ".markprint/schemas/standard-letter.schema.json"
read: ".markprint/schemas/dts-master-report.schema.json"
---

# Context Recap

- Current templates (e.g., `templates/dts-master-report.json`) act as both “profile” and “layout.” We need to reintroduce the original dual-layer design: a **pipeline profile** (front-matter `pipeline_profile`) that references a **layout artifact** (CSS, JSON, Scribus `.sla`, XML/DocBook/Pandoc).
- Front matter today already contains `pipeline_profile` in legacy SOP docs (see `test/.test-workspace/SOP-200_Create_Workackage_Sequencing_Type.md:17`), but the engine still keys off `layout_template`. \*We must make `pipeline_profile` the canonical selector and keep `layout_template` as a compatibility alias.*
- SLA/XML/DocBook files must be loaded and converted **inside** the export pipeline (no manual pre-processing). The conversion output feeds the existing Chromium renderer. Long term we need a renderer abstraction so certain profiles can request alternate engines (Scribus/WeasyPrint/Pandoc), but in this pass we only build the hooks.
- Supported artifact types for layouts/resources: XML/DocBook (preferred), JSON, Scribus `.sla`, CSS, Pandoc helpers, plus metadata mappings (e.g., field → frame mapping from `.plan/ref/layout_profile_dts_master_report.json`). XML descriptors should be treated as the authoritative layout representation, with JSON reserved for legacy manifests or generated artifacts.
- Conversion tooling (LayoutLoader, schema validator, downstream helpers) should assume XML-first expertise: favor XPath/xmldom utilities, validate XML schemas, and only map back to JSON when interoperability demands it.

# Goals

1. **Manifest Redesign** – introduce a schema that separates:
   - `profile` metadata (id/label/version/category, schema path, outputs, logging)
   - `layout` descriptor (type = xml|docbook|json|css|sla|pandoc, source path/URI w/ token expansion, optional rendererHint; XML/DocBook is the canonical path for new work, with JSON retained for compatibility)
   - `resources` (CSS bundles, fonts, assets, conversion filters)
   - `artifactMappings` (e.g., DocBook style map, Pandoc filters, SLA frame bindings)

2. **Engine Enhancements** – `src/templateRegistry.js`, render orchestrator, and `schemaValidator` must:
   - Prefer `pipeline_profile` when selecting a profile; `layout_template` is read only if `pipeline_profile` missing.
   - Resolve layout references via the new descriptor, load the artifact (XML/DocBook by default, with SLA/JSON/other types funneled through XML conversion), and convert to the neutral frame model before rendering so the engine remains XML-first.
   - Keep conversion in-process (no pre-generated CSS files to copy around).

3. **Renderer Abstraction Hook** – without switching engines yet, define an interface that captures:
   - `renderer: "chromium"` (default), with placeholders for `"scribus"` / `"weasyprint"` etc.
   - Each profile/layout can declare `rendererHint`, but today the Chromium path just logs unsupported hints. This sets up Phase 2 where we actually split the renderer.

4. **Documentation/Config Updates** – align `MarkPrint-impromptu-proposal.md`, `whats-next.md`, README, MIGRATION, TEST docs, etc., with the new terminology (pipeline profile) and note the future move to multi-engine rendering.

5. **Testing** – extend existing tests or add new ones (`test/suite/template.test.js` etc.) to cover:
   - Selecting a profile via `pipeline_profile`.
   - Falling back to `defaultTemplate` when both keys missing.
   - Loading different layout artifact descriptors (use mock JSON + stub SLA loader that reads `.plan/ref/layout_profile_dts_master_report.json` for now).

# Implementation Steps

1. **Research & Inventory**
   - Compare `templates/*.json`, `.plan/ref/layout_profile_dts_master_report.json`, `.plan/ref/DTS_Master_Report_Template.sla`.
   - Capture required fields for `profile`, `layout`, `resources`, `artifactMappings`.
   - Decide JSON schema updates (likely under `.markprint/schemas/`).

2. **Manifest & Schema Updates**
   - Introduce a new schema for pipeline profiles (e.g., `.markprint/schemas/pipeline-profile.schema.json`).
   - Update existing template manifests to follow the new structure (do not replace entire files—modify in-place).
   - Ensure `prepare-test-workspace.js` copies any new schema/template files into the sandbox.

3. **Template Registry & Resolver**
   - Update `src/templateRegistry.js` to:
     - Look for `pipeline_profile` first, `layout_template` second.
     - Load layout descriptors and pass them to a new `LayoutLoader` helper.
     - Store resolved layouts on the template object for downstream consumers.
   - Create `src/layoutLoader.js` (or similar) capable of:
     - Handling `type === "xml"` / `type === "docbook"` as the primary pipeline: parse XML into the neutral frame/resource model, validate it, and expose converter helpers so every renderer consumes XML-derived data.
     - Handling `type === "json"` for legacy descriptors or generated derivatives without introducing new JSON-only authoring paths.
     - Handling `type === "sla"` by extracting metadata (frames, master pages) and emitting XML descriptors for the remaining pipeline.
     - Handling `type === "css"` and `type === "pandoc"` by loading stylesheets/filters and attaching them to the XML-centric conversion context.

4. **Renderer Hook**
   - Add a renderer descriptor per profile/layout with shape `{ "engine": "chromium", "options": { ... } }`.
   - In the current renderer path (where we build HTML + Puppeteer), log the active engine; if it isn’t Chromium, log a warning but continue (future work will branch on this).
   - Ensure `schemaValidator` and export paths can retrieve renderer info from the template/profile.

5. **Documentation & Settings**
   - Update:
     - `MarkPrint-impromptu-proposal.md` – reflect pipeline profile terminology, multi-engine plan.
     - `whats-next.md` – already appended summary; ensure new structure consistent.
     - README / MIGRATION / TEST docs – mention `pipeline_profile`, layout registry, and explicitly call out XML/DocBook layouts as the preferred canonical format (with JSON noted as legacy).
   - Consider a new setting (`markprint.defaultPipelineProfile`?) or reuse `markprint.defaultTemplate` but document that it now refers to profiles.

6. **Testing**
   - Extend unit tests in `test/suite/template.test.js` (or create new ones) to cover:
     - Profile selection priority (`pipeline_profile` vs `layout_template`).
     - Layout loader behavior for JSON + stub SLA descriptors.
     - Renderer hint logging.
   - Manual test: run `npm test` (after ensuring dependencies installed) and `MarkPrint: Export (pdf)` using a profile referencing the new layout descriptor.

7. **Future Placeholder**
   - Document follow-up tasks for the true multi-engine support (Scribus/WeasyPrint), but do not implement renderer switching yet.

# Deliverables Checklist

- [ ] Updated template/profile manifests + schemas
- [ ] New layout loader / profile resolver code
- [ ] Renderer hint hook with logging
- [ ] Docs updated (proposal, README, MIGRATION, TEST, whats-next)
- [ ] Tests covering new selection logic and loader behavior

# Notes for the Implementer

- Work incrementally (no wholesale file replacements)—use small `apply_patch` updates.
- Keep conversion logic inside the VS Code extension runtime; no external preprocessing scripts.
- Maintain existing behaviors (CSS-only templates should still work without changes).
- Use `pipeline_profile` in new examples/front matter; mention `layout_template` only for legacy docs.
