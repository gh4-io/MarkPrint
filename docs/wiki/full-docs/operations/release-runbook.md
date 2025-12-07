---
title: "Release Runbook"
summary: "Day-to-day checklist for preparing documents, running exports, and packaging outputs."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - operations
  - releases
---

# Release Runbook

## Requirements
- MarkPrint extension installed with latest templates and schemas (sync `main` or workspace overrides).
- Chromium downloaded or `markprint.executablePath` configured.
- Document metadata validated (Problems panel clean).
- File system access to the target `published/` directories or workspace output folder.

## Quick Install / Prep
1. Sync repo / workspace.
2. Run `npm install` (ensures dependencies and scripts up-to-date).
3. Run `MarkPrint: Reload Templates` if manifests changed.
4. Optional: `npm run test:download-vscode && npm test` for regression validation before release.

## Release Workflow
1. **Pre-flight**
   - Confirm Markdown sources include correct `pipeline_profile`.
   - Run `MarkPrint: Select Template` to ensure state matches metadata.
   - Validate front matter (hybrid mode or manual schema validation).
2. **Export**
   - Choose `MarkPrint: Export (all: pdf, html, png, jpeg)` or targeted formats.
   - For batch runs, script VS Code CLI or use `markprint.defaultTemplate` to avoid repeated prompts.
3. **Review Outputs**
   - Spot-check generated PDFs/HTML for correct layout and metadata.
   - Confirm filenames follow manifest patterns (e.g., `{document_id}_r{revision}.pdf`).
   - Ensure outputs land in release folder (`published/pdf`, `published/web`) or capture outputs from workspace overrides.
4. **Package / Deliver**
   - Zip or archive outputs if required; include logs if `profile.logging` defines external directories.
   - Update release tracking (e.g., commit artifacts, update changelog).

## Limitations & Notes
- Extension currently lacks an automated “Release” command; packaging is manual.
- Renderer hints for Scribus/DocBook do not switch engines yet; plan extra review when hints differ from actual renderer.
- Output directory conflicts: manifests override `markprint.outputDirectory`. Document this behavior for downstream teams.

## Verification Checklist
- [ ] Problems panel empty.
- [ ] Outputs exist in expected folders with correct names.
- [ ] Build logs (if enabled) stored with release artifacts.
- [ ] Changelog updated (both docs and `CHANGELOG.md` if user-facing behavior changed).

## Change History
- 2025-12-06: Added operational release runbook (Codex).
