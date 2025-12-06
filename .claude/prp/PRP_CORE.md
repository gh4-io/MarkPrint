# MarkPrint PRP core

scope:
- repo: MarkPrint (VS Code extension + npm-driven harness)
- domain: Markdown publication pipeline that renders high-fidelity PDFs/HTML/PNGs via template-driven metadata (`pipeline_profile`)
- canonical specs:
  - `.plan/MarkPrint-impromptu-proposal.md`
  - `.claude/prompt/pipeline-profile-multi-engine-plan.md`
  - `docs/pipeline-profile-manifest-spec.md`
  - `README.md`, `MIGRATION.md`, `TEST.md`
- dev rules: this PRP + live user direction in chat

priority:
- `pipeline_profile` (or legacy alias `layout_template`) is the single selector for templates; manifests in `templates/*.json` are the source of truth for layout/render hints.
- Keep the extension self-contained: no Python runtimes, no external CLIs (Pandoc/WeasyPrint/Scribus) unless explicitly vendored into the Node toolchain.
- Respect the metadata schemas in `.markprint/schemas/*.json`; AJV validation failures block exports unless the template flag explicitly downgrades them.
- When conflicts arise, prefer the latest plan/prompt docs listed above over historical SSP automation notes.
- Non-Chromium `rendererHint` values must emit WARN-level logs but exports continue via Chromium until the Phase 2 renderer driver ships; hints are informational only.
- Pipeline profile manifests should reference `.markprint/schemas/pipeline-profile.schema.json`; add/update that schema whenever manifest structure changes so custom templates have a canonical target.

roles:
- coder (Claude Code / implementer):
  - focus: extension behavior, template registry, renderer abstraction, automated tests.
  - context to load: files being edited, this PRP, active plan docs, and current task notes (`whats-next.md`, `PHASE1_SUMMARY.md`).
- auditor (Serena / MCP or other reviewers):
  - focus: repo-wide drift detection, verifying template/spec alignment, ensuring tests exist for new features.
  - cadence: before/after major phases (Phase 1 foundations, Phase 2 renderer abstraction, etc.).

agent rules:
- read before coding:
  - `.claude/prp/PRP_CORE.md`
  - `.plan/MarkPrint-impromptu-proposal.md`
  - `docs/pipeline-profile-manifest-spec.md`
  - task-specific docs referenced by the user (e.g., `whats-next.md`, `phase2-prep.md`).
- do not:
  - reintroduce Python, Pandoc, WeasyPrint, or Scribus pipelines unless converting assets for current manifests.
  - remove or relocate bundled templates/layouts without confirming where they are consumed.
  - bypass the template registry by hardcoding CSS/layout logic in `extension.js`.
- must:
  - honor the command naming patterns already exposed in `package.json`:
    - export commands stay under `extension.markprint.*`.
    - template/build-mode commands use `markprint.*`.
  - load templates through `src/templateRegistry.js` and `src/layoutLoader.js`; new features should extend those modules rather than duplicating logic.
  - keep JS/TS functions small and typed where applicable (leverage JSDoc typedefs or TypeScript modules).
  - run `npm run test:download-vscode` once per environment before invoking `npm test`.
  - run `npm test` (VS Code extension tests) when changes touch renderer/template/command logic; document if tests are skipped and why.
  - document new template schemas/resources in both `templates/*.json` and `.markprint/schemas/*.json`.

workflow per task:
1. Scan repo context (`rg`, `ls`, `code` lens) and read relevant files before editing.
2. Write a short plan (3–7 bullets referencing filenames) unless the change is trivial.
3. Keep edits focused (few files per plan step) and respect the file editing safety policy below.
4. When functionality changes:
   - run `npm run test:download-vscode` if the harness is missing.
   - run `npm test` (invokes `node ./test/runTest.js` with the prepared workspace).
   - manually verify critical commands via VS Code Extension Development Host when feasible.
5. Summarize output with:
   - what changed + rationale,
   - how to validate (commands/tests),
   - open questions or follow-ups (succinct).

file editing safety policy:
- MANDATORY: read a file immediately before every edit action (even if it was read earlier in the session).
- LIMIT: no more than 2 consecutive edit operations on the same file without re-reading it.
- BATCH: consolidate adjacent changes into a single edit command where practical.
- VERIFY: after editing, use `head`, `tail`, or `sed -n` to confirm the change committed correctly.
- RECOVERY: if an edit fails with ENOENT:
  1. Confirm the file path with `ls`.
  2. Re-read the file to refresh state.
  3. Check if the intended change already exists before retrying.
- FALLBACK: for wholesale rewrites (>50% of a file), replace the file via a single write operation.

self-update policy:
- Use this PRP as a living document—update it whenever phases shift, naming conventions change, or new workflows are adopted.
- Allowed editors: Claude Code and other approved agents once the user confirms the need.

update rules:
- announce intent: `PRP update proposal: <summary>`.
- apply targeted edits; avoid full rewrites unless explicitly asked (this rewrite was user-approved).
- append a changelog note: `# PRP updated <YYYY-MM-DD> <summary>`.
- confirm completion in chat: `PRP updated: <summary>`.
- ensure related wiki/`docs/` content is updated in the same session so the documentation mirrors PRP changes.
- retain history; version sections or add dated notes instead of deleting prior expectations unless deprecation is required.
- when unsure, ask before persisting changes.

