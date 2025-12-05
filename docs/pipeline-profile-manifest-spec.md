
---

## Front Matter

```yaml
---
title: Pipeline Profile Manifest Specification
version: 1.0
status: Draft
family: STD
document_id: STD-PipelineProfile-001
tags:
  - pipeline_profile
  - chromium
  - scribus
  - layout
  - rendering
---
```

---
# Pipeline Profile Manifest Specification  
Version: 1.0

## 1. Purpose

This standard defines the **pipeline profile manifest** used by the MarkPrint engine for controlled documents in the Master Document Family:

- SOP – Standard Operating Procedures  
- STD – Standards  
- REF – Reference Documents  
- APP – Appendices / Application Notes  

A pipeline profile is a structured JSON configuration that tells the engine:

- **Which profile metadata** applies (ID, label, schema, outputs, logging).  
- **Which layout artifact** (XML/DocBook by default, with JSON/CSS/Scribus `.sla`/Pandoc kept for compatibility) backs the profile.  
- **Which renderer** is preferred and what hints should be logged.  
- **How resources and artifact mappings** (DocBook, scribus master pages, frame definitions) are organized.

Pipeline profiles replace the older combined “template” files to give us a clean separation between **profile metadata** and **layout artifacts**. They are governed under the same policies as other publishing configuration artifacts.

This version (1.0) includes:

- Canonical use of `pipeline_profile` as the front-matter selector, with `layout_template` retained only as an alias.  
- A manifest schema that splits `profile`, `layout`, `resources`, and `artifactMappings`.  
- Runtime loading of layout descriptors so SLA/XML assets are consumed inside the export pipeline.  
- Renderer hints and logging hooks for future multi-engine support.

---

## 2. Scope

This specification applies to every JSON manifest stored under:

```
/templates/<profile>.json
```

Examples:

- `templates/standard-letter.json`  
- `templates/dts-master-report.json`  

Any manifest that may be selected via `pipeline_profile` **MUST** conform to this standard. Supporting layout artifacts (e.g., `.layout.json`, `.sla`, `.css`, DocBook stylesheets) live under `templates/layouts/` or an equivalent workspace folder but are referenced through the manifest and loaded dynamically.

---

## 3. Context and Relationships

Pipeline profiles fit into the broader MarkPrint export flow:

```
Markdown + YAML front matter
    ↓
Profile selection (pipeline_profile, layout_template alias)
    ↓
Profile manifest (metadata + layout descriptor)
    ↓
Layout loader (XML / DocBook / JSON / CSS / Scribus SLA / Pandoc)
    ↓
Renderer orchestration (Chromium today, more engines later)
    ↓
PDF / HTML / other outputs + release logs
```

Pipeline profiles interact with:

- **Metadata schemas** under `.markprint/schemas/*.schema.json`.  
- **Renderer engines** (currently Chromium via Puppeteer; future WeasyPrint/Scribus/Playwright).  
- **Layout artifacts** stored under `templates/layouts/` (JSON geometry, `.sla`, DocBook stylesheets, Pandoc filters).  
- **Logging and build mode** settings defined in `profile.outputs`, `profile.logging`, and `profile.buildMode`.

---

## 4. File Location & Naming

### 4.1 Location

- Bundled manifests live under `{extensionPath}/templates/`.  
- Workspace overrides live under `{workspaceFolder}/.markprint/templates/`.

Both locations share the same schema to support user-provided overrides.

### 4.2 Naming Convention

Manifest filenames follow:

```
<profile_id>.json
```

Where `<profile_id>` matches the canonical ID (e.g., `standard-letter`, `dts-master-report`). Layout artifacts referenced by manifests live under `templates/layouts/` and may be JSON, CSS, `.sla`, or other supported types.

---

## 5. High-Level JSON Structure

Every pipeline profile JSON **MUST** follow this structure:

```json
{
  "$schema": ".markprint/schemas/pipeline-profile.schema.json",
  "extends": "optional-parent-id-or-null",
  "profile": {
    "id": "required-string",
    "label": "Human friendly name",
    "version": "semantic version",
    "description": "optional summary",
    "category": "SOP|STD|REF|APP|MIXED",
    "schema": ".markprint/schemas/<document>.schema.json",
    "renderer": {
      "engine": "chromium",
      "options": {}
    },
    "outputs": {},
    "buildMode": "manual|auto|hybrid",
    "logging": {}
  },
  "layout": {
    "type": "xml|docbook|json|css|sla|pandoc|inline",
    "source": "${extensionPath}/templates/layouts/<artifact>",
    "rendererHint": "chromium|scribus|weasyprint|...",
    "converter": {},
    "inline": {}
  },
  "resources": {
    "css": [],
    "fonts": [],
    "assets": []
  },
  "artifactMappings": {
    "scribus": {},
    "docbook": {}
  }
}
```

Each top-level object is described below. Profiles inherit from parents via `extends`; inheritance is applied after flattening so child fields override parent values.

