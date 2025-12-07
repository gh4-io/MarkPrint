---
title: "Template Registry Flow"
summary: "How manifests are loaded, merged, validated, and selected per document."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - architecture
  - templates
---

# Template Registry Flow

## Requirements
- `templates/` directory (bundled) and optional `.markprint/templates/` (workspace overrides).
- Manifest schema `.markprint/schemas/pipeline-profile.schema.json`.
- VS Code workspace context (TemplateRegistry resolves workspace folders when available).

## Loading Sequence
1. **Bundled manifests**: `loadBundledTemplates()` reads `templates/*.json` or `.xml`.
2. **Workspace manifests**: `loadWorkspaceTemplates()` scans `.markprint/templates` per folder.
3. **Direct references**: `resolveTemplateReference()` loads manifests from explicit paths (front matter or settings).

### Flow Diagram
```
extension activate()
└─ templateRegistry.initialize()
   ├─ loadBundledTemplates()
   ├─ loadWorkspaceTemplates()
   └─ resolveInheritanceForAll()
```

## Inheritance Resolution
- `resolveInheritanceForAll()` deep clones parent templates and merges child overrides.
- Circular references throw errors.
- Arrays are replaced (not merged); document when customizing resources or outputs.

## Selection Order per Document
1. Parse front matter (`pipeline_profile` priority, then legacy `layout_template`).
2. If missing or invalid, use workspace state (last selection).
3. If none available, apply fallback (`markprint.defaultTemplate` or built-in default).
4. Optionally prompt user via `fallbackSelector`.

### Fallback Settings
- `markprint.templateFallbackMode`:
  - `auto`: silently pick default.
  - `prompt`: quick pick with reason (default).
  - `disabled`: abort export if template missing.

## Logging & Debugging
- `debugLogger.log('template', ...)` records template ID, source, renderer hint, resources.
- Use `"markprint.debug": true` to surface these logs.

## Limitations
- No caching per workspace beyond in-memory Map; large numbers of manifests could slow startup.
- XML manifest parsing is basic (regex-based) and only supports limited fields—prefer JSON.
- Template reload is manual via `MarkPrint: Reload Templates`; watch tasks or file watchers not yet configured.

## Change History
- 2025-12-06: Added template registry architecture notes (Codex).
