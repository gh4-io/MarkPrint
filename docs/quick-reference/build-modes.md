---
title: "Build Modes Cheat Sheet"
summary: "Compare manual, auto, and hybrid build modes with setup requirements and limitations."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - quick-track
  - build-modes
---

# Build Modes Cheat Sheet

## Requirements
- MarkPrint extension installed (either from Marketplace build or local Extension Development Host).
- VS Code workspace with Markdown documents using `pipeline_profile`.
- Optional: Node.js 18+ to run `npm config` scripts or debug logging.

## Quick Install / Config
1. Open VS Code settings (`Ctrl+,`) or workspace `.vscode/settings.json`.
2. Set `markprint.buildMode` to one of:
   ```jsonc
   {
     "markprint.buildMode": "manual", // default
     "markprint.convertOnSave": false // legacy flag (leave false unless migrating)
   }
   ```
3. Access the status bar gear (right-hand “MarkPrint: MANUAL”) or run `MarkPrint: Change Build Mode` to switch interactively.

## Modes at a Glance
| Mode | Behavior | Best For | Limitations |
| --- | --- | --- | --- |
| `manual` (default) | Export only when commands run (e.g., `MarkPrint: Export (pdf)`). | Regulated workflows, long-running documents. | Requires manual action; no automatic validation on save. |
| `auto` | Full export on every save (Chromium rendering fires automatically). | Rapid iteration on short docs, demos. | Heavy on resources for large docs; respect proxy/Chromium download limits. |
| `hybrid` | On save: schema validation + lightweight HTML preview (future hook), but full exports still manual. | Teams wanting validation feedback without full render. | Preview is limited; actual exports still require commands. |

## Switching Modes (Status Bar)
1. Click the “MarkPrint: MANUAL” status bar item.
2. Choose **Manual**, **Auto**, or **Hybrid** from the quick pick.
3. Confirm informational message “Build mode changed to: X”.

## CLI / Settings Automation
- Use VS Code `settings.json` per workspace to enforce build modes for sensitive repos.
- For CI or remote environments, keep `manual` and drive exports via CLI scripts (`npx vsce package` + automated tests) instead of `auto`.

## Known Limitations
- `markprint.convertOnSave` is deprecated; keeping it `true` will show warnings (extension still respects it but logs guidance to switch to build modes).
- Auto mode triggers the same pipeline as manual exports; long-running documents may block other VS Code tasks until Chromium completes.
- Hybrid mode currently only validates metadata and sets a status message; the HTML preview hook is a placeholder for future renderer abstraction (Phase 2).

## Verification Checklist
- Toggle mode, save a Markdown file, confirm expected behavior (auto exports fire, hybrid only validates, manual stays idle).
- Watch the status bar for `$(check) Template validation passed` or renderer warnings.
- Review debug logs (`markprint.debug: true`) to confirm build-mode values logged with each export.

## Change History
- 2025-12-06: Created build-mode quick reference including requirements/limitations (Codex).
