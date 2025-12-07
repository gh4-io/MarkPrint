---
title: "Deploy Process"
summary: "Packaging and publishing the MarkPrint extension and documentation."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - process
  - deploy
---

# Deploy Process

## Requirements
- `vsce` or equivalent VS Code packaging tool installed (`npm install -g vsce`).
- Marketplace publisher access (gh4-io) or internal distribution channel.
- Clean working tree (run tests + update docs before packaging).

## Steps
1. **Preflight**
   - `npm test`
   - Update `CHANGELOG.md`
   - Ensure docs (especially this wiki) reflect new behavior.
2. **Package**
   ```bash
   npm run vscode:prepublish   # optional cleanup
   vsce package                # produces .vsix
   ```
3. **Publish**
   ```bash
   vsce publish <version>
   ```
   or upload `.vsix` to internal distribution.
4. **Docs Release**
   - Commit wiki updates (`docs/`), push to repo.
   - Tag release in Git (optional).

## Limitations
- No automated release command yet; future runbook may include release packaging covering outputs/logs.
- `vsce` requires PAT with Marketplace privileges; store securely.

## Change History
- 2025-12-06: Added deploy process notes (Codex).
