---
title: "Process Documentation Index"
summary: "Captures build, test, deploy, and operate phases."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - process
---

# Process Documentation Index

## Scope
Each phase page should describe inputs, commands, expected outputs, telemetry/log locations, and rollback guidance. Tie them back to the VS Code commands and npm scripts in `package.json`.

## Guides
| File | Description |
| --- | --- |
| [Build](build.md) | Prepare the environment (Node install, Chromium download, template seeding). |
| [Test](test.md) | Run VS Code integration tests and troubleshoot harness issues. |
| [Deploy](deploy.md) | Package/publish the extension, manage release artifacts. |
| [Operate](operate.md) | Monitor live usage, capture logs, handle fallbacks. |

## Contribution Notes
- Keep checklists actionable (commands, expected durations, validation steps).
- Reference `.plan/tools/prepare-test-workspace.js` where relevant.

## Change History
- 2025-12-06: Created process index scaffold (Codex).
