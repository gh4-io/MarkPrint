---
title: "Coding Standards"
summary: "Conventions for Node-based VS Code extension development in MarkPrint."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - contribution
  - coding
---

# Coding Standards

## Requirements
- Node.js 18+ (ES2020 features available, but project remains CommonJS).
- ESLint configuration currently implicit; match existing style.
- Keep dependency footprint minimal; avoid native binaries.

## Conventions
- **Module format**: `require()/module.exports` (CommonJS). Do not switch to ES Modules without plan.
- **Async handling**: Prefer async/await; wrap with try/catch and call `showErrorMessage` for user feedback.
- **Logging**: Use `debugLogger.log(category, message, details)`; gate verbose logging behind `markprint.debug`.
- **Schema & template updates**: Always update `.markprint/schemas/*` and `docs/` when changing metadata requirements.
- **Comments**: Add targeted comments explaining non-obvious logic; keep code largely self-documenting.

## Limitations
- No TypeScript; rely on JSDoc for complex structures if necessary.
- Keep functions small; `extension.js` is long but refactors must consider VS Code activation sequence.

## Change History
- 2025-12-06: Added coding standards doc (Codex).
