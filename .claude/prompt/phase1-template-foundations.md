You are Claude Code working inside the MarkPrint (formerly vscode-mark-print) repo.

Goal: deliver Phase 1 “Template Foundations”:
1. Template registry & metadata validation
2. Build-mode settings (auto/manual/hybrid)
3. Starter template files based on DTS Master layout
4. Documentation + tests

Key requirements
- **Template manifests** live in `${workspaceFolder}/.markprint/templates` plus bundled defaults in the extension. Support JSON (preferred) and XML. Each manifest should include:
  - `id`, `label`, `version`, optional `extends`
  - Paths to CSS/fonts/assets
  - Renderer preference (`chromium`, more later)
  - AJV schema path for metadata validation
  - Page geometry + layout tokens (inspired by `.plan/ref/layout_profile_dts_master_report.json`)
  - Release rules (manual/auto)
- If a markdown file lacks `layout_template` in front matter: show QuickPick of available templates, store selection in `workspaceState`, and offer to insert metadata (optional). Next run should remember the last pick even if front matter is untouched.
- Validate YAML metadata using the template’s schema. On failure:
  - Add entry in VS Code Problems panel (file + line)
  - Show notification with “Open metadata” action
  - Block export until resolved
- **Build mode setting**: add `markprint.buildMode` (`auto`, `manual`, `hybrid`; default `manual`).
  - `auto`: full export on save (existing behavior).
  - `manual`: export only via commands.
  - `hybrid`: on save run lightweight HTML/validation preview; full PDF/other exports only via command.
  - Show current mode + active template in status bar.
- **Starter template**: create at least one example (e.g., `standard-letter.json`) in `.markprint/templates/` capturing key values from `.plan/ref/DTS_Master_Report_Template.sla` and `layout_profile_dts_master_report.json`, but simplify to what the extension needs (page size, margins, frame roles, outputs). SLA file is a reference only.
- **Workspace state & inheritance**: allow templates to extend another via `extends` and merge configs.
- **Documentation**: update README or create `/docs/templates.md` explaining template format, storage, selection workflow, build modes.
- **Tests**: add unit coverage for template loading, schema validation, build-mode behavior. Mock workspace state as needed.

Constraints
- Keep everything self-contained in Node/JS. No external CLIs.
- Preserve existing Chromium export path (PDF/PNG/JPEG).
- Modularize `extension.js` only as necessary for new components.

Deliverables checklist
- Template registry module + workspace-state persistence
- New `markprint.buildMode` setting and UI indicators
- Problems-panel integration for template validation errors
- Starter template file(s) derived from DTS reference
- Documentation + tests
