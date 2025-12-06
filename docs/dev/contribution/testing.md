---
title: "Testing Expectations"
summary: "When and how to run tests before submitting changes."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - contribution
  - testing
---

# Testing Expectations

## Requirements
- See [Testing Process](../process/test.md) for harness commands.
- For renderer or template changes, ensure fixtures in `test/.test-workspace/` reflect updates.

## When to Test
- **Always** after modifying renderer/template logic, Template Registry, Schema Validator, or layout loader.
- After documentation-only changes, tests optional but recommended if touching scripts or manifest files.

## Commands
```bash
npm run test:download-vscode   # first time per environment
npm test
```

## Manual Validation
- Run the extension in VS Code (F5) and export a sample doc (SOP fixture under `test/.test-workspace/`).
- Check outputs for layout integrity, metadata insertion, and renderer logs.

## Change History
- 2025-12-06: Documented testing expectations for contributors (Codex).
