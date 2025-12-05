---
title: "MarkPrint Documentation Wiki Proposal"
summary: "Standards and lifecycle plan for the Git-based documentation library under ./docs."
owner: "Docs & Developer Experience"
last_updated: "2025-12-05"
last_reviewed: "2025-12-05"
status: "Active"
---

# MarkPrint Documentation Wiki Proposal

This proposal defines the structure, standards, and maintenance expectations for an enterprise-grade documentation library that lives entirely under `./docs`. It sets binding rules for both humans and AI agents so the library remains authoritative, auditable, and tightly coupled to the MarkPrint codebase.

## Introduction

### Project Overview
- The MarkPrint documentation library is a Git-based wiki rooted at `./docs`, ensuring every controlled page ships with the codebase.
- It supports onboarding, day-to-day operations, renderer expansion, and compliance initiatives for pipeline profiles, layout manifests, and testing workflows.
- By remaining in-repo, documentation benefits from the same review rigor, automated testing, and release tagging as code.

### Documentation Goals & Requirements
- Deliver accurate, accessible, consistent, and auditable documentation.
- Enforce mandatory standards: YAML metadata blocks, `kebab-case` filenames, directory-specific `index.md` files, and entries in `docs/meta/docs-changelog.md`.
- Satisfy governance requirements: every page identifies an owner, review cadence, and lifecycle status; deprecated material includes migration guidance.
- Reflect security and compliance needs by documenting permissions, renderer hints, and data/asset handling rules when relevant.

### Repository Structure Overview
- `docs/quick-reference/` — concise runbooks, cheats, and snippets for rapid execution.
- `docs/full-docs/` — narrative guides, SOPs, and policy documents for full-context reading.
- `docs/dev/` — architecture details, environment variables, configurations, integration points, and contributor guidance.
- `docs/meta/` — standards (this proposal), sanity-check guides, changelog, governance artifacts.
- `docs/README.md` — entry point describing how to navigate the entire library.

### Workflows and Maintenance Flow
- Documentation updates must accompany the development lifecycle: every feature branch updates affected docs (Quick/Full/Dev) in the same PR.
- AI agents proactively edit docs whenever they change code, infrastructure, or configuration—even if humans do not explicitly ask.
- Reviewers verify documentation compliance (metadata freshness, changelog entries, structure) before approving.
- Scheduled and ad hoc sanity checks keep the library healthy; agents should self-check after significant changes, while humans run weekly or release-based audits.

### Integrations and Tooling
- CI/CD hooks may lint Markdown, enforce metadata, validate links, or ensure changelog entries exist before merging.
- Pre-commit hooks and scripts (documented in `docs/meta/`) can run `rg`/`markdownlint`/schema validators on `./docs`.
- External mirrors (Confluence, static sites) must treat `./docs` as source of truth; synchronization scripts live in the repository so audits capture them.
- Documentation generators, schema exporters, or renderer diagrams must output into `./docs`, preserving provenance and Git history.

### Versioning and Update Strategy
- Documentation versions align with code releases; tags should capture both artifacts simultaneously.
- Each update requires refreshing metadata dates, updating relevant `index.md` files, and appending an entry to `docs/meta/docs-changelog.md`.
- AI agents implement routine updates automatically, while human owners conduct scheduled reviews and approvals.
- Deprecated behavior is recorded with its retirement version, replacement path, and cross-links in both Quick Reference and Full Docs.

## Objectives
- Keep every documentation artifact versioned inside the main Git repo (no external wiki drift).
- Guide both humans and AI agents so updates happen automatically when behavior changes.
- Provide three primary knowledge bands—Quick Reference, Full Documentation Set, and Dev Set—each discoverable through consistent landing pages.
- Embed governance metadata to make audit trails and review cadences explicit.

## Directory Blueprint

```
docs/
  README.md
  quick-reference/
    index.md
    *.md (kebab-case cheat sheets)
  full-docs/
    index.md
    topic-groups/
      index.md
      *.md (narrative guides)
  dev/
    index.md
    architecture/
      index.md
      *.md
    contribution/
      index.md
      *.md
    configuration/
      index.md
      variables.md
    process/
      index.md
      *.md
    integrations/
      index.md
      *.md
  meta/
    index.md
    standards.md
    WIKI_PROPOSAL.md
    docs-changelog.md
```

