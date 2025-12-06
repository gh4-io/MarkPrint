---
title: MarkPrint Proposal & Criteria Brief
date: 2025-12-03
author: Codex (GPT-5)
status: Draft
---

# 1. Project Context
- **New name**: MarkPrint (rebranded from vscode-mark-print).
- **Mission**: Deliver a self-contained VS Code extension capable of parsing Markdown with template-aware metadata, applying bespoke layout rules (fonts, paper size, XML/HTML directives, image policies), and producing print-ready + digital outputs.
- **Non-negotiables**:
  1. **Self-contained runtime** – no external Python/Pandoc/WeasyPrint installs; everything must ship as Node/JS dependencies.
  2. **Metadata-driven template selection** - `pipeline_profile` front-matter (with `layout_template` as a compatibility alias) dictates rendering instructions; UI prompt only when metadata omits a profile.
  3. **Configurable build modes** – expose settings to keep convert-on-save, manual build, or hybrid preview. Users choose per workspace/profile.
  4. **Manual release command** – releases triggered via dedicated VS Code command; templates may optionally mark themselves auto-release capable but default remains manual.

# 2. Proposed Architecture
## 2.1 Pipeline Overview
```
Markdown + YAML Front Matter
        ↓ (gray-matter + ajv validation)
Template Resolver (pipeline profile registry + layout loader)
        ↓
Rendering Orchestrator
  • Markdown parser (markdown-it + plugins)
  • Template engine (eta/nunjucks + XML helpers)
  • Asset loader (fonts, CSS, images)
  • Output drivers (HTML/PDF/PNG)
        ↓
Output Manager (per-template destinations)
        ↓
Release Command (explicit invocation)
```

## 2.2 Key Components
| Component | Responsibility | Notes |
|-----------|----------------|-------|
| Template Registry | Load template manifests (JSON/YAML) defining layout directives, fonts, paper size, iconography, release rules. | Stored in workspace folder (`.markprint/templates/<name>.json`) with fallback defaults packaged inside extension. |
| Metadata Validator | `ajv` schema loader keyed by pipeline profile. Ensures required metadata (e.g., `doc_id`, `pipeline_profile`, `paper_size`) before render. | Error UI should prompt to edit metadata or pick a profile. |
| Rendering Orchestrator | Wraps markdown-it (with custom plugins for callouts, directives, PlantUML/Mermaid). Applies layout instructions (extra CSS, XML snippets, mapping directives). | Consider modularizing `extension.js` into parser/template/export modules for maintainability. |
| Output Drivers | Provide multiple renderers: HTML (existing Mustache path), PDF (Chromium or alternatives), image export. Each driver reads template “quality” directives (DPI, bleed, crop marks). | Selection per template (e.g., `renderer: "playwright"`). |
| Release Command | VS Code command `markprint.release` packaging outputs + metadata into archive when allowed. Uses template flags for automation rules (e.g., `allowRelease: true`). | Manual by default; use a bundled archiver lib (e.g., `archiver` or `yazl`) to avoid external tooling. |

## 2.3 Config Surface (examples)
```jsonc
{
  "markprint.templateRegistryPaths": [
    "${workspaceFolder}/.markprint/templates",
    "${extensionPath}/templates"
  ],
  "markprint.buildMode": "manual",   // manual | auto | hybrid
  "markprint.defaultTemplate": "standard-a4",
  "markprint.release.outputDirectory": "${workspaceFolder}/releases"
}
```

# 3. Criteria & Evaluation Checklist
1. **Template Compliance** - Does the active document declare `pipeline_profile`? If not, prompt user and optionally write back to metadata (also adding `layout_template` for legacy docs).
2. **Validation Coverage** – Each template must specify schema path + validation severity. Build should stop on schema errors unless template marks warning-only.
3. **Asset Fidelity** – Fonts/images referenced by template have checksum validation and fallback rules.
4. **Renderer Selection** – Template dictates renderer choice; system must gracefully fall back when renderer unavailable.
5. **Release Readiness** – Template metadata includes `releaseRules` (manual, gated, auto). Release command respects these flags and logs decisions.
6. **Build Mode Setting** – All template workflows must obey `markprint.buildMode`; verify UI toggles exist in settings.

