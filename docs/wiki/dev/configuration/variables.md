---
title: "Configuration Variables"
summary: "Reference for markprint settings, defaults, and runtime impact."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - configuration
---

# Configuration Variables

## Requirements
- VS Code 1.60+ (settings system).
- Workspace `.vscode/settings.json` or user settings accessible.
- For CLI contexts, environment variables (e.g., `HTTPS_PROXY`) may be required for Chromium.

## Key Settings
| Setting | Default | Scope | Description / Impact |
| --- | --- | --- | --- |
| `markprint.buildMode` | `manual` | workspace | Controls export behavior (manual, auto, hybrid). |
| `markprint.type` | `["pdf"]` | workspace | Formats exported when running `MarkPrint: Export (settings.json)`. |
| `markprint.outputDirectory` | `""` | workspace | Relative/absolute path for outputs; manifest `profile.outputs` overrides. |
| `markprint.outputDirectoryRelativePathFile` | `false` | workspace | Interpret `outputDirectory` relative to file instead of workspace. |
| `markprint.styles` | `[]` | workspace | Additional CSS URIs/paths injected into HTML before render. |
| `markprint.stylesRelativePathFile` | `false` | workspace | Whether relative styles resolve from file location. |
| `markprint.includeDefaultStyles` | `true` | workspace | Include bundled markdown + highlight CSS. |
| `markprint.defaultTemplate` | `"standard-letter"` | workspace | Fallback template when metadata missing. |
| `markprint.templateFallbackMode` | `prompt` | workspace | Behavior when template missing (auto/prompt/disabled). |
| `markprint.convertOnSave` | `false` | workspace | Legacy flag; prefer `buildMode`. |
| `markprint.highlight` | `true` | workspace | Enable syntax highlighting in Markdown-to-HTML conversion. |
| `markprint.highlightStyle` | `""` | workspace | Named highlight.js theme (defaults to `tomorrow.css`). |
| `markprint.breaks` | `false` | workspace | Markdown-it line break behavior. |
| `markprint.emoji` | `true` | workspace | Enable emoji rendering using embedded PNGs. |
| `markprint.executablePath` | `""` | workspace | Path to existing Chrome/Chromium binary. |
| `markprint.scale` | `1` | workspace | PDF page render scale (passes to puppeteer). |
| `markprint.displayHeaderFooter` | `true` | resource | Controls puppeteer header/footer rendering. |
| `markprint.headerTemplate` | `<div ...>` | resource | HTML template for PDF header. |
| `markprint.footerTemplate` | `<div ...>` | resource | HTML template for PDF footer. |
| `markprint.format` | `"A4"` | resource | PDF paper format when width/height absent. |
| `markprint.margin.*` | `1cm` etc. | resource | Page margins for PDF. |
| `markprint.quality` | `100` | resource | JPEG quality (0-100). |
| `markprint.clip.*` | `null` | resource | Screenshot clipping options for PNG/JPEG. |
| `markprint.omitBackground` | `false` | resource | Transparent background for screenshots. |
| `markprint.plantuml*` | various | workspace | PlantUML delimiter/server configuration. |
| `markprint.mermaidServer` | `https://unpkg...` | workspace | Mermaid script URL. |
| `markprint.debug` | `false` | workspace | Enables verbose debug logging in console. |

## Environment Variables
| Variable | Purpose |
| --- | --- |
| `HTTPS_PROXY` / `HTTP_PROXY` | Allows Chromium download via proxies (set automatically from VS Code `http.proxy`). |
| `MARKPRINT_EXTENSION_PATH` | Injected at runtime to resolve `${extensionPath}` tokens (set by `extension.js`). |

## Limitations
- Many settings (especially `markprint.*` resource scoped) require VS Code resource scope; workspace settings may need to be duplicated per folder in multi-root setups.
- No CLI interface yet for overriding settings when running integration tests; rely on `settings.json`.

## Change History
- 2025-12-06: Added configuration variable reference table (Codex).
