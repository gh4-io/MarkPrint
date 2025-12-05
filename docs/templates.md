# MarkPrint Templates

Phase 1 "Template Foundations" documentation for MarkPrint template system.

## Overview

MarkPrint templates define layout, styling, and output settings for converting Markdown documents. Templates support JSON and XML formats, inheritance via `extends`, and schema-based metadata validation.

## Template Storage

Templates are loaded from two locations:

1. **Bundled templates**: Shipped with extension in `<extension>/templates/`
2. **Workspace templates**: Project-specific in `.markprint/templates/`

Workspace templates override bundled templates with same ID.

## Template Structure (JSON)

```json
{
  "id": "standard-letter",
  "label": "Standard Letter",
  "version": "1.0.0",
  "description": "Standard letter format",
  "extends": null,
  "renderer": "chromium",
  "schema": ".markprint/schemas/standard-letter.schema.json",
  "resources": {
    "css": ["styles/custom.css"],
    "fonts": [
      {
        "family": "Arial",
        "style": "Regular",
        "weight": 400
      }
    ],
    "assets": []
  },
  "layout": {
    "format": "Letter",
    "orientation": "portrait",
    "width": "8.5in",
    "height": "11in",
    "margins": {
      "top": "0.5in",
      "right": "0.5in",
      "bottom": "1cm",
      "left": "0.5in"
    }
  },
  "outputs": {
    "pdf": {
      "enabled": true,
      "filename_pattern": "{document_id}_r{revision}.pdf",
      "target_directory": "published/pdf"
    },
    "html": {
      "enabled": true,
      "filename_pattern": "{document_id}.html",
      "target_directory": "published/web"
    }
  },
  "buildMode": "manual"
}
```

## Required Fields

- `id`: Unique template identifier (string)
- `label`: Display name shown in UI (string)
- `version`: Semantic version (string, e.g., "1.0.0")

## Optional Fields

- `description`: Template description (string)
- `extends`: Parent template ID for inheritance (string|null)
- `renderer`: Rendering engine (default: "chromium")
- `schema`: Path to JSON schema for metadata validation (string)
- `resources`: CSS, fonts, assets (object)
- `layout`: Page geometry and frame definitions (object)
- `outputs`: Export settings for pdf/html/png/jpeg (object)
- `buildMode`: Default build mode override (string)

## Template Inheritance

Templates can extend another via `extends` field:

```json
{
  "id": "company-letter",
  "extends": "standard-letter",
  "label": "Company Letter",
  "version": "1.0.0",
  "resources": {
    "css": ["styles/company-branding.css"]
  }
}
```

Child templates merge with parent (child values override parent).

## Template Selection Workflow

### 1. Front Matter (Explicit)

```yaml
---
pipeline_profile: standard-letter
layout_template: standard-letter # optional legacy alias
title: My Document
document_id: SOP-100
revision: "1.0"
---
```

### 2. Workspace State (Remembered)

If no `pipeline_profile` (or `layout_template`) exists in front matter, MarkPrint checks workspace state for the last selection for that file.

### 3. QuickPick (First Time)

If no template found, MarkPrint shows QuickPick of available templates. Selection is stored in workspace state and optionally inserted into front matter.

## Build Modes

Build mode controls when exports happen:

### Manual (Default)

- Export only via commands
- No automatic processing
- Full control over when PDFs/images are generated

### Auto

- Full export on every save
- Legacy `convertOnSave` behavior
- Useful for real-time previews

### Hybrid

- Lightweight validation + HTML preview on save
- Full PDF/PNG/JPEG export via commands
- Balance between responsiveness and performance

Set via:

- `markprint.buildMode` setting (workspace or user)
- Click status bar item to change
- Template `buildMode` field (template-level default)

## Schema Validation

Templates can specify JSON schema for front matter validation:

```json
{
  "schema": ".markprint/schemas/standard-letter.schema.json"
}
```

Schema example:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["pipeline_profile", "title", "document_id", "revision"],
  "properties": {
    "pipeline_profile": {
      "type": "string",
      "const": "standard-letter"
    },
    "layout_template": {
      "type": "string",
      "const": "standard-letter",
      "description": "Legacy alias"
    },
    "title": {
      "type": "string",
      "minLength": 1
    },
    "document_id": {
      "type": "string",
      "pattern": "^[A-Z]{3}-[0-9]{3}$"
    },
    "revision": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+$"
    }
  }
}
```

### Validation Behavior

- Runs before export (blocks if invalid)
- Reports errors to VS Code Problems panel
- Shows notification with "Open metadata" action
- Clear problems on successful validation

## Commands

### MarkPrint: Change Build Mode

Command ID: `markprint.changeBuildMode`

Shows QuickPick to select build mode (manual/auto/hybrid).

### MarkPrint: Select Template

Command ID: `markprint.selectTemplate`

Shows QuickPick to manually select template for current document.

### MarkPrint: Reload Templates

Command ID: `markprint.reloadTemplates`

Reloads all templates from disk (useful after editing template files).

## Status Bar

Status bar shows:

- Current build mode (with icon)
- Active template for current document
- Click to change build mode

Icons:

- `$(gear)` Manual
- `$(sync)` Auto
- `$(eye)` Hybrid

## XML Template Format

Basic XML support (Phase 1):

```xml
<template>
  <id>standard-letter</id>
  <label>Standard Letter</label>
  <version>1.0.0</version>
  <renderer>chromium</renderer>
</template>
```

Full XML parsing (with nested structures) planned for future phases.

## Creating Custom Templates

1. Create `.markprint/templates/` in workspace root
2. Add template JSON file (e.g., `my-template.json`)
3. Optionally create schema in `.markprint/schemas/`
4. Run "MarkPrint: Reload Templates" or restart VS Code
5. Select template via QuickPick or front matter

## Example Template

See bundled `templates/standard-letter.json` for complete example derived from DTS Master Report layout.

## Troubleshooting

### Template not showing in QuickPick

- Check file is in `templates/` or `.markprint/templates/`
- Verify JSON syntax (use JSON linter)
- Ensure required fields present (id, label, version)
- Run "MarkPrint: Reload Templates"

### Validation errors

- Check Problems panel for details
- Verify front matter matches schema requirements
- Ensure schema file exists at path specified in template
- Check schema is valid JSON Schema Draft 7

### Export blocked

- Template validation must pass before export
- Fix validation errors in Problems panel
- Or remove `schema` field from template to disable validation

## Future Enhancements (Post-Phase 1)

- Full XML parsing with nested structures
- Template editor UI
- Template marketplace/sharing
- Frame-based layout system for advanced positioning
- Multi-page templates with master pages
- Variable substitution in templates
- Conditional sections
