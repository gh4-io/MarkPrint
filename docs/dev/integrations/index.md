---
title: "Integrations Index"
summary: "Documents external services and tooling dependencies."
owner: "Engineering"
last_updated: "2025-12-06"
last_reviewed: "2025-12-06"
status: "Active"
tags:
  - integrations
---

# Integrations Index

## Scope
Capture the contracts, versions, and failure modes for external systems: Chromium (puppeteer-core), Scribus SLA tooling, DocBook converters, telemetry/reporting hooks, CI/CD services that lint docs.

## Guides
| File | Description |
| --- | --- |
| [Chromium](chromium.md) | Puppeteer dependency, download rules, proxy support. |
| [Scribus](scribus.md) | SLA integration workflow and renderer hints. |
| [CI Docs](ci-docs.md) | Documentation linting, sanity checks, link validation ideas. |

## Authoring Notes
- Include authentication/permission requirements where applicable.
- Define monitoring and alerting expectations for each integration.
- Cross-link the relevant process or configuration documentation.

## Change History
- 2025-12-06: Created integrations index scaffold (Codex).
