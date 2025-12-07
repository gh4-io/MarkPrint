---
title: "Schema Catalog"
summary: "Overview of front-matter schemas and how to customize or extend them."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - configuration
  - schemas
---

# Schema Catalog

## Requirements
- `.markprint/schemas/` directory with JSON Schema files.
- AJV dependency (already bundled) to validate front matter.
- Template manifests referencing schemas via `profile.schema`.

## Bundled Schemas
| File | Description | Notes |
| --- | --- | --- |
| `pipeline-profile.schema.json` | Schema for manifests themselves. | Used by Template Registry; update when manifest structure changes. |
| `standard-letter.schema.json` | Metadata requirements for Standard Letter documents. | Constrains `document_id`, `revision`, status fields. |
| `dts-master-report.schema.json` | DTS-specific metadata including APN fields. | Allows optional `status_note`, `owner_contact`. |

## Custom Schema Workflow
1. Copy an existing schema into `.markprint/templates/` or `.markprint/schemas/`.
2. Update the manifest `profile.schema` path to point to your custom file.
3. Run `MarkPrint: Reload Templates` and re-export to ensure AJV picks up the new schema.

## Schema Resolution Order
1. Workspace folder path supplied when manifest loaded.
2. Default workspace root (first folder) if manifest lacks `_workspaceFolder`.
3. Extension path fallback.

## Limitations
- No schema version negotiation; ensure IDs match to prevent caching issues.
- AJV strict mode disabled, so additional properties are allowed; rely on linting to ensure clean metadata.

## Change History
- 2025-12-06: Documented schema catalog and customization steps (Codex).
