# Migration Guide

This guide walks through the steps required to move existing workspaces to the new **pipeline profile** model that launched with the multi-engine layout refactor.

## 1. Update Front Matter

- Add `pipeline_profile` to each Markdown document’s YAML block. This is now the canonical selector.
- Keep `layout_template` only if you have downstream tooling that still inspects it—MarkPrint continues to populate both keys for safety.

```yaml
---
title: Create Workpackage Sequencing Type
pipeline_profile: dts-master-report
layout_template: dts-master-report # optional legacy alias
document_id: SOP-200
revision: 1.0
---
```

## 2. Adopt the Pipeline Profile Schema

- Bundled templates now follow `.markprint/schemas/pipeline-profile.schema.json`:
  - `profile`: metadata (id/label/version/category/schema/outputs/buildMode/logging)
  - `layout`: descriptor (`type`, `source`, `rendererHint`, converter hints) — author new layouts in XML/DocBook, keeping JSON/Scribus data only for compatibility
  - `resources`: CSS bundles, fonts, assets, conversion filters
  - `artifactMappings`: DocBook/Pandoc style maps, Scribus master/page bindings, etc.
- Update any custom templates in `.markprint/templates` to match this structure. Standard Letter and DTS Master Report show concrete examples.

## 3. Store Layout Artifacts Next to Profiles

- XML/DocBook layouts are the canonical artifacts and live in `templates/layouts/`. Author new work here so the loader can consume XML directly.
- JSON descriptors now serve as compatibility or generated artifacts (`*.layout.json`). Scribus `.sla`, CSS bundles, and Pandoc sources can live in the same folder; reference them with `${extensionPath}` / `${workspaceFolder}` tokens but plan to convert them to XML before rendering.
- The new `LayoutLoader` resolves these descriptors at runtime and always normalizes them to XML, so there is no longer a need to pre-export CSS/HTML manually.

## 4. Mind Renderer Hints

- Each profile has `profile.renderer` (currently `"chromium"`). Layout descriptors can also set `rendererHint` (e.g., `"scribus"`).
- The current exporter still renders everything with Chromium, but non-Chromium hints are logged so Phase 2 can route them to Scribus/WeasyPrint later.

## 5. Re-run Tests

- Execute `npm test` (or `xvfb-run -a npm test` on headless Linux).
- The suite now covers:
  - `pipeline_profile` vs. `layout_template` precedence and fallback to `markprint.defaultTemplate`
  - Layout loader conversions for XML/DocBook manifests (plus JSON/Scribus fallbacks)
  - Renderer hint logging to the debug console

If VS Code cannot be spawned (common on CI without a GUI), install the requirements listed in [TEST.md](TEST.md) or run via `xvfb-run`.

## Troubleshooting Checklist

- **Schema failures**: ensure `pipeline_profile` is present and matches the manifest ID (hyphen/underscore aliases are acceptable). Re-run `MarkPrint: Reload Templates` if you edited manifests.
- **Layout not found**: confirm the descriptor `source` resolves (tokens expand correctly, file exists inside the extension or workspace).
- **Renderer warnings**: informational only for now-Chromium is always used. Keep the log handy so you know which profiles will need attention when alternate engines arrive.

## 6. Settings & Defaults

- `markprint.styles` can stay empty when you are happy with the bundled `${extensionPath}/styles/*.css`. When you do add entries, the resolver now tries the Markdown document folder first, then the workspace, and finally the extension install. Missing files raise `"Stylesheet not found..."` so you can quickly see which paths were attempted.
- Leaving `markprint.outputDirectory` blank writes PDF/HTML/PNG exports next to the Markdown file. Use workspace-absolute paths only when you need a shared `sample/` directory.
- `markprint.convertOnSave` is deprecated. Switch to `markprint.buildMode = "auto"` (full exports on save) or `"hybrid"` (validation on save, manual exports) and remove the legacy flag to avoid repeated warnings.

## 7. Dependency Notes

- `npm ls` now runs clean. Upgrading `cheerio` to `^1.1.0` removed the old `punycode` deprecation warning and ensures Chromium export logs stay focused on real issues.

---

## Phase 2: Renderer Abstraction (Internal Changes Only)

**Version**: 1.5.0+
**Date**: 2025-12-06
**User Impact**: None (pure refactoring)

### What Changed

Phase 2 refactored the Chromium rendering logic into a modular renderer system. **No user-facing changes** — all commands, settings, and templates work identically.

**Internal Changes**:
- Extracted Chromium logic from `extension.js` into `src/renderers/chromiumRenderer.js`
- Created `RendererRegistry` for managing multiple rendering engines
- Implemented `IRendererDriver` interface for future renderers (Playwright, Vivliostyle, etc.)
- Added hierarchical output directory resolution: `profile.outputs.*.target_directory` → `markprint.outputDirectory` → source directory
- Enhanced logging: renderer selection, version, and output directory precedence

### Migration Required

**None**. Existing templates, settings, and workflows continue to work without modification.

### New Capabilities (Opt-In)

Templates can now specify `outputs.*.target_directory` in their pipeline profile:

```json
{
  "profile": {
    "id": "my-template",
    "outputs": {
      "pdf": {
        "target_directory": "${workspaceRoot}/dist/reports"
      }
    }
  }
}
```

This overrides `markprint.outputDirectory` for that template only.

### Debugging

Enable `markprint.debug: true` to see renderer selection logs:

```
[renderer] Renderer registry initialized
  available: ["chromium"]
  default: "chromium"

[renderer] Selected renderer
  name: "chromium"
  version: "2.1.1"

[renderer] Using profile output directory
  directory: "${workspaceRoot}/dist"
  precedence: "profile"
```

### Testing

No changes to test execution:
- `npm test` continues to work (requires Chromium dependencies in WSL2)
- New tests added: `test/suite/renderer.test.js` (unit tests for renderer system)

### Future

Phase 3 will add Playwright and Vivliostyle renderers. Templates can start using `renderer.engine` and `layout.rendererHint` now — they will be honored when those engines are added.
