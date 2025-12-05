---
title: "Preparation Prompt: Phase 2 Readiness"
owner: "Codex"
status: "Ready"
date: "2025-12-05"
read: "extension.js"
read: "src/templateRegistry.js"
read: "src/layoutLoader.js"
read: "docs/pipeline-profile-manifest-spec.md"
read: "test/suite/template.test.js"
read: "README.md"
read: "MIGRATION.md"
read: ".plan/MarkPrint-impromptu-proposal.md"
---

# Objective

Stabilize and streamline the Phase 1 codebase so it’s clean, documented, and testable before renderer work begins. This includes removing dead code, corralling legacy logic, and ensuring every dependency/configuration step is explicit.

# Current Context

1. `extension.js` still contains legacy helpers (nunjucks template loading, PNG/JPEG export options, command handling) mixed with new pipeline profile logic.
2. Renderer selection only logs hints; Chromium rendering lives inline in `markprint()`.
3. `markprint.styles` resolver now supports document/workspace/extension fallbacks; `markprint.outputDirectory` still points PDFs to `sample/`.
4. Tests exist but `npm test` fails due to a missing VS Code test binary.
5. Docs mention pipeline profiles but don’t yet describe renderer interfaces or the exact structure of `.plan/ref/` assets.

# Tasks

## 1. Code cleanup
- Identify unused helpers in `extension.js` (legacy template HTML, markdown-it wrappers) and remove or clearly mark them for future deletion.
- Separate Chromium-specific logic from general command handling (without introducing the full renderer abstraction yet). For now, cluster `makeHtml`/`exportPdf` into a single module or section.
- Ensure `convertMarkdownToHtml` and related utilities are still needed; delete any orphaned code.

## 2. Settings audit
- Review `.vscode/settings.json` and `test/.test-workspace/.vscode/settings.json`. Remove obsolete entries (e.g., `markprint.styles` referencing missing files, `markprint.outputDirectory` pointing to `sample/` unless required).
- Document default behaviors in README/MIGRATION: 
  - `markprint.styles` can be empty; bundled CSS uses `${extensionPath}`.
  - `markprint.outputDirectory` empty → outputs next to the Markdown file.
- Add warnings/logging if deprecated settings (e.g., `markprint.convertOnSave`) are still present.

## 3. Dependency & module scan
- Run `npm ls` to ensure no unused packages remain.
- Flag any deprecated APIs (e.g., `punycode` warning) and note replacements or planned removal.

## 4. Testing readiness
- Restore the VS Code test binary (`.vscode-test/vscode-1.106.3/Code.exe`) or add a script/instruction to download it (`npx @vscode/test-electron --version 1.106.3 --download`).
- Update `README`/`TEST.md` with exact steps to run tests locally (GUI via launch config, CLI via `npm test`).
- Expand `test/suite/template.test.js` to cover the stylesheet resolver’s fallback order (document → workspace → extension) so future changes don’t regress behavior.

## 5. Documentation alignment
- Verify `docs/pipeline-profile-manifest-spec.md` matches the actual manifest fields (note that `profile.outputs` are not yet enforced; call this out explicitly).
- In README/MIGRATION, add a short section describing the new error messaging (“Stylesheet not found…”), so users know how to interpret it.
- Update `.plan/MarkPrint-impromptu-proposal.md` Phase 1 summary to reflect the completed work (layout loader, schema enforcement, logging upgrades).

## 6. Handoff summary
- Produce a short “Phase 1 Complete” note (e.g., in `whats-next.md`) describing the current architecture, known limitations (SLA not rendered yet), and the remaining work for Phase 2.

# Deliverables Checklist

- [ ] Legacy/dead code removed or clearly marked in `extension.js`.
- [ ] Settings cleaned up; README/MIGRATION describe defaults & fallbacks.
- [ ] Dependency audit notes (including handling of the `punycode` warning).
- [ ] VS Code test binary instructions/scripts added; `npm test` runnable again.
- [ ] New unit test(s) for stylesheet fallback.
- [ ] Docs updated (spec, README, MIGRATION, whats-next).
- [ ] Phase 1 completion note filed for handoff.

This prompt is self-contained; completing it leaves the repo tidy and ready for the renderer work defined in `multi-engine-phase2.md`.