# 4. Alternative Parsing/Rendering/Printing Options
| Category | GitHub Project | Highlights | Fit Notes |
|----------|----------------|-----------|----------|
| Markdown Parsing | `markdown-it/markdown-it` | Fast JS parser with plugin ecosystem (already used). | Meets self-contained constraint; continue leveraging. |
| Markdown + Transformers | `remarkjs/remark` + `rehypejs/rehype` | AST-based pipeline (unified). | Enables richer transformations; TypeScript-friendly. Could replace or complement markdown-it. |
| All-in-one VS Code exporter | `shd101wyy/vscode-markdown-preview-enhanced` | Uses Markdown-It + Electron for export; supports PlantUML, Mermaid. | Shows feasibility of bundling KaTeX/diagram renderers natively. |
| Slide/Print pipeline | `marp-team/marp` | Markdown → HTML/PDF slide deck using Chromium + theme files. | Provides template model + CLI; useful reference for theme packaging + PDF export UI. |
| CSS Paged Media engine | `vivliostyle/vivliostyle-cli` | Node tool converting HTML/CSS to PDF with paged features. | Still Chromium-based but optimized for pagination + templates; could adopt CLI or embed libs. |
| Alternative renderer | `typst/typst` | Rust typesetting engine with markup language. | Not HTML-based; would require new syntax and binary bundling—probably out-of-scope for self-contained JS extension. |
| PDF via WebKit | `wkhtmltopdf/wkhtmltopdf` | CLI HTML→PDF using Qt WebKit. | Requires native binary (cross-platform packaging challenges). |