---

## 6. Profile Metadata (`profile`)

### Required Fields

| Field             | Description                                                                                           |
|------------------|-------------------------------------------------------------------------------------------------------|
| `profile.id`     | Unique identifier. Must match filename stem and `pipeline_profile` front-matter value.                |
| `profile.label`  | Human-readable name shown in the UI (status bar, quick pick).                                         |
| `profile.version`| Semantic version for the profile definition (e.g., `1.0.0`).                                          |
| `profile.schema` | Path (relative to extension/workspace) of the metadata schema used to validate document front matter. |
| `profile.renderer.engine` | Requested renderer (`chromium` today; hints logged for others).                              |
| `profile.outputs`| Object describing per-output behavior (PDF/HTML/etc.).                                                |

### Optional Fields

- `profile.description`: Short summary of profile intent.  
- `profile.category`: Document family (SOP, STD, REF, APP, MIXED).  
- `profile.buildMode`: Default build mode hint (`manual`, `auto`, or `hybrid`).  
- `profile.logging`: Logging directives (see §9).  
- `profile.renderer.options`: Engine-specific parameters for future renderer drivers.

### Front-Matter Selection

Documents **MUST** specify `pipeline_profile`; `layout_template` is optional for backward compatibility.

```yaml
pipeline_profile: dts-master-report
layout_template: dts-master-report # optional alias
```

`pipeline_profile` takes precedence. The engine writes both keys when inserting metadata to ease migrations.

---

## 7. Layout Descriptor (`layout`)

| Field           | Type   | Required | Description                                                                                       |
|----------------|--------|----------|---------------------------------------------------------------------------------------------------|
| `type`         | string | Yes      | One of `json`, `css`, `sla`, `xml`, `docbook`, `pandoc`, `inline`.                                |
| `source`       | string | Required unless `inline` present | File path or URI; supports `${extensionPath}`, `${workspaceFolder}`, `${manifestDir}` tokens. |
| `rendererHint` | string | No       | Preferred renderer for this layout artifact (logged when it differs from `profile.renderer`).     |
| `converter`    | object | No       | Converter hints (e.g., `{ "type": "frameMap", "target": "chromium" }`).                           |
| `inline`       | object | Only for inline layouts | Inline JSON data when no external file exists.                                           |

### Supported Types

- **`xml`** – Canonical layout descriptors describing frames, resources, and metadata. Author new layouts here; the loader consumes XML directly, validates it, and feeds the neutral frame model.  
- **`docbook`** – Structured DocBook sources (with associated XSL stylesheets) that are processed the same way as the XML descriptors above.  
- **`json`** – Legacy or generated descriptors (e.g., derived from Scribus). Supported to avoid breaking existing manifests but discouraged for new work.  
- **`sla`** – Scribus `.sla` documents; the loader extracts frame/page metadata and emits XML equivalents for the rest of the pipeline.  
- **`css`** – Additional CSS bundles to apply before rendering.  
- **`pandoc`** – Layouts driven by Pandoc filters; manifests record filter/script references so they can be wired into the XML-first conversion path in Phase 2.  
- **`inline`** – Manifest-embedded data (useful for tests or lightweight profiles).

Layout artifacts are read at runtime. No manual pre-processing is allowed. SLA parsing and any non-XML descriptors must first emit XML so the downstream renderer sees a consistent, XML-based neutral model.

---

## 8. Resources (`resources`)

Defines auxiliary assets consumed by the profile:

- `css`: Array of CSS file paths to inject into the rendered document.  
- `fonts`: Array of objects describing required fonts (family, style, weight).  
- `assets`: Array of additional asset paths (logos, images) that should be packaged or referenced.

These resources are mirrored into the test workspace by `.plan/tools/prepare-test-workspace.js` so unit tests run with the same assets.

---

## 9. Artifact Mappings (`artifactMappings`)

### Scribus Mapping

```json
"artifactMappings": {
  "scribus": {
    "frames": "${extensionPath}/templates/layouts/dts-master-report.layout.json",
    "masters": {
      "first_page": "MP_FIRST",
      "continuation_pages": "MP_CONT"
    }
  }
}
```

- `frames` references a JSON file derived from Scribus (page/frame definitions).  
- `masters` records which master pages to use on first vs. continuation pages.  
- Additional properties (e.g., `required_styles`) may be stored in the referenced JSON file.

### DocBook Mapping

```json
"artifactMappings": {
  "docbook": {
    "styles": {
      "heading": { "1": "Heading1", "2": "Heading2" },
      "paragraph": "BodyText"
    },
    "stylesheet": "styles/docbook-sop.xsl",
    "namespace": "http://docbook.org/ns/docbook"
  }
}
```

- `styles.heading` maps heading levels to Scribus styles.  
- `styles.paragraph` indicates the default body style.  
- `stylesheet`/`namespace` describe transformation assets for DocBook-aware profiles.

