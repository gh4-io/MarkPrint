---
title: "Testing Process"
summary: "Running and troubleshooting VS Code integration tests."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - process
  - testing
---

# Testing Process

## Requirements
- Node.js 18+
- VS Code test harness (downloaded via `npm run test:download-vscode`)
- GUI or headless environment (Linux: `xvfb-run` recommended)

## Quick Commands
```bash
npm run test:download-vscode   # once per environment
npm test                       # runs test/runTest.js using VS Code harness
```

## What Tests Cover
- Template registry loading and inheritance (`test/suite/template.test.js`)
- Schema validator normalization and error reporting
- Status bar manager behavior
- Layout loader SLA parsing
- Stylesheet resolver fallback order

## Troubleshooting
| Issue | Fix |
| --- | --- |
| VS Code binary missing | Delete `.vscode-test/` and rerun `npm run test:download-vscode`. |
| Tests hang after prepare script | Remove `test/.test-workspace/.manual` to re-enable auto seeding. |
| Linux headless failure | Run `xvfb-run -a npm test`. |

## Limitations
- No unit tests for renderer pipeline yet; coverage is integration-level.
- Puppeteer-heavy tests are not included; manual validation still necessary.

## Change History
- 2025-12-06: Documented testing workflow (Codex).
