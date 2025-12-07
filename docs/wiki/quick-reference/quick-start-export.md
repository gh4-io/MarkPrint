---
title: "Quick Start Export"
summary: "Five-minute checklist to install MarkPrint, select a pipeline profile, and produce exports."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - quick-track
  - exports
---

# Quick Start Export

## Requirements
- **Visual Studio Code 1.60+** (MarkPrint targets VS Code APIs introduced in the 1.60 line; tests use 1.106.3).
- **Node.js 18+** for running the extension locally and executing `npm` scripts (Chromium download helpers rely on modern TLS).
- **Disk space & bandwidth** for the Chromium binary (~280 MB download on first run).
- **Git workspace** with this repository cloned so templates, schemas, and docs are accessible.

## Quick Install
1. **Clone or open the repo**: `git clone ... && code MarkPrint`
2. **Install dependencies**: `npm install`
3. **Prepare VS Code test harness (optional but recommended)**:
   ```bash
   npm run test:download-vscode
   ```
4. **Open VS Code Extension Development Host** (F5) to load MarkPrint in a sandbox for manual verification.

> **Limitation:** Bundled Chromium download can be blocked by proxies/firewalls. Configure `http.proxy` in VS Code settings or set `HTTPS_PROXY` env vars before first run.

## Export Steps (Command Palette)
1. Open a Markdown document with YAML front matter.
2. Press `F1` / `Ctrl+Shift+P`, run `MarkPrint: Export (all: pdf, html, png, jpeg)` or pick a specific format.
3. If prompted for a template, pick **Standard Letter** or **DTS Master Report**; accept the option to insert metadata so `pipeline_profile` is written.
4. Wait for the status bar message “Chromium render complete” (or similar). Outputs land next to the Markdown file unless `markprint.outputDirectory` is set.

## Template Selection & Metadata Basics
```yaml
---
title: Sample SOP
pipeline_profile: standard-letter
layout_template: standard-letter # optional alias
document_id: SOP-200
revision: 1.0
---
```
- `pipeline_profile` is the canonical selector; `layout_template` remains as a legacy alias.
- Missing or invalid metadata triggers schema validation errors in the Problems panel; fix them before re-running exports.

## Verification
- **File output**: Ensure `.pdf/.html/.png/.jpeg` files match the document name and appear in the expected directory (`published/...` if the manifest overrides defaults).
- **Problems panel**: Should be empty after schema validation; warnings indicate optional fields or renderer hints.
- **Debug console** (set `markprint.debug: true` in settings) confirms which template, renderer, and layout were used.

## Troubleshooting (Common Pitfalls)
| Symptom | Resolution |
| --- | --- |
| Chromium download fails | Configure `http.proxy` / `HTTPS_PROXY`, rerun VS Code, or specify `markprint.executablePath` pointing to an existing Chrome binary. |
| “Template not found” prompt | Run `MarkPrint: Reload Templates`, verify `.markprint/templates/` exists, or confirm `pipeline_profile` matches the manifest file name. |
| Schema errors block export | Open the Problems panel, fix YAML front matter, use `docs/quick-reference/metadata-fixes.md` for patterns. |
| Styles not applied | Confirm CSS paths under `template.resources.css` exist; check the output log for “Stylesheet not found” with attempted paths. |

## Change History
- 2025-12-06: Initial quick-start checklist with requirements and troubleshooting (Codex).
