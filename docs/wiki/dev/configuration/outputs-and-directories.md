---
title: "Outputs & Directories"
summary: "How manifest outputs interact with workspace outputDirectory settings."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - configuration
---

# Outputs & Directories

## Requirements
- Template manifests with `profile.outputs` configured.
- Optional VS Code settings (`markprint.outputDirectory`, `markprint.outputDirectoryRelativePathFile`).
- File system permissions to create directories.

## Priority Order
1. **Manifest outputs** (`profile.outputs.<format>.target_directory`) take precedence.
2. If manifest lacks directory, `markprint.outputDirectory` determines location.
3. Without either, outputs land next to the Markdown source file.

## Manifest Output Example
```jsonc
"outputs": {
  "pdf": {
    "filename_pattern": "{document_id}_r{revision}.pdf",
    "target_directory": "published/pdf",
    "mode": "ACTIVE_ONLY"
  },
  "html": {
    "filename_pattern": "{document_id}_r{revision}.html",
    "target_directory": "published/web"
  }
}
```

## Tokens
- `{document_id}`, `{revision}`, `{timestamp_utc}`, `{pipeline_profile}` and other metadata tokens can be used in filename patterns.
- Target directories can include relative paths (resolved against workspace or manifest dir) or absolute paths.

## Limitations
- No environment variables inside filename patterns (beyond metadata tokens).
- Directory creation uses Node’s `mkdirp`; absolute paths must exist or be creatable by the VS Code process.
- `mode` field is informational (Phase 1) but should reflect intent for future automation:
  - `ACTIVE_ONLY`, `ALWAYS`, `DISABLED`.

## Change History
- 2025-12-06: Added outputs/directory configuration doc (Codex).