These mappings keep style and frame semantics next to the layout artifact, allowing fonts or geometry to change without code edits.

---

## 10. Outputs (`profile.outputs`)

Each output key (e.g., `pdf`, `html`, `png`, `release_bundle`) may contain:

> **Phase 1 status**: The extension records `profile.outputs` but does not yet enforce per-output settings; everything still prints via Chromium using the global MarkPrint configuration. Use the fields for documentation now and wire them into the renderer during Phase 2.

| Field              | Type    | Description                                                                    |
|--------------------|---------|--------------------------------------------------------------------------------|
| `enabled` or `mode`| boolean or enum | `enabled: true/false` (legacy) or `mode: ACTIVE_ONLY | ALWAYS | DISABLED`. |
| `filename_pattern` | string  | Template with tokens such as `{document_id}`, `{revision}`, `{timestamp_utc}`.  |
| `target_directory` | string  | Relative path (e.g., `published/pdf`).                                         |

Tokens available in filename patterns mirror those described in the legacy layout profile spec (`document_id`, `revision`, `family`, `status`, `pipeline_profile`, `timestamp_utc`, etc.). New manifests should prefer the `mode` enum for clarity.

---

## 11. Logging (`profile.logging`)

```json
"logging": {
  "enabled": true,
  "level": "DEBUG|INFO|WARN|ERROR|OFF",
  "only_when_active": false,
  "internal": {
    "enabled": true,
    "directory": "logs",
    "pattern": "{document_id}_pipeline.log"
  },
  "external": {
    "enabled": true,
    "only_when_active": true,
    "directory": "releases/{family}/_logs",
    "pattern": "{document_id}_r{revision}_{pipeline_profile}_{timestamp_utc}.log"
  }
}
```

- Internal logs remain local to the workspace.  
- External logs accompany release bundles and can be gated behind `only_when_active`.  
- Tokens mirror those available for output filename patterns.

---

## 12. Renderer Hooks

- `profile.renderer.engine` tracks the renderer that actually runs (Chromium today).  
- `layout.rendererHint` expresses the layout’s preferred renderer (e.g., `"scribus"`).  
- When hints differ from the active engine, the extension logs a warning but continues with Chromium to ensure backward compatibility. These logs prepare Phase 2 (multi-engine execution).

---

## 13. Front-Matter & Selection Workflow

1. User sets `pipeline_profile` in YAML front matter.  
2. `TemplateRegistry` loads bundled and workspace manifests, flattens inheritance, and resolves layout descriptors via `LayoutLoader`.  
3. When a document exports, the registry:
   - Selects `pipeline_profile` first.  
   - Falls back to `layout_template` only when the canonical key is absent.  
   - Falls back to `markprint.defaultTemplate` (now shorthand for default profile) based on `markprint.templateFallbackMode`.  
4. The resolved template carries `layoutArtifact` data (type, source, frames) for downstream rendering.

---

## 14. Validation Requirements

Before publishing or overriding a profile:

1. Manifest conforms to `.markprint/schemas/pipeline-profile.schema.json`.  
2. `profile.id` matches the JSON filename and expected front-matter value.  
3. Schema path resolves relative to the extension/workspace.  
4. Layout artifact references exist (XML/DocBook preferred, with JSON/`.sla`/CSS fallbacks).  
5. Renderer hints, converter hints, and artifact mappings are syntactically correct.  
6. Fonts/assets listed under `resources` are present.  
7. Outputs/logging tokens reference known metadata fields only.  
8. Unit tests (`npm test`) cover layout loader behavior if the profile introduces new layout types or renderer hints.

---

## 15. Extensibility

Future enhancements should add optional fields rather than altering existing semantics. Candidate areas:

- Expanded `layout.converter` metadata (DocBook or Pandoc-specific hints).  
- Additional `artifactMappings` sections (e.g., `pandoc`, `weasyprint`).  
Any change that affects existing semantics requires a new spec version plus migration notes.

---

## 16. Governance

Pipeline profiles are controlled artifacts:

- Reviewed under the Document Lifecycle & Governance Policy.  
- Changes affecting layout artifacts, renderer hints, or schema references must be coordinated with impacted teams (Docs, Training, Release).  
- Deprecated profiles should be clearly marked and removed only after verifying no live documents depend on them.  
- Testing guidelines (see `TEST.md`) must be followed before enabling auto-build or release automation for a profile.

---

## 17. Summary

Pipeline profiles provide a modular, declarative way to:

- Choose renderer engines (Chromium today, multi-engine tomorrow).  
- Keep profile metadata and layout artifacts in sync.  
- Load SLA/JSON/XML assets at runtime without manual pre-processing.  
- Map DocBook/Pandoc structures onto Scribus/Chromium layouts.  
- Govern outputs, logging, and build modes centrally.

By adopting this schema, MarkPrint gains a foundation for multi-engine rendering, customer-specific layout overlays, and long-lived configuration governance that aligns with the rest of the controlled publishing pipeline.

---
