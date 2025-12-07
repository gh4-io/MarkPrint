---
title: "Layout Loader"
summary: "Details on resolving layout descriptors (JSON, SLA, DocBook) and surfacing renderer hints."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - architecture
  - layouts
---

# Layout Loader

## Requirements
- Layout descriptor references inside manifests (`template.layout` block).
- Files accessible via resolved paths (supports `${extensionPath}`, `${workspaceFolder}`, `${manifestDir}` tokens).
- `cheerio` dependency installed for XML/SLA parsing.

## Supported Types
| Type | Behavior |
| --- | --- |
| `json` | Reads JSON file or inlined object describing frames/margins. |
| `css` | Loads CSS content for injection (used in resources). |
| `inline` | Uses `descriptor.inline` data directly (test fixtures). |
| `sla` | Parses Scribus `.sla` XML to extract frames, margins, page metadata. |
| `xml` | Generic XML layout converted to string. |
| `docbook` / `pandoc` | Returns metadata (stylesheet, filters) and optional file contents. |

## Flow
1. Resolve source path via `resolveSource()` (replaces tokens, handles file:// URIs, relative paths).
2. Dispatch to type-specific loader (JSON, SLA, etc.).
3. Return artifact object containing:
   - `type`, `source`, `descriptor`.
   - `data` (parsed frames or inline JSON).
   - `metadata` (for SLA margins or DocBook settings).
4. TemplateRegistry assigns `template.layoutArtifact` and `template.layoutRendererHint`.

## SLA Parsing Details
- Uses `cheerio` to iterate `<PAGEOBJECT>` nodes.
- Captures frame attributes: position, width, height, page assignment, type (text/image).
- Builds `pages` array grouped by page index for easy downstream consumption.
- Extracts document margins (`BORDERLEFT`, etc.) and page size.

## Limitations
- No caching; loaders read from disk each time TemplateRegistry initializes.
- SLA parsing ignores text/story content; only geometry captured.
- DocBook/Pandoc loaders currently treat source as optional (metadata only).

## Future Enhancements
- Add schema validation for layout descriptors.
- Support zipped artifacts or remote URLs (requires caching + security review).
- Provide converter hooks for layout transformations (e.g., SLA → JSON frame map).

## Change History
- 2025-12-06: Documented layout loader internals and supported descriptor types (Codex).