governance:
- Jason (human owner) has final say on roadmap, architecture, and releases.
- Structural or sensitive changes (command renames, template schema shifts, renderer swaps) require explicit confirmation.
- Coordinate version bumps (e.g., `package.json` moving from 1.x to 2.x) with the roadmap and changelog guidance below.

example changelog (for PRP updates):
```
# changelog
- 2025-12-05: phase1 complete — documented pipeline profiles + Chromium renderer guardrails
- 2025-12-10: phase2 kickoff — added renderer abstraction rules
```

model usage policy:
- planning/analysis: Claude 3.5 Sonnet (default) or a comparable reasoning model.
- large markdown rewrites or mechanical edits: lower-cost model (e.g., Claude 3 Haiku) when available.
- code generation / refactors: Claude 3.5 Sonnet unless the user specifies otherwise.
- always state intent before switching to a higher-cost model.

project mode policy:
- default to Project Mode for multi-file or architectural tasks.
- File Mode is acceptable for scoped single-file edits (e.g., typos, small doc tweaks).
- when uncertain, stay in Project Mode to preserve broader context.

session reload policy:
- if context is lost (restart, long pause), run the user-provided boot command or re-read this PRP + latest plan docs.
- acknowledge readiness with `MarkPrint pipeline ready` (replaces the old "SSP Pipeline Ready" wording).

comment and docstring policy:

goal:
- future maintainers must understand MarkPrint by reading the code, templates, and comments alone.

rules:
- every module in `src/` should expose a top-level description (doc comment or README snippet) explaining how it fits the pipeline.
- exported functions/classes need plain-English doc comments (JSDoc preferred) covering purpose, parameters, returns, side effects (filesystem, network, Chromium invocations).
- complex logic or non-obvious state transitions require inline comments that explain intent (the “why,” not just the mechanics).
- TODOs must be descriptive (e.g., “TODO: add Playwright renderer implementation once Phase 2 abstraction lands.”).
- keep documentation synchronized with actual behavior; remove or update stale comments during refactors.

tool loading policy:
- start with the minimal toolset (built-in CLI + VS Code tasks).
- enable heavier analyzers (e.g., Serena/MCP) only for repo-wide reviews or when specifically requested.

environment policy:
- Node/npm is the authority. Honor `package.json` scripts:
  - `npm install` to sync deps.
  - `npm run test:download-vscode` (downloads VS Code test binary).
  - `npm test` (runs `node ./test/runTest.js` with the prepared workspace).
- `./.plan/tools/prepare-test-workspace.js` must run before tests (handled by the `pretest` script).
- Keep dependencies self-contained (Chromium is bundled through `puppeteer-core`; use `markprint.executablePath` if a system binary is required, but never shell out to native renderers without approval).
- Do not introduce UV, Python virtualenvs, or other language toolchains unless explicitly requested.

changelog policy:
- maintain `CHANGELOG.md` at the repo root using the existing structure (date-stamped headings with short summaries and categorized bullets).
- never delete history; prepend new entries.
- PR changes that affect users (command IDs, template behavior, renderer options) must include a changelog update after user approval.

changelog automation rule:
- after a significant change:
  1) inspect the diff and impacted areas.
  2) draft a proposed changelog entry (date, short title, grouped bullets).
  3) show the diff for `CHANGELOG.md`.
  4) apply only after the user approves.
- ensure changelog updates ship in the same commit as the relevant code/docs.

project state policy:
- `whats-next.md` holds the immediate fix list; review it before starting work and update/confirm status after finishing.
- `PHASE1_SUMMARY.md` and future phase prep docs record major milestones—reference them when validating scope.
- If the user requests work that diverges from the current phase plan (`phase2-prep.md`, etc.), call it out: “This deviates from the Phase <X> plan—proceed?”

template & renderer policy:
- All templates live under `templates/` with manifests conforming to `docs/pipeline-profile-manifest-spec.md`. Extend via `extends` rather than duplicating entire manifests when possible.
- Layout assets (JSON frame maps, Scribus `.sla`) stay in `templates/layouts/` and are loaded via `src/layoutLoader.js`. Any SLA usage is for metadata extraction only; rendering remains Chromium-based until Phase 2 introduces official multi-engine drivers.
- Renderer abstraction work must funnel through a dedicated driver module (planned for Phase 2). Until then, `puppeteer-core` is the default engine, but design APIs so future engines (Playwright, Vivliostyle) can plug in.

testing policy:
- Keep automated tests in `test/` aligned with the prepared workspace seeded by `.plan/tools/prepare-test-workspace.js`.
- Add or update tests when modifying template resolution, renderer behavior, schema validation, or command wiring.
- Document manual verification steps in `TEST.md` when new workflows are introduced.

release policy:
- Manual release command remains the default; ensure outputs land in the configured directory (`markprint.outputDirectory`). Do not auto-publish artifacts unless templates explicitly flag that behavior.
- When introducing new pipeline profiles or renderer behaviors, update `MIGRATION.md` so users understand how to opt in.

# PRP Changelog
- 2025-12-05: Replaced SSP-era content with MarkPrint-specific scope, Node/Chromium guardrails, pipeline profile expectations, and npm-based workflow rules.
- 2025-12-06: Clarified renderer-hint logging expectations and reiterated the requirement to maintain the pipeline profile schema.
