---
title: "Chromium Integration"
summary: "Details on puppeteer-core, Chromium downloads, and proxy configuration."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - integrations
  - chromium
---

# Chromium Integration

## Requirements
- `puppeteer-core@2.x` (installed via `npm install`).
- Network access to Chrome download servers or alternative Chromium binary path.
- VS Code environment that permits launching headless browsers.

## Download Workflow
1. `extension.js` `init()` checks for existing binary (`puppeteer.executablePath()` or `markprint.executablePath`).
2. If missing, `installChromium()` runs `browserFetcher.download` (puppeteer).
3. Progress logged in status bar; proxies pulled from VS Code `http.proxy` or env vars.

## Proxy / Offline Support
- Set `http.proxy` in VS Code settings (UI) or `HTTPS_PROXY` / `HTTP_PROXY` before launching.
- Alternatively, specify `markprint.executablePath` pointing to a system Chrome installation to bypass download.

## Limitations
- Bundled Chromium updates when puppeteer-core version changes; keep dependencies current.
- No checksum validation beyond puppeteer’s built-in checks.

## Change History
- 2025-12-06: Created Chromium integration doc (Codex).
