You are an AI assistant (Codex) working on the **MarkPrint** VS Code extension.

Your task in this session is **ONLY** to research and draft a **Phase 2 – Renderer Abstraction** proposal as a Markdown document. You MUST NOT modify project code in this task. Treat this as a “plan / design only” phase.

---

## 1. Project context (read this carefully first)

The project is a VS Code extension called **MarkPrint**, a rebranded and extended version of vscode-mark-pdf / vscode-markprint. It converts Markdown to PDF/HTML/PNG/JPEG using Chromium, with a new template/pipeline system layered on top.  

**Phase 1 – Template Foundations is complete.** The codebase already includes:​:contentReference[oaicite:1]{index=1}  

- `src/templateRegistry.js` – template registry that loads bundled + workspace templates (JSON/XML), supports inheritance (`extends`), persists selections, and can inject front matter.  
- `src/statusBar.js` – status bar UI for build mode and active template (manual/auto/hybrid).  
- `src/schemaValidator.js` – AJV-based front-matter validation wired into the Problems panel; export is blocked when metadata is invalid.  
- `templates/standard-letter.json` + `.markprint/schemas/standard-letter.schema.json` – starter template and schema.  
- `markprint.buildMode` setting (`auto | manual | hybrid`) and commands:
  - `markprint.changeBuildMode`
  - `markprint.selectTemplate`
  - `markprint.reloadTemplates`

The README and planning docs now describe **pipeline profiles** and layout descriptors:  

- Front matter uses `pipeline_profile` as the canonical key, with `layout_template` as a backward-compatible alias.  
- Each profile references layout artifacts in `templates/layouts/…` (JSON, Scribus `.sla`, XML/DocBook, etc.), plus `rendererHint` to signal the intended renderer.  
- A `layoutLoader` module parses JSON + Scribus `.sla` artifacts and attaches renderer hints into the registry.

The **Phase 2 slot** (“Renderer Abstraction”) has already been sketched in planning notes:  

- Goal: **split `extension.js` into parser/template/export modules with a renderer interface**, so Chromium is just one driver.  
- Acceptance criteria:
  - The current Chromium path continues to work end-to-end.
  - Unit tests cover the renderer interface boundaries.
  - Renderer hints from pipeline profiles are respected (at least logged, ideally routed).  
- Follow-up phases (not part of this proposal) will plug in alternate renderers (Playwright, Vivliostyle CLI, etc.) using this interface.:contentReference[oaicite:4]{index=4}  

There is also a recent `whats-next.md` and related planning content with handoff notes, outstanding risks (WSL dependencies, VS Code test binary, etc.), and a reference to `multi-engine-phase2.md` for renderer work. Treat these documents as authoritative context for what has already been done and what’s expected next.  

---

## 2. Tools you MUST use (MCP)

Before writing the proposal, you MUST inspect and use these MCP tools if they are available in this environment:

- **exa MCP**  
  - Use it to explore the repository structure (similar to an enhanced `ls` / tree view).
  - At minimum, enumerate:
    - Root files: `package.json`, `extension.js`, `README.md`, `TEST.md`, `MIGRATION.md`, `.plan/…`  
    - Key src paths: `src/templateRegistry.js`, `src/statusBar.js`, `src/schemaValidator.js`, `src/layoutLoader.js`, `src/stylesheetResolver.js`, and any `renderer`/`compile` modules.

- **serna MCP**  
  - Use it for code/content search where supported (e.g., “find references of puppeteer”, “find renderer uses”, “find pipeline_profile”).  
  - Use it to locate anything named like `multi-engine-phase2.md`, `renderer`, `layoutLoader`, or `renderWithChromium`.

- **ref MCP**  
  - Use it to:
    - Pull in project planning docs under `.plan/`, especially:
      - `.plan/MarkPrint-impromptu-proposal.md`
      - `whats-next.md`
      - `README.md`
      - Any `multi-engine-phase2` docs.
    - Store **new reference documents** under `./plan/ref/docs`.  
      Examples of files you may create:
        - `./plan/ref/docs/renderer-options-survey.md`
        - `./plan/ref/docs/playwright-vs-puppeteer.md`
        - `./plan/ref/docs/pipeline-profile-contract-notes.md`