# 5. Moving Beyond Chromium: Options & Trade-offs
| Option | Description | Advantages | Drawbacks / Considerations |
|--------|-------------|------------|----------------------------|
| **Playwright (Chromium/Firefox/WebKit drivers)** | Use `@playwright/test` runtime to print to PDF using multiple engines. | Supports WebKit and Firefox engines (gives Apple/Gecko rendering parity), better devtools integration, official npm distribution. | Still browser-based; PDF output limited vs true CSS paged engines; larger install (~100s MB). |
| **Vivliostyle CLI** | CSS Paged Media implementation built around Chromium but packaged specifically for book/print workflows. | Rich pagination controls, footnotes, running headers; theming via JSON; CLI is Node-based (fits self-contained goal). | Underlying engine still Chromium; project updates slower than Playwright; limited image pipeline hooks. |
| **Paged.js + headless browser** | Client-side JS polyfill for CSS paged media run via headless browser. | Deep control over page flows, dynamic content, open source; integrates with existing HTML/CSS templates. | Requires custom runtime to pre-process HTML before screenshot; still depends on headless browser for rasterization. |
| **WeasyPrint-like JS alternative (e.g., `pagedjs-cli` with Node+PDFKit`)** | Combine HTML parsing (parse5) + CSS layout libs to render into PDF without browser engines. | Potentially lighter footprint; deterministic outputs; easier to embed fonts. | No mature, fully featured engine comparable to WeasyPrint in pure JS; expect significant implementation cost. |
| **PDFKit / jsPDF custom renderers** | Convert Markdown directly to PDF drawing commands. | Complete control, minimal dependencies, no browsers. | Rebuilding layout engine (tables, floats, pagination) is huge effort; limited CSS support. |
| **Hybrid: call external CLI (PrinceXML / Antenna House)** | Commercial renderers accessible via CLI invoked from Node. | Best typography, standards compliance, support. | Violates self-contained/free-usage requirement; licensing costs. |

**Recommendation**: Start by abstracting the renderer so Chromium (current `puppeteer-core`) is one plug-in, then experiment with Playwright (for multi-engine support) and Vivliostyle CLI (for richer paged layout). Long term, evaluate whether a JS-native paged engine (Paged.js) meets requirements, but plan for heavy R&D if you want to avoid browser engines entirely.

# 6. Next Steps
1. **Confirm template storage strategy** (workspace vs bundled defaults) and finalize metadata schema.
2. **Prototype template registry + build-mode setting** to validate UX.
3. **Abstract rendering driver** to enable swapping Chromium for Playwright/Vivliostyle.
4. **Document renderer pros/cons** in README so users understand trade-offs and installation footprint.
5. **Select archiver dependency** (e.g., `archiver`, `yazl`, `zip-lib`) to ensure release command stays self-contained across platforms.

# Appendix A – Suggested Git Branches / Iterations

| Branch Name | Purpose | Notes |
|-------------|---------|-------|
| `template-registry` | Implement core pipeline profile manifest loader, metadata validation, and UI prompts for missing `pipeline_profile`. | Smallest iteration; keeps existing Chromium renderer. |
| `build-mode-settings` | Wire configurable build modes (manual/auto/hybrid) into command handlers and settings UI. | Depends on template registry branch; ensures UX alignment. |
| `renderer-abstraction` | Refactor `extension.js` into parser/template/export modules and introduce renderer interface to swap out Chromium easily. | Enables subsequent experimentation with Playwright/Vivliostyle. |
| `playwright-driver` | Integrate Playwright-based PDF export for multi-engine support; add template flag to select renderer. | Requires new npm deps and additional download size considerations. |
| `vivliostyle-driver` | Prototype Vivliostyle CLI or similar paged-media renderer inside the extension; compare output quality vs Chromium. | Might need bundling CLI assets; evaluate footprint. |
| `image-pipeline` | Add optional Sharp-based image variant generator tied to template directives (DPI, WebP). | Prepares for high-fidelity print templates. |
| `release-command` | Build manual release packaging command respecting template `releaseRules`. | Can be merged after registry and renderer stabilization. |
| `remark-pipeline` | Explore replacing markdown-it with remark/rehype for AST-driven layouts; compare plugin compatibility. | Useful if template logic demands more structured transformations. |
| `non-chromium` | Research/prototype Paged.js, PDFKit, or other non-browser renderers to assess viability of leaving Chromium entirely. | Expected to be long-running; can run parallel to other iterations. |


# Appendix B – Phased Delivery Guidance

Delivering everything at once would bundle metadata validation, template UX, renderer swaps, image processing, and release mechanics into a single giant change—hard to review and risky to roll back. Instead, treat each experimental branch above as a discrete phase with its own acceptance criteria:

1. **Phase 1 – Template Foundations** (`template-registry` + `build-mode-settings`)  
   - Goal: prove the metadata-driven workflow works end-to-end within current renderer.  
   - Acceptance: documents failing validation block builds; missing template triggers prompt; build modes (manual/auto/hybrid) behave per settings.  
   - Status (Dec 5): Complete – template registry, layout loader, schema validator, and renderer logging ship in `extension.js`, with docs/tests in place for the Phase 1 handoff.  
   - Suggestion: keep CLI/test harness minimal so Claude Code can iterate quickly.
2. **Phase 2 – Renderer Abstraction** (`renderer-abstraction`)  
   - Goal: split `extension.js` into parser/template/export modules with a renderer interface.  
   - Acceptance: Chromium path still works; unit tests cover interface boundaries.  
   - Suggestion: add logging hooks so later phases can trace which renderer handled a doc.
3. **Phase 3 – Alternate Renderers** (`playwright-driver`, `vivliostyle-driver`, optional `non-chromium`)  
   - Goal: evaluate non-Chromium or multi-engine options without jeopardizing mainline.  
   - Acceptance: each branch compiles and exports at least one document using its new renderer; fallbacks documented.  
   - Suggestion: create comparison fixtures to judge quality/performance before merging.
4. **Phase 4 – Asset Enhancements** (`image-pipeline`, `remark-pipeline`)  
   - Goal: improve fidelity (DPI/WebP variants) and explore richer parsing flows.  
   - Acceptance: templates can request image quality policies; remark/rehype prototype demonstrates directive handling parity.  
   - Suggestion: gate these behind template flags so existing docs remain unaffected.
5. **Phase 5 – Release Mechanics** (`release-command`)  
   - Goal: add manual packaging respecting template rules.  
   - Acceptance: invoking release command bundles outputs only when template allows; logs/report stored per build.  
   - Suggestion: delay automation until prior phases stabilize to avoid rework.

Working this way lets Claude Code (or any implementer) tackle one risk area at a time, merge when stable, or abandon experiments without destabilizing the core extension.

# Appendix C – Branch Prefix Ideas (Pick & Mix)

## 🧩 Start with a Branch Type Prefix

Use prefixes to communicate purpose at a glance. Common ones include:

| Prefix              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `feature/`          | New features or enhancements                     |
| `bugfix/` or `fix/` | Fixing non-critical bugs                         |
| `hotfix/`           | Urgent production fixes                          |
| `release/`          | Preparing a release                              |
| `chore/`            | Maintenance, refactors, tooling updates          |
| `docs/`             | Documentation updates                            |
| `test/`             | Experiments, testing changes                     |
| `ci/`               | Continuous integration or build pipeline changes |

Aurora is the primary suggestion, but here are 50 additional prefixes you can adopt per release train or experimentation theme:

## 50 Random Prefix Names

1. `prism`
2. `nebula`
3. `solstice`
4. `zenith`
5. `eclipse`
6. `lumen`
7. `spectra`
8. `halo`
9. `radiant`
10. `pulse`
11. `phoenix`
12. `quasar`
13. `stellar`
14. `nova`
15. `aperture`
16. `glyph`
17. `vector`
18. `atlas`
19. `cascade`
20. `meridian`
21. `cipher`
22. `ember`
23. `spectrum`
24. `polaris`
25. `horizon`
26. `vortex`
27. `mirage`
28. `flux`
29. `ion`
30. `lattice`
31. `matrix`
32. `ridge`
33. `signal`
34. `emberglow`
35. `frostline`
36. `silhouette`
37. `cascade`
38. `obsidian`
39. `solace`
40. `tempo`
41. `vectorlight`
42. `plasma`
43. `resonance`
44. `arcadia`
45. `lyric`
46. `pulsewave`
47. `syntax`
48. `glyphic`
49. `orbit`
50. `luminary`

Mix and match as needed; consistent prefixes per development wave help automation, but varying them can signal different experiment families.