### Section Purposes & Content Rules

| Path | Purpose | Document Types & Examples | Naming Rules |
| --- | --- | --- | --- |
| `docs/README.md` | Library overview, explains navigation + expectations. | Introduce Quick/Full/Dev sets, link to meta + sanity checklist. | `README.md` at root. |
| `docs/quick-reference/` | Fast answers and cheat sheets for operators. | Command cheats (`exports.md`), runbooks (`incident-checklist.md`), CLI flag maps. | Files in `kebab-case.md`, each < 2 screens, start with TL;DR. |
| `docs/full-docs/` | Narrative explanations, policy docs, end-to-end guides. | `pipelines/index.md`, `renderer-roadmap.md`, `sop-onboarding.md`. | Use subfolders per domain; each subfolder requires `index.md`. |
| `docs/dev/` | Architecture, internals, environments, integrations, contribution, testing. | `architecture/runtime.md`, `configuration/variables.md`, `process/build.md`. | Mirror code structure using subdirectories; maintain `index.md` per folder. |
| `docs/meta/` | Governance, standards, proposal copies, sanity checks, changelog. | `standards.md`, `sanity-checks.md`, `docs-changelog.md`, `WIKI_PROPOSAL.md`. | Files reflect governance topics; stored with canonical names. |

All directories must include an `index.md` landing page listing children and cross-links. Topic pages belong in the lowest-level applicable directory; avoid dumping everything into root.

## File Naming & Layout Standards

1. **Naming**
   - Use lowercase `kebab-case.md` (e.g., `pipelines-overview.md`).
   - Keep filenames under 40 characters.
   - One primary topic per file. If content spans multiple topics, split into separate files and link them.
2. **Directory Layout**
   - Group related files in descriptive folders (e.g., `full-docs/pipelines/`).
   - Each folder requires an `index.md` linking to its child pages.
   - Avoid single-file directories; move the file up one level unless expansion is planned.

## Markdown Structure Standards

### Required Metadata Block
Every Markdown file under `./docs` must begin with YAML front matter:

```yaml
---
title: "User-Facing Title"
summary: "One-sentence description."
owner: "Team or role"
last_updated: "YYYY-MM-DD"
last_reviewed: "YYYY-MM-DD"
status: "Draft|Active|Deprecated"
tags:
  - optional
---
```

**Rationale:** The metadata drives automated audits, helps AI agents find owners, and enables humans to judge freshness quickly.

### Heading Hierarchy
- `#` reserved for the document title (should match `title` metadata). Only one `#` per file.
- `##` for major sections (Overview, Prerequisites, Steps, Examples, Troubleshooting, Change History).
- `###` for subsections. Avoid going deeper than `####` to keep documents scannable.

### Canonical Section Outline
Most pages should follow this structure (omit sections that truly do not apply):
1. `## Overview`
2. `## Prerequisites`
3. `## Steps` or `## Procedures`
4. `## Examples` or `## Reference`
5. `## Troubleshooting`
6. `## Change History` (table or bullet list noting key doc updates)

Quick reference pages may use a compressed outline:
1. `## TL;DR`
2. `## Commands`
3. `## Notes`

Dev docs often add:
1. `## Architecture`
2. `## Decisions`
3. `## Open Questions`

## Cross-Linking & Navigation Rules
- Each `index.md` must list direct children plus any upstream/downstream dependencies.
- Cross-link using relative paths (`[Renderer Guide](../full-docs/rendering/index.md)`).
- Every standalone page must be reachable from at least one index page; run link audits during sanity checks.
- When adding a new page, update its parent folder’s `index.md` and `docs/README.md` if the topic is top-level.

