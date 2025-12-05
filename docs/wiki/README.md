# MarkPrint Git Wiki (Kickoff Draft)

You now have a single entry point for moving from "I just installed the extension" to "I'm authoring pipeline profiles and renderer integrations." Treat this document as the Git repository version of a wiki homepage-you can copy/paste it into a GitHub Wiki later, but it already tracks the canonical files that ship with the repo.

## Orientation

| Track | Audience | Outcome | Jump Links |
| --- | --- | --- | --- |
| **Quick** | First-time operators | Convert a Markdown file to PDF/HTML in minutes | [Quick Track](#quick-track-five-minute-ramp) |
| **Normal** | Day-to-day publishers | Understand templates, build modes, troubleshooting | [Normal Track](#normal-track-day-to-day-operations) |
| **Dev** | Template authors & contributors | Build/customize the engine, run tests, add renderers | [Dev Track](#dev-track-contributors--template-authors) |

Use the track that matches the time you have; each section links back into the repo so the wiki stays synchronized with code.

---

## Quick Track (Five-Minute Ramp)

### 1. Requirements Snapshot
- Visual Studio Code + the MarkPrint extension (repo root contains the extension source; packaged builds ship via the Marketplace).
- Node.js 18.x for CLI helpers (needed later but safe to install now).
- Chromium download permission (first run pulls ~280 MB automatically).

### 2. First Export (Markdown -> PDF/HTML/PNG/JPEG)
1. Open any Markdown file.
2. Press `F1` / `Ctrl+Shift+P`.
3. Run `MarkPrint: Export (all: pdf, html, png, jpeg)` (see `README.md`, Usage section).
4. Confirm outputs appear next to the Markdown file (default behavior when `markprint.outputDirectory` is empty).

### 3. Pick a Template Fast
- If the command asks for a template, choose **Standard Letter** (bundled `templates/standard-letter.json`).
- Let MarkPrint write the YAML front matter for you-both `pipeline_profile` and `layout_template` are inserted so legacy scripts stay happy (`README.md`, "Pipeline Profiles & Layouts").

### 4. When Something Fails
- Open the Problems panel (front-matter schema errors are listed there).
- If Chromium fails to download, set `http.proxy` in VS Code settings and retry.
- Need proof the basics run? `npm test` exercises the same flow once `.vscode-test/` has been seeded (see [Dev Track](#dev-track-contributors--template-authors)).

> **Done?** Stop here if you just needed a working export. Move on if you manage controlled documents regularly.

---

## Normal Track (Day-to-Day Operations)

### Workspace Layout & Controlled Artifacts
- Keep Markdown sources, `.markprint/templates/`, and `.markprint/schemas/` under version control-this matches the contract in `MIGRATION.md`.
- Bundled manifests live under `templates/*.json`, but workspace overrides (e.g., regulated SOPs) belong in `.markprint/templates/`. The loader merges both stacks (`docs/templates.md`, "Template Storage").

### Metadata & Front Matter Policy
1. Every document **must** declare `pipeline_profile`. `layout_template` is optional legacy aliasing.
2. Schema validation (AJV) blocks exports if required metadata is missing; fix Problems panel items before retrying (`docs/templates.md`, "Schema Validation").
3. Keep IDs synchronized with filenames-`pipeline_profile: dts-master-report` expects `templates/dts-master-report.json`.

### Build Modes & Automation
- `manual`: explicit exports only (default).
- `auto`: full export on save; replaces `markprint.convertOnSave` (deprecated).
- `hybrid`: validation + lightweight preview on save, manual full exports.
- Toggle via status bar, `markprint.buildMode`, or template defaults (see `docs/templates.md`, "Build Modes").

### Outputs & Directory Strategy
- Leaving `markprint.outputDirectory` blank writes artifacts next to the Markdown file-perfect for local drafts.
- Need regimented releases? Set `profile.outputs.<format>.target_directory` in the manifest (`docs/pipeline-profile-manifest-spec.md`, section 10) so every export lands inside `published/<format>` or similar.
- When both a manifest directory and `markprint.outputDirectory` are defined, the manifest wins; log messages explain which location was chosen (planned for Phase 2-track progress inside `.claude/prompt/multi-engine-phase2.md`).

### Troubleshooting Checklist
- **Templates missing?** Run `MarkPrint: Reload Templates`.
- **Stylesheets not applied?** Confirm the resolver path order (Markdown file -> workspace -> extension). Missing files raise "Stylesheet not found..." errors with attempted paths (`README.md`, Options > Styles).
- **Layout loader errors?** Inspect the referenced path under `templates/layouts/...` and ensure the `.layout.json` / `.sla` file exists (`docs/pipeline-profile-manifest-spec.md`, sections 4-7).
- **Chromium stability?** Large exports sometimes time out; Phase 1 already increases the timeout, but you can rerun in manual mode or switch to Scribus once Phase 2 lands.

### Reference Map
- `README.md` - global feature list, command palette walkthrough.
- `MIGRATION.md` - canonical checklist for moving from legacy templates.
- `.plan/testing/end-to-end-testing.md` - playbook for full regression validation.

---

## Dev Track (Contributors & Template Authors)

### Environment Setup
1. Clone the repo and run `npm install`.
2. Install VS Code 1.106.3 for the integration tests via `npm run test:download-vscode` (documented in `.plan/testing/end-to-end-testing.md`).
3. Linux/WSL users need the Chromium dependencies listed in that same playbook (libnss3, libxkbcommon, etc.).

### Repository Tour
- `extension.js` - entry point that currently routes every export through the Chromium renderer stub.
- `src/templateRegistry.js` - loads manifests, applies inheritance, and bridges metadata into exports.
- `src/layoutLoader.js` - resolves CSS/JSON/SLA/DocBook descriptors and surfaces renderer hints.
- `docs/pipeline-profile-manifest-spec.md` - specification you must follow when creating or reviewing manifests.
- `.plan/*.md` - implementation prompts and verification plans (e.g., Phase 2 renderer enablement).

### Pipeline Profile Authoring (Beyond Basics)
1. Start from an existing manifest (Standard Letter or DTS Master Report).
2. Update the `profile` block with your ID, semantic version, document family, and schema pointer.
3. Point `layout.source` to `templates/layouts/<your-layout>` and set `rendererHint` (`chromium`, `scribus`, `docbook`, `pandoc`, etc.).
4. Describe assets under `resources` (CSS bundles, fonts, logos) so the test workspace mirror copies everything.
5. Capture frame/style mappings in `artifactMappings` for Scribus or DocBook conversions (sections 7-9 of the spec).

### Renderer & Multi-Engine Notes
- Phase 2 introduces a renderer registry plus a Scribus handoff stub (see `.claude/prompt/multi-engine-phase2.md` for acceptance criteria).
- Layout descriptors with `type: "sla"` or `rendererHint: "scribus"` should trigger the Scribus renderer path. Until the CLI integration is complete, stash exchange files and logs so humans can finish the job manually.
- DocBook/Pandoc descriptors must validate their referenced stylesheets just like SLA assets-extend `layoutLoader` tests whenever you add a new layout type.

### Testing & Validation
- **CLI Suite**: `npm test` (Mocha + VS Code test harness). Re-run after touching templates, layout loader logic, or renderer selection.
- **Pretest Seeder**: `node .plan/tools/prepare-test-workspace.js` mirrors templates, schemas, and SOP fixtures into `test/.test-workspace/`.
- **Manual F5**: Launch the Extension Development Host, export the SOP fixture, and verify outputs/logs per `.plan/testing/end-to-end-testing.md`.
- Record issues in `TODO.md` or `whats-next.md` with repro steps and links to logs.

### Contribution Notes
- Keep new docs ASCII-friendly; add comments in code sparingly and only to clarify non-obvious behavior (matches repo style guide).
- Never revert user changes accidentally-review git status before committing.
- When adding wiki pages, prefer relative links (`docs/...`, `templates/...`) so content works both in-repo and once migrated to GitHub Wiki pages.

---

## Next Steps & Expansion Ideas
1. **Split by Page Later**: Each section here can evolve into its own GitHub Wiki page (`Quick-Start.md`, `Operations.md`, `Developers.md`). For now, this single file keeps everything versioned with code.
2. **Add Flowcharts**: Reference `images/mermaid.png` or add fresh Mermaid diagrams once the Scribus workflow stabilizes.
3. **Track Phase 2 Checklists**: Link back to `.claude/prompt/multi-engine-phase2.md` and `MIGRATION.md` whenever requirements change so ops and dev stay aligned.

> Save this file as the seed of your Git-based wiki. When you later enable the GitHub Wiki, copy each section into its own page, keep the relative links intact, and the documentation will stay thorough, descriptive, and organized by the Quick/Normal/Dev flow requested.

