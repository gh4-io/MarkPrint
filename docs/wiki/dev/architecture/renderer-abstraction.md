---
title: "Renderer Abstraction"
summary: "Deep dive into the current Chromium renderer pipeline and the planned multi-engine interface."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - architecture
  - renderers
---

# Renderer Abstraction

## Requirements
- `puppeteer-core` dependency installed (`npm install` in repo root).
- Chromium binary available (downloaded automatically or referenced via `markprint.executablePath`).
- VS Code extension host has network/file permissions to fetch layouts, schemas, and CSS.

## Current Implementation (Phase 1)
1. `extension.js` command handlers call `renderWithChromium`.
2. `renderWithChromium`:
   - Parses front matter (`gray-matter`), converts Markdown to HTML via `markdown-it`.
   - Injects styles via `readStyles` (pulling front matter, template resources, user settings).
   - Calls `exportPdf`/`exportHtml` wrappers that spawn Chromium with puppeteer.
3. All renderer hints are logged but ignored (Chromium only).

### Module Touchpoints
- `TemplateRegistry` sets `template.layoutRendererHint` used for logging.
- `debugLogger.log('renderer', ...)` records requested engine and actual engine.
- `schemaValidator` blocks export before renderer is invoked, ensuring metadata integrity.

## Limitations
- No interface boundary: renderer logic is intertwined with Markdown conversion.
- Hard-coded to puppeteer; switching engines would require touching `extension.js`.
- Lack of streaming data; full HTML is built before rendering (memory heavy for large documents).

## Phase 2 Goals
- Introduce `RendererRegistry` that maps engine IDs to driver modules.
- Split `renderWithChromium` into three stages:
  1. `prepareDocument({ template, frontMatter })` → returns normalized HTML + assets.
  2. `selectRenderer(engine, layoutHint)` → chooses driver (Chromium, Scribus CLI, DocBook pipeline).
  3. `driver.render({ html, template, options })` → returns outputs.
- Provide fallback/overrides so workspace settings can force specific engines.

### Proposed Interface (Pseudo-code)
```js
class RendererDriver {
  constructor(context) {}
  async render({ document, template, outputOptions }) {
    // return { pdfPath, htmlPath, metadata }
  }
}
```

## Risks & Considerations
- Alternative engines (Scribus, Playwright, Vivliostyle) have heavier dependencies; bundling must respect the “self-contained Node” rule.
- Some layout types (DocBook, Pandoc) may require conversion steps prior to renderer invocation.
- Need deterministic logging: restructure debug logs to include `requestedEngine`, `selectedEngine`, and `layoutHint`.

## Verification
- Unit/integration tests should cover renderer selection once registry exists.
- For now, `npm test` ensures current Chromium path remains stable.

## Change History
- 2025-12-06: Documented current renderer pipeline and phase 2 interface goals (Codex).