## Style & Tone
- Prefer clear, direct sentences; use present tense for instructions.
- Provide concrete commands and configuration keys; back them with fenced code blocks using info strings (` ```bash `).
- Define acronyms on first use and maintain a glossary under `docs/meta/standards.md` if terms are reused.
- Highlight warnings using blockquotes starting with `> **Warning:**`.

## Metadata Maintenance
- `last_updated` reflects the last content change.
- `last_reviewed` updates when the document is audited without content edits.
- Set `status: Deprecated` when content no longer applies; include a pointer to the replacement.

## Versioning & Change Tracking
- Maintain `docs/meta/docs-changelog.md` summarizing every notable documentation update. Add an entry in the same commit as the documentation change.
- Within long-lived pages, use a `## Change History` section capturing date, change summary, and author/agent.
- Breaking changes must be reflected in both relevant docs and the changelog within the same PR.

## Templates & Examples

### Quick Reference Skeleton
```markdown
---
title: "Export Commands Cheat Sheet"
summary: "One-line purpose."
owner: "Docs"
last_updated: "2025-12-05"
last_reviewed: "2025-12-05"
status: "Active"
---

# Export Commands Cheat Sheet

## TL;DR
- Step bullets...

## Commands
```bash
markprint export ...
```

## Notes
- Edge cases...
```

### Full Documentation Skeleton
```markdown
---
title: "Pipeline Profiles Overview"
summary: "Explains manifest structure and governance."
owner: "Docs"
last_updated: "2025-12-05"
last_reviewed: "2025-12-05"
status: "Active"
---

# Pipeline Profiles Overview

## Overview
...

## Prerequisites
...

## Steps
...

## Examples
...

## Troubleshooting
...

## Change History
- 2025-12-05: Initial draft (Codex).
```

### Dev Architecture Skeleton
```markdown
---
title: "Renderer Abstraction Design"
summary: "Architecture notes for multi-engine rendering."
owner: "Engineering"
last_updated: "2025-12-05"
last_reviewed: "2025-12-05"
status: "Draft"
---

# Renderer Abstraction Design

## Overview
...

## Architecture
### Components
### Data Flow

## Decisions
| Decision | Rationale | Date |
| --- | --- | --- |

## Open Questions
- ...

## Change History
- ...
```

## Dev Track (Contributors & Template Authors)

### Environment Setup
1. Clone the repo and run `npm install`.
2. Install VS Code 1.106.3 for the integration tests via `npm run test:download-vscode` (documented in `.plan/testing/end-to-end-testing.md`).
3. Linux/WSL users need the Chromium dependencies listed in that same playbook (libnss3, libxkbcommon, etc.).

### Repository Tour
- `extension.js` — entry point that currently routes every export through the Chromium renderer stub.
- `src/templateRegistry.js` — loads manifests, applies inheritance, and bridges metadata into exports.
- `src/layoutLoader.js` — resolves CSS/JSON/SLA/DocBook descriptors and surfaces renderer hints.
- `docs/pipeline-profile-manifest-spec.md` — specification you must follow when creating or reviewing manifests.
- `.plan/*.md` — implementation prompts and verification plans (e.g., Phase 2 renderer enablement).

### Pipeline Profile Authoring (Beyond Basics)
1. Start from an existing manifest (Standard Letter or DTS Master Report).
2. Update the `profile` block with your ID, semantic version, document family, and schema pointer.
3. Point `layout.source` to `templates/layouts/<your-layout>` and set `rendererHint` (`chromium`, `scribus`, `docbook`, `pandoc`, etc.).
4. Describe assets under `resources` (CSS bundles, fonts, logos) so the test workspace mirror copies everything.
5. Capture frame/style mappings in `artifactMappings` for Scribus or DocBook conversions (sections 7–9 of the spec).

### Renderer & Multi-Engine Notes
- Phase 2 introduces a renderer registry plus a Scribus handoff stub (see `.claude/prompt/multi-engine-phase2.md` for acceptance criteria).
- Layout descriptors with `type: "sla"` or `rendererHint: "scribus"` should trigger the Scribus renderer path. Until the CLI integration is complete, stash exchange files and logs so humans can finish the job manually.
- DocBook/Pandoc descriptors must validate their referenced stylesheets just like SLA assets—extend `layoutLoader` tests whenever you add a new layout type.

### Testing & Validation
- **CLI Suite**: `npm test` (Mocha + VS Code test harness). Re-run after touching templates, layout loader logic, or renderer selection.
- **Pretest Seeder**: `node .plan/tools/prepare-test-workspace.js` mirrors templates, schemas, and SOP fixtures into `test/.test-workspace/`.
- **Manual F5**: Launch the Extension Development Host, export the SOP fixture, and verify outputs/logs per `.plan/testing/end-to-end-testing.md`.
- Record issues in `TODO.md` or `whats-next.md` with repro steps and links to logs.

### Contribution Notes
- Keep new docs ASCII-friendly; add comments in code sparingly and only to clarify non-obvious behavior (matches repo style guide).
- Never revert user changes accidentally—review git status before committing.
- When adding wiki pages, prefer relative links (`docs/...`, `templates/...`) so content works both in-repo and once migrated to GitHub Wiki pages.

### Environment & Configuration Coverage
- Maintain `docs/dev/configuration/variables.md` (or equivalent) enumerating every environment variable, CLI flag, build toggle, runtime configuration, and infrastructure setting.
- Each entry must include: variable name, description, default value, data type or valid range, dependency notes, impact on build/deploy/runtime phases, logging/telemetry considerations, and any security or access constraints.
- Link each variable to the configuration files or manifests that use it (e.g., `.env`, `package.json` scripts, Dockerfiles, Helm charts, Terraform modules).
- AI agents must update this registry automatically whenever `.env` files, configuration defaults, build scripts, or infrastructure manifests change.

### Phase Outcomes & System States
- Document lifecycle phases under `docs/dev/process/` (e.g., `build.md`, `test.md`, `deploy.md`, `operate.md`).
- Each page must capture: input conditions, commands/tools, expected outputs/artifacts, resulting state changes, potential side effects (schema migrations, caches), and logging/telemetry signals.
- Include verification and rollback steps plus pointers to monitoring dashboards or log files.

### Integration Points
- Maintain `docs/dev/integrations/` describing every integration: APIs, services, telemetry exporters, renderer adapters, or deployment systems.
- Each integration entry documents version constraints, authentication requirements, data contracts, failure/timeout handling, and tracing/logging hooks.
- When integration versions or endpoints change, update the documentation and changelog simultaneously.

### Configuration Management
- Store configuration schemas and dependency maps under `docs/dev/configuration/`.
- Describe how configuration files map to environment variables, defaults, and services.
- Provide diagrams or tables that link Dockerfiles, Compose/Helm charts, Terraform modules, or other infrastructure definitions back to the documented variables and phases.
- Updates to configuration files must be mirrored in this section and recorded in the changelog; AI agents enforce the linkage automatically.

## AI Agent Responsibilities

1. **Proactive Updates**
   - After any non-trivial code or configuration change (new features, APIs, CLI flags, build modes, renderer behavior, infrastructure adjustments, etc.), the agent must identify impacted docs under `./docs` and update them in the same session—without waiting for explicit user requests.
   - If no suitable doc exists, the agent creates one in the appropriate section and links it from relevant `index.md` files.
   - Any change to `.env` files, configuration defaults, build/test/deploy scripts, or infrastructure manifests automatically triggers updates to `docs/dev/configuration/variables.md`, phase outcome docs, and integration references.
2. **Session-Long Compliance**
   - Once the agent reads this proposal, it must enforce these standards for the rest of the session: no metadata omissions, correct naming, proper sections, and directory placement.
3. **Documentation-Aware Commits**
   - Doc updates should accompany code changes in the same PR/commit series. Suggested commit prefix: `docs: ...`.
   - Commit messages must describe the documentation impact (e.g., `docs: document new renderer fallback`).
   - Whenever documentation is added or modified, append an entry to `docs/meta/docs-changelog.md` describing the change.
4. **Clarification Behavior**
   - Agents should make reasonable assumptions and draft documentation accordingly. Ask humans only when documentation would otherwise be inaccurate or speculative.

## Sanity Check Checklist

| Step | Description | Who Runs It | Frequency/Trigger |
| --- | --- | --- | --- |
| 1 | Verify `./docs` exists with `README.md`. | Human/AI | At repo clone; weekly |
| 2 | Ensure `quick-reference/`, `full-docs/`, `dev/`, and `meta/` directories exist with `index.md`. | Human/AI | Weekly + after structural changes |
| 3 | Spot-check each directory: every page has required metadata block. | AI (script or manual), Human | After every major change; monthly |
| 4 | Confirm `last_updated` and `last_reviewed` dates are recent (<90 days) or explain stale state in metadata. | Human owner | Quarterly |
| 5 | Verify this Introduction section exists, is current, and still matches repo scope and tooling. | AI/Human | Monthly; after structural changes |
| 6 | Check that each major subsystem (renderers, templates, pipeline profiles, testing) has entries in Quick Reference, Full Docs, and Dev sections (or documented exceptions in meta). | AI/Human | After releases and major features |
| 7 | Run link validation (manual review or tooling) to ensure indexes reference all child pages, no obvious orphan pages. | AI/Human | Monthly; after moving files |
| 8 | Review `docs/meta/docs-changelog.md` updated for recent doc changes. | Human/AI | Each release |
| 9 | Confirm `docs/dev/configuration/variables.md` (or designated environment registry) exists and documents every environment variable/config toggle referenced in code, scripts, infra manifests, or CI pipelines. | AI/Human | After config changes; monthly |
| 10 | Ensure lifecycle phase docs in `docs/dev/process/` cover build/test/deploy/operate outcomes, inputs, side effects, and telemetry. | AI/Human | After workflow updates |
| 11 | Verify integration docs (`docs/dev/integrations/`) reflect current external service versions and endpoints. | AI/Human | After dependency upgrades |
| 12 | Verify deprecated content is flagged via `status: Deprecated` and cross-linked to replacements. | Human/AI | Ongoing |

Agents should perform at least a light version (steps 1–3) whenever they touch docs. Periodically (e.g., biweekly) ask the user if a full sanity check is desired, but never rely on user prompting to maintain compliance.

## Sanity Check Execution Notes
- **Structure Checks:** Ensure directory tree matches the blueprint and all `index.md` files enumerate their children.
- **Metadata Checks:** Reject or fix any Markdown file missing the YAML block or with stale dates.
- **Coverage Checks:** Maintain a mapping in `docs/meta/standards.md` listing subsystems and their doc locations; update it during sanity checks.
- **Introduction & Environment Checks:** Confirm the Introduction remains accurate, the environment/configuration registry lists every variable and toggle, and phase/process docs match the actual pipeline.
- **Link Checks:** Use `rg -n "\\]\\(" docs` or a Markdown link validator when available; otherwise manually review indexes.
- **Consistency Checks:** Confirm terminology matches definitions in the meta glossary. Deprecated features must not appear as active in Quick Reference tables.

## How a New AI Agent Should Start
1. On session start:
   - Locate and read this proposal (`.plan/WIKI_PROPOSAL.md` and the copy under `docs/meta/WIKI_PROPOSAL.md` once mirrored).
   - Scan `docs/README.md`, `docs/meta/docs-changelog.md`, and section indexes to understand current coverage.
2. Perform a basic sanity check:
   - Verify required directories, Introduction presence, and metadata on a representative sample.
   - Ensure `docs/dev/configuration/variables.md` and `docs/dev/process/` exist and look current.
3. While working:
   - Keep a running list of doc impacts for any code, config, or infra change.
   - Update relevant docs before finishing the task; add changelog entries simultaneously.
4. Before ending the session:
   - Revisit the sanity checklist items touched during work.
   - Flag unresolved documentation debt to the user (e.g., “Renderer doc needs follow-up”).

## Governance & Review Cadence
- Establish a monthly documentation review meeting (or async checklist) led by the Docs owner to review sanity check results.
- Archive this proposal in `docs/meta/WIKI_PROPOSAL.md` and treat updates as controlled changes requiring review.
- Include documentation review in release readiness: no release ships without confirming docs reflect new features, environment variables, and integrations.

## Conclusion

Adhering to this proposal ensures documentation stays synchronized with MarkPrint’s rapid development pace while remaining auditable for enterprise stakeholders. Both human contributors and AI agents share responsibility for keeping the library healthy—structure, metadata, cross-links, environment coverage, and sanity checks are not optional. Whenever in doubt, update the docs first and ask questions later.

