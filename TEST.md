# Testing Guide

## Prerequisites

- Node.js 18+
- `npm install` at repo root
- VS Code test harness (downloaded automatically by `vscode-test`; stored under `.vscode-test/`)

> **Tip:** If the harness fails to download, run `npm run test:download-vscode` (wraps `npx @vscode/test-electron --version 1.106.3 --download`) and re-run `npm test`.

## Running the suite

```
npm test
```

What happens:

1. `pretest` runs `.plan/tools/prepare-test-workspace.js`, mirroring bundled templates, schemas, styles, `.vscode`, and the SOP fixture into `test/.test-workspace/`.
2. `test/runTest.js` launches VS Code via `vscode-test` and executes the mocha suites in `test/suite/*.test.js`.

The latest suites cover:

- Template registry basics (loading, inheritance, validation)
- Pipeline profile precedence (`pipeline_profile` > `layout_template` > default fallback)
- Layout loader conversions for JSON manifests and Scribus `.sla` files
- Renderer hint logging hooks
- Schema validator and status bar regression coverage
- Stylesheet resolver fallback order (document -> workspace -> extension) so missing CSS emits actionable errors

## Headless environments

- On Linux CI, wrap the command with `xvfb-run -a npm test`.
- macOS/Windows runners can execute `npm test` directly, but ensure GUI access is allowed (VS Code spawns a window briefly).

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `spawn ... Code.exe ENOENT` | The VS Code executable is missing. Delete `.vscode-test/` and re-run `npm test`, or execute `npm run test:download-vscode` and try again. |
| Tests hang after `prepare-test-workspace` | Ensure no stale `test/.test-workspace/.manual` file exists (delete it to re-enable automatic seeding). |
| Templates missing in tests | Run `npm run vscode:prepublish` or manually copy your custom templates into `.markprint/templates` before re-running tests. |