You MUST first introspect each MCP’s capabilities (e.g., via its schema or “help”/introspection call) instead of assuming details. Adjust how you use each tool based on its actual interface.

If any of these MCPs are not available, continue using whatever tools are present and note the missing capabilities in the proposal.

---

## 3. Working conventions for this task

- **Do not edit code** in this task. Read only. The goal is a proposal.  
- Treat all planning / handoff docs in `.plan/` and `docs/` as input.  
- **All new reference material you generate** during research must be stored as Markdown under `./plan/ref/docs`.  
- The final deliverable for this prompt is a single Markdown file:
  - `./plan/PHASE2_Renderer_Abstraction_Proposal.md`

---

## 4. Required research steps

Before drafting the proposal, you MUST:

1. **Build a mental model of the current renderer path**
   - Locate where Chromium / Puppeteer is used (e.g., `renderWithChromium`, `markdownPdf`, etc.).  
   - Identify how export commands (`extension.markprint.export.*`) flow through the code.  
   - Map the path from “user runs export” → “template/profile resolution” → “HTML generation” → “Chromium PDF/PNG/JPEG output”.

2. **Understand the Phase 1 template + pipeline profile system**
   - Review `src/templateRegistry.js`, `src/statusBar.js`, `src/schemaValidator.js`, `docs/templates.md`, and the pipeline-profile manifest spec.  
   - Summarize:
     - How `pipeline_profile` and `layout_template` are resolved.
     - How `layoutLoader` attaches `rendererHint` and other layout descriptors.
     - How build modes (auto/manual/hybrid) currently affect export.

3. **Review Phase 2 planning materials**
   - Read `.plan/MarkPrint-impromptu-proposal.md`, `whats-next.md`, and any `multi-engine-phase2` spec.  
   - Extract:
     - Existing goals and acceptance criteria for Phase 2.
     - Any constraints about being self-contained, Node/JS-only, and not introducing external CLIs.
     - Mentioned renderer candidates (Playwright, Vivliostyle, Paged.js, etc.) and trade-offs.

4. **Research libraries / plugins relevant to renderer abstraction**
   Use the ref MCP (and its connected sources) to gather current information on:
   - `puppeteer-core` vs Playwright’s PDF capabilities.  
   - Vivliostyle CLI and any actively maintained CSS-paged-media tools in Node.  
   - Any JS-first layout / paged-media engines that could realistically be used later.  

   Summarize this research into `./plan/ref/docs/renderer-options-survey.md` before writing the main proposal.

---

## 5. Deliverable: Phase 2 proposal document

Create (or overwrite) the file:

- `./plan/PHASE2_Renderer_Abstraction_Proposal.md`

This document must be **complete and self-contained**. It should be written for a future implementer (or future AI agent) who will actually cut the Phase 2 branch and write the code.

Use the following structure:

1. **Overview & Goals**
   - Summarize what Phase 2 – Renderer Abstraction is meant to achieve in the context of MarkPrint.  
   - Explicitly restate the Phase 2 goal and acceptance criteria based on existing planning docs.  

2. **Current State (Post-Phase 1)**
   - Describe the current architecture:
     - Template registry, schema validator, status bar, build modes, pipeline profiles, layout loader, Chromium renderer.  
   - Include a simple ASCII diagram of the current export pipeline:
     - Markdown → metadata → template/profile → layout loader → HTML → Chromium.

3. **Non-negotiable requirements and constraints**
   - Self-contained Node/JS extension – no external CLIs or system dependencies beyond what Phase 1 already introduced.  
   - Preserve existing user-facing commands and config (`extension.markprint.export.*`, `markprint.buildMode`, etc.).:contentReference[oaicite:13]{index=13}  
   - Chromium path remains the default and must be fully functional after Phase 2.  
   - Pipeline profiles and `rendererHint` must remain the primary way to drive renderer selection in future phases, even if Phase 2 only wires the abstraction and logs hints.

