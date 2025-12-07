---
title: "Operate Process"
summary: "Monitoring exports, handling renderer fallbacks, and retaining logs."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - process
  - operations
---

# Operate Process

## Requirements
- Access to VS Code logs (`Output` → `MarkPrint` or Debug Console when `markprint.debug: true`).
- Knowledge of manifest logging configuration (`profile.logging` fields).
- File system access to release/output directories.

## Monitoring Checklist
1. **Status Bar**: Build mode indicator + template label show current state; warnings appear when fallback prompts needed.
2. **Debug Logs**: Enable `markprint.debug` to log renderer hints, template selection, layout resolution.
3. **Problems Panel**: Zero errors indicates schema validation success.
4. **Logs**: If manifests define `profile.logging`, ensure directories exist and outputs recorded (feature placeholder for future automation).

## Handling Fallbacks
- If template missing, quick pick prompts user; reason displayed in status bar.
- If renderer hint mismatches engine, log entry warns but exports continue via Chromium.
- For repeated failures, inspect `extension.js` logs, verify manifest paths, or adjust `markprint.defaultTemplate`.

## Limitations
- No built-in telemetry export; rely on VS Code logs or future CLI instrumentation.
- Logging configuration fields exist but not fully wired (external/internally stored logs).

## Change History
- 2025-12-06: Added operate/monitoring process doc (Codex).
