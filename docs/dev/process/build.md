---
title: "Build Process"
summary: "Preparing the MarkPrint extension and workspace for development."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - process
  - build
---

# Build Process

## Requirements
- Node.js 18+ and npm 9+.
- Git + VS Code installed.
- Disk space for dependencies and Chromium (~500 MB total).

## Quick Install
```bash
git clone <repo>
cd MarkPrint
npm install
```

## Steps
1. **Install Dependencies**
   - `npm install` pulls extension deps plus puppeteer-core.
2. **Seed Test Workspace**
   - `npm run pretest` (or `node .plan/tools/prepare-test-workspace.js`) copies templates/schemas into `test/.test-workspace/`.
3. **Chromium Download (Optional)**
   - Run `npm run test:download-vscode` (downloads VS Code test harness; Chromium download happens on first export automatically).
4. **VS Code Launch**
   - Open folder in VS Code; press F5 to start Extension Development Host.

## Limitations
- No `npm run build` script yet; packaging occurs via `vsce` or `npm vsce package` externally.
- `compile.js` used during `vscode:prepublish` removes heavy assets; run `npm run vscode:prepublish` before publishing.

## Change History
- 2025-12-06: Added build process doc (Codex).