4. **Target architecture for Phase 2**
   - Propose a modular architecture that:
     - Extracts a **renderer interface** (e.g. `IRendererDriver`) with methods like `renderToPdf`, `renderToPng`, `renderToHtml`, etc.  
     - Refactors `extension.js` into coherent modules:
       - Activation / command wiring
       - Template & profile resolution layer
       - Renderer orchestrator (choosing a driver based on profile hints + defaults)
       - Concrete Chromium driver implementation
     - Shows how pipeline profile metadata (`profile.outputs`, `rendererHint`) flows into renderer selection without yet adding alternate engines.  

   - Include:
     - A proposed TS/JS interface for the driver.  
     - A sequence diagram for an export call in the new architecture.

5. **Renderer driver strategy**
   - Document how the **Chromium driver** will be encapsulated:
     - Where it lives (`src/renderers/chromiumRenderer.js` or similar).  
     - How it receives HTML, CSS, template metadata, and output options.  
     - How it integrates with existing settings such as `markprint.outputDirectory`, `markprint.displayHeaderFooter`, etc.  

   - Summarize possible **future drivers** (not implemented in Phase 2) using your research notes:
     - Playwright-based driver
     - Vivliostyle-based driver
     - Any others that pass your feasibility checks:contentReference[oaicite:16]{index=16}  

6. **Library & plugin recommendations**
   - Based on your research, make concrete recommendations for:
     - Which libraries to keep (e.g., continue with `puppeteer-core` for Chromium).  
     - Which libraries to add later (e.g., Playwright, Vivliostyle CLI) and what new footprint / trade-offs they introduce.  
   - Include pros/cons and any constraints that align with the project’s “self-contained” philosophy.

7. **Testing and CI implications**
   - Describe how the renderer interface should be tested:
     - Unit tests for the interface and for the Chromium driver.  
     - Integration tests that prove “Phase 1 behaviors still work” (template validation, build modes, pipeline profiles).  
   - Call out WSL / VS Code integration test dependencies (Chromium shared libs, VS Code test binary download) and how they impact Phase 2 work.  

8. **Migration & compatibility plan**
   - Explain how to migrate from the current implementation to the abstracted renderer without breaking users:
     - Maintain command IDs and config keys.  
     - Keep existing behavior as the default path.  
     - Consider feature flags or gradual rollout where useful.

9. **Implementation roadmap for Phase 2**
   - Provide a step-by-step plan broken into small, reviewable chunks (branch-friendly):
     - e.g., `renderer-abstraction` branch tasks:
       - Introduce `IRendererDriver` and Chromium driver.
       - Refactor export path to use the driver.
       - Wire renderer selection around a single “Chromium” driver initially.
       - Add tests and logging.  
   - Each step should specify:
     - What code modules are touched.
     - How to validate success (tests, manual checks).
     - Any risk mitigation.

10. **Risks, trade-offs, and open issues**
    - Identify key risks (complexity, test fragility, multi-engine footprint, WSL environment issues, etc.).  
    - List **explicit open issues** that a future implementer or AI should resolve before or during Phase 2 implementation.

    Format this section as a numbered list of short, high-signal bullet points so the human owner can easily respond.

---

## 6. Style and output requirements

- Write in clear, direct, engineering-focused language.  
- Assume the reader is familiar with Node, VS Code extensions, and basic print/layout concepts.  
- Prefer lists and short paragraphs to big text blocks.  
- When you reference files or modules, use relative paths from the repo root.  
- At the very end of the proposal document, include a short **“Unresolved Questions”** section with bullets that are extremely concise (optimize for clarity over grammar).

---

## 7. Final action

Once you have:

1. Read the repo and planning docs using the MCP tools.  
2. Written any supporting research notes under `./plan/ref/docs`.  

…then generate the complete `./plan/PHASE2_Renderer_Abstraction_Proposal.md` in a single response, wrapped in a Markdown code block so it can be saved directly.

Do **not** perform any code edits in this task. Only produce the proposal and any supporting reference Markdown content.
