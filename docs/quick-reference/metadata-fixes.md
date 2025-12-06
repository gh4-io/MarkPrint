---
title: "Metadata Fixes Cheat Sheet"
summary: "Fast reference for resolving schema validation errors and front-matter issues."
owner: "Docs & Developer Experience"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - quick-track
  - metadata
---

# Metadata Fixes Cheat Sheet

## Requirements
- Markdown documents must include a YAML front matter block at the top.
- Schema definitions live under `.markprint/schemas/*.json`; ensure the relevant schema files are present in the workspace or extension.
- AJV validation runs on MarkPrint export; Problems panel integration requires VS Code 1.60+.

## Quick Install / Setup
1. When prompted, let MarkPrint insert template metadata (`pipeline_profile` + `layout_template`).
2. Verify schema file paths inside the manifest (e.g., `.markprint/schemas/standard-letter.schema.json`) exist relative to the workspace or extension path.
3. Optionally set `"markprint.debug": true` to surface schema resolution info in the Debug Console.

## Common Error Patterns & Fixes
| Error Message | Meaning | Fix |
| --- | --- | --- |
| `Missing required field: title` | YAML front matter lacks `title`. | Add `title: <Document Title>` under the front matter block. |
| `Field 'document_id' should match pattern ...` | ID format doesn’t match schema regex (e.g., `^[A-Z]{3}-[0-9]{3}$`). | Use uppercase prefix + dash + digits (e.g., `SOP-200`). |
| `Field 'revision' should be string` or format issues | `revision` declared as number or array. | Quote revisions: `revision: "1.0"`. |
| Schema not found | Manifest `profile.schema` path resolved nowhere. | Confirm file exists; use `${extensionPath}` or `${workspaceFolder}` tokens. |
| Template not found / fallback prompt | Front matter `pipeline_profile` doesn’t match loaded manifests. | Run `MarkPrint: Reload Templates`, check manifest IDs, or fix front matter. |

## Example Front Matter (Standard Letter)
```yaml
---
title: Pipe Welding Procedure
pipeline_profile: standard-letter
layout_template: standard-letter
document_id: SOP-201
revision: "2.1"
effective_date: 2025-01-15
status: APPROVED
department: Engineering
owner: Jane Smith
approver: John Doe
---
```

## Workflow for Fixing Errors
1. **Run export** – let validation fail to populate the Problems panel.
2. **Open Problems panel** (View → Problems) to see AJV messages grouped under “MarkPrint Template Validation”.
3. **Jump to metadata** – select “Open Metadata” from the error toast or use the quick fix link.
4. **Apply corrections** – follow schema descriptions (see `docs/pipeline-profile-manifest-spec.md` for field semantics).
5. **Re-run export** – ensure errors clear and outputs produce as expected.

## Limitations
- AJV currently relaxes required fields when they are missing in each manifest; some optional fields still warn but do not block export.
- Complex schemas (arrays of objects) aren’t heavily used yet; if a future profile introduces them, update this cheat sheet with sample entries.
- When both workspace and bundled schemas exist, the loader picks the first match; ensure custom schemas override bundled ones intentionally.

## Verification
- After fixes, Problems panel should clear; `Schema validation passed` message appears in the status bar (hybrid mode on save or manual export).
- Debug log entries under `schema` confirm the resolved path and any normalization applied to front matter.

## Change History
- 2025-12-06: Initial metadata troubleshooting reference (Codex).
