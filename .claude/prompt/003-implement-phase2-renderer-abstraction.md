<objective>
Implement Phase 2 – Renderer Abstraction for MarkPrint VS Code extension following the complete specification in `.plan/PHASE2_Renderer_Abstraction_Proposal.md`. This refactors the monolithic Chromium rendering path into a modular, extensible renderer system while maintaining 100% backward compatibility and zero user-facing changes.

**End Goal**: Enable future multi-engine support (Playwright, Vivliostyle, Scribus) by creating clean renderer abstraction, while keeping Chromium as the default and only active renderer in Phase 2.

**Why This Matters**: Current implementation has Chromium/Puppeteer logic deeply embedded in `extension.js` (~500 lines). This blocks future renderer adoption, makes testing difficult, and prevents template-driven renderer selection. Phase 2 creates the foundation for MarkPrint's multi-engine vision.

**Who Uses This**: Future implementers adding Playwright/Vivliostyle renderers (Phase 3+), template authors specifying `rendererHint`, and users who need fallback rendering options.
</objective>

<context>
Read @.claude/prp/PRP_CORE.md for project rules, conventions, and governance policies. All work must comply with PRP policies.

**Project Context**:
- MarkPrint is a VS Code extension (Node/JS) that converts Markdown to PDF/HTML/PNG/JPEG
- Current renderer: Puppeteer (Chromium headless browser) hardcoded in `extension.js`
- Phase 1 complete: Template registry, layout loader, schema validator, pipeline profiles
- Phase 2 scope: Extract renderer abstraction WITHOUT adding new engines yet

**Critical Files to Read Before Starting**:
- @.plan/PHASE2_Renderer_Abstraction_Proposal.md (complete specification, ~950 lines)
- @.plan/MarkPrint-impromptu-proposal.md (original architecture vision)
- @.claude/prompt/multi-engine-phase2.md (Phase 2 requirements)
- @docs/pipeline-profile-manifest-spec.md (template schema)
- @extension.js (current monolithic implementation)
- @src/templateRegistry.js (Phase 1 template system)
- @src/layoutLoader.js (Phase 1 layout parsing)
- @package.json (dependencies, commands, configuration)

**Environment**:
- Node.js + VS Code Extension Host
- WSL2 compatible (requires Chromium dependencies: libnss3, libnspr4, etc.)
- Test harness: `npm run test:download-vscode && npm test`
- Current Puppeteer version: `puppeteer-core@2.1.1`
</context>

<requirements>
**PRP Compliance** (MANDATORY):
1. Read files immediately before editing (PRP file editing safety policy)
2. Keep the extension self-contained (Node/JS only, no external CLIs)
3. Honor command naming: `extension.markprint.*` for exports, `markprint.*` for templates
4. Load templates through `src/templateRegistry.js` and `src/layoutLoader.js`
5. Run `npm test` after changes touching renderer/template/command logic
6. Update documentation (`README.md`, `MIGRATION.md`, `docs/`) for architectural changes
7. Respect `pipeline_profile` as the single selector; manifests in `templates/*.json` are source of truth

**Phase 2 Acceptance Criteria** (from proposal):
- ✅ Chromium path continues to work end-to-end (no regressions)
- ✅ Unit tests cover renderer interface boundaries
- ✅ Renderer hints from pipeline profiles are respected (logged, routed to Chromium)
- ✅ Code is self-contained (no new dependencies beyond existing Puppeteer)
- ✅ Template `renderer.engine` and `layout.rendererHint` drive selection
- ✅ Profile `outputs.*.target_directory` honored (precedence over `markprint.outputDirectory`)

**Functional Requirements**:
1. Create renderer interface (`IRendererDriver`) with methods: `renderToPdf()`, `renderToPng()`, `renderToJpeg()`, `renderToHtml()`, `canHandle()`, `dispose()`
2. Implement `RendererRegistry` with selection logic (template → layout → capability → default)
3. Extract Chromium renderer into `src/renderers/chromiumRenderer.js` (port all Puppeteer logic)
4. Update `extension.js` to use renderer selection instead of hardcoded `renderWithChromium()`
5. Honor `profile.outputs.*.target_directory` with precedence: profile → setting → source directory
6. Log all renderer selections with name, version, reason, context
7. Preserve all existing configuration options (`markprint.executablePath`, margins, headers, etc.)

**Non-Functional Requirements**:
- Zero breaking changes to user experience
- No performance regression in export times
- Maintain WSL2 compatibility (same Chromium dependencies)
- Keep test coverage at or above Phase 1 levels
- Code maintainability: small functions, JSDoc comments, clear separation of concerns
</requirements>

<implementation>
Follow the 6-step roadmap from `.plan/PHASE2_Renderer_Abstraction_Proposal.md` section 9:

**Step 1: Create Renderer Interface (1-2 days)**

Use MCP tools to explore existing renderer patterns:
```javascript
// Use mcp__serena__find_symbol to locate current rendering logic
// Use mcp__serena__search_for_pattern to find all Puppeteer usage
// Use mcp__serena__get_symbols_overview for extension.js structure
```

Create new files:
- `./src/renderers/index.js` - Define `IRendererDriver` class and `RendererRegistry` class
- `./src/renderers/baseRenderer.js` (optional) - Abstract base class

Interface must include:
```javascript
class IRendererDriver {
  constructor(options) {
    this.name = 'unknown';
    this.version = '0.0.0';
    this.supportedFormats = [];
  }

  canHandle(context) { /* return boolean */ }
  async renderToPdf(html, options) { /* throw if not implemented */ }
  async renderToPng(html, options) { /* throw if not implemented */ }
  async renderToJpeg(html, options) { /* throw if not implemented */ }
  async renderToHtml(html, options) { /* default: write to file */ }
  async dispose() { /* cleanup */ }
}
```

Registry must include:
```javascript
class RendererRegistry {
  register(name, renderer) { /* store in Map */ }
  select(context) {
    // Priority: template.renderer.engine → layout.rendererHint → canHandle() → default
    // Return IRendererDriver instance
  }
  get(name) { /* retrieve by name */ }
}
```

Write unit tests: `./test/suite/renderer.test.js` covering:
- Registry registration and retrieval
- Selection logic with various contexts
- Fallback to default renderer

**Step 2: Extract Chromium Renderer (2-3 days)**

Use MCP to identify all Chromium/Puppeteer code:
```javascript
// mcp__serena__search_for_pattern with pattern: "puppeteer|page\.pdf|page\.screenshot|exportPdf"
// mcp__serena__find_symbol for renderWithChromium, exportPdf, makeHtml functions
```

Create: `./src/renderers/chromiumRenderer.js`

Port the following from `extension.js` into ChromiumRenderer class:
1. `exportPdf()` logic → `renderToPdf()` method
2. PNG screenshot → `renderToPng()` method
3. JPEG screenshot → `renderToJpeg()` method
4. Configuration reading (`buildPdfOptions()`, `buildScreenshotOptions()`)
5. Browser lifecycle (launch, page, close)
6. Error handling and logging

Critical: Read extension.js thoroughly before extracting. Use mcp__serena__find_symbol with include_body=true:
```javascript
// Find and read full implementations:
// - renderWithChromium
// - exportPdf
// - convertMarkdownToHtml
// - makeHtml
```

Ensure ChromiumRenderer:
- Uses `debugLogger.log('renderer', ...)` for all operations
- Reads config via `vscode.workspace.getConfiguration('markprint')`
- Supports all existing options (margins, headers, footers, page ranges, clip regions)
- Handles errors with descriptive messages
- Cleans up browser instances in finally blocks

Validation:
- All existing integration tests pass (`npm test`)
- Manual export of `test/suite/SOP-200_Create_Workpackage_Sequencing_Type.md` produces identical output to Phase 1

**Step 3: Wire Renderer Selection (1-2 days)**

Modify `extension.js`:

1. Import renderer modules:
```javascript
const { RendererRegistry } = require('./src/renderers/index');
const ChromiumRenderer = require('./src/renderers/chromiumRenderer');
```

2. Initialize in `activate()` function:
```javascript
let rendererRegistry;

function activate(context) {
  // ... existing Phase 1 initialization ...

  rendererRegistry = new RendererRegistry();
  rendererRegistry.register('chromium', new ChromiumRenderer({
    extensionPath: context.extensionPath
  }));

  debugLogger.log('renderer', 'Renderer registry initialized', {
    available: Array.from(rendererRegistry.renderers.keys()),
    default: rendererRegistry.defaultRenderer
  });
}
```

3. Replace `renderWithChromium()` calls with new `renderWithEngine()`:
```javascript
async function renderWithEngine({ renderer, type, uri, text, filename, sourcePath, template, context }) {
  debugLogger.log('renderer', 'Render pipeline start', {
    renderer: renderer.name,
    type,
    document: sourcePath
  });

  // Parse front matter
  const grayMatter = require('gray-matter');
  const matterParts = grayMatter(text);

  // Markdown → HTML (keep existing convertMarkdownToHtml)
  const content = convertMarkdownToHtml(sourcePath, type, text, { matterParts });

  // HTML + template (keep existing makeHtml)
  const html = makeHtml(content, uri, {
    template,
    frontMatter: matterParts.data
  });

  // Resolve output directory
  const outputDir = resolveOutputDirectory(sourcePath, template);
  const outputPath = path.join(outputDir, path.basename(filename));

  const renderOptions = {
    path: outputPath,
    format: type,
    uri,
    template,
    frontMatter: matterParts.data,
    context
  };

  // Dispatch to renderer based on type
  switch (type) {
    case 'pdf': await renderer.renderToPdf(html, renderOptions); break;
    case 'html': await renderer.renderToHtml(html, renderOptions); break;
    case 'png': await renderer.renderToPng(html, renderOptions); break;
    case 'jpeg': await renderer.renderToJpeg(html, renderOptions); break;
    default: throw new Error('Unsupported format: ' + type);
  }

  debugLogger.log('renderer', 'Render pipeline complete', {
    renderer: renderer.name,
    output: outputPath
  });
}
```

4. Update `markprint()` function to select renderer:
```javascript
async function markprint(type, context) {
  // ... existing validation ...

  const activeTemplate = await templateRegistry.getActiveTemplate(editor.document, context.workspaceState);

  const renderContext = {
    format: type,
    template: activeTemplate,
    layout: activeTemplate ? activeTemplate.layoutDescriptor : null,
    document: mdfilename
  };

  const renderer = rendererRegistry.select(renderContext);
  if (!renderer) {
    throw new Error('No suitable renderer available for format: ' + type);
  }

  debugLogger.log('renderer', 'Selected renderer', {
    name: renderer.name,
    version: renderer.version,
    format: type,
    template: activeTemplate ? activeTemplate.id : 'none',
    layoutHint: renderContext.layout ? renderContext.layout.rendererHint : 'none'
  });

  // ... existing export loop with renderWithEngine ...
}
```

**Step 4: Honor profile.outputs (1 day)**

Add output directory resolution function to `extension.js`:

```javascript
function resolveOutputDirectory(sourcePath, template) {
  const vscode = require('vscode');
  const config = vscode.workspace.getConfiguration('markprint');

  // Priority 1: Profile output directory
  if (template && template.profile && template.profile.outputs) {
    const outputConfig = template.profile.outputs.pdf || template.profile.outputs.html;
    if (outputConfig && outputConfig.target_directory) {
      debugLogger.log('renderer', 'Using profile output directory', {
        directory: outputConfig.target_directory,
        precedence: 'profile'
      });
      return resolveSettingPath(outputConfig.target_directory, sourcePath);
    }
  }

  // Priority 2: markprint.outputDirectory setting
  const settingDir = config['outputDirectory'];
  if (settingDir) {
    debugLogger.log('renderer', 'Using setting output directory', {
      directory: settingDir,
      precedence: 'setting'
    });
    return resolveSettingPath(settingDir, sourcePath);
  }

  // Priority 3: Same directory as source file
  debugLogger.log('renderer', 'Using source directory', {
    directory: path.dirname(sourcePath),
    precedence: 'default'
  });
  return path.dirname(sourcePath);
}
```

Test with templates that have `outputs.pdf.target_directory` specified.

**Step 5: Optional Enhancements (1-2 days)**

Extract helper modules for cleaner architecture:
- `./src/parsers/markdownParser.js` - Extract `convertMarkdownToHtml()`
- `./src/templates/htmlGenerator.js` - Extract `makeHtml()`

This is OPTIONAL but recommended for maintainability. Only do if time permits.

**Step 6: Testing & Documentation (2-3 days)**

Testing checklist:
- [ ] Write `test/suite/renderer.test.js` with unit tests for registry and ChromiumRenderer
- [ ] All existing tests pass: `npm run test:download-vscode && npm test`
- [ ] Manual verification: Export SOP-200 to PDF/HTML/PNG/JPEG
- [ ] Verify renderer selection logged correctly
- [ ] Test template with custom `renderer.engine`
- [ ] Test template with `outputs.pdf.target_directory`
- [ ] Test all formats: pdf, html, png, jpeg
- [ ] Test in WSL2 environment (confirm Chromium dependencies installed)

Documentation updates:
1. `./README.md` - Add "Renderer Architecture" section explaining the new system
2. `./MIGRATION.md` - Add Phase 2 section (note: no user migration needed, internal only)
3. `./docs/renderers.md` (NEW) - Document renderer interface, how to add future renderers
4. `./docs/pipeline-profile-manifest-spec.md` - Document `renderer.engine` and `renderer.fallback` schema
5. `./whats-next.md` - Update with Phase 2 completion notes

Use MCP tools for documentation:
```javascript
// mcp__serena__list_dir for docs structure
// mcp__serena__find_file to locate documentation files
// Read existing docs before updating to match style
```

**Code Quality Standards**:
- Add JSDoc comments to all exported functions/classes
- Explain WHY in comments, not just WHAT
- Keep functions small (<50 lines where practical)
- Use descriptive variable names
- Add TODO comments with context for future work
- Follow existing code style (2-space indentation, single quotes)

**Constraints to Respect**:
- DO NOT add new npm dependencies (use existing Puppeteer)
- DO NOT modify `package.json` commands or configuration schema
- DO NOT break backward compatibility with existing templates
- DO NOT change user-facing behavior (same commands, same output)
- DO NOT bypass template registry (always use `templateRegistry.getActiveTemplate()`)
- DO NOT hardcode renderer selection (always use registry.select())
- DO NOT skip reading files before editing (PRP safety policy)
</implementation>

<mcp_integration>
Use all available MCP servers throughout implementation:

**serena (code analysis)**:
- `mcp__serena__get_symbols_overview` on extension.js before refactoring
- `mcp__serena__find_symbol` with include_body=true for functions to extract
- `mcp__serena__search_for_pattern` to find all Puppeteer usage: "puppeteer|page\.pdf|page\.screenshot"
- `mcp__serena__find_referencing_symbols` to understand dependencies before moving code
- `mcp__serena__list_dir` to explore src/ and test/ structure

**exa (web search)**:
- Research any Puppeteer API questions
- Look up Node.js best practices for class abstraction
- Search for VS Code extension testing patterns if needed

**Ref (documentation)**:
- `mcp__Ref__ref_search_documentation` for Puppeteer, VS Code extension API
- `mcp__Ref__ref_read_url` to read specific documentation pages

**Example workflow**:
```javascript
// Before extracting Chromium renderer, use serena to understand current code:
1. mcp__serena__get_symbols_overview("extension.js")
   → Get high-level structure

2. mcp__serena__find_symbol("renderWithChromium", include_body=true)
   → Read full implementation

3. mcp__serena__search_for_pattern("puppeteer", relative_path="extension.js")
   → Find all Puppeteer usage

4. mcp__serena__find_referencing_symbols("renderWithChromium", "extension.js")
   → See what calls this function

// Then proceed with refactoring armed with full knowledge
```
</mcp_integration>

<output>
Create/modify the following files (read before editing per PRP policy):

**New Files**:
1. `./src/renderers/index.js` - IRendererDriver interface, RendererRegistry class
2. `./src/renderers/chromiumRenderer.js` - ChromiumRenderer implementation
3. `./src/renderers/baseRenderer.js` (optional) - Abstract base class
4. `./test/suite/renderer.test.js` - Unit tests for renderer system
5. `./docs/renderers.md` - Renderer architecture documentation

**Modified Files**:
1. `./extension.js` - Replace renderWithChromium with renderWithEngine, add registry initialization, add resolveOutputDirectory
2. `./README.md` - Add renderer architecture section
3. `./MIGRATION.md` - Add Phase 2 internal changes section
4. `./docs/pipeline-profile-manifest-spec.md` - Document renderer.engine schema
5. `./whats-next.md` - Update with Phase 2 completion status

**No Changes to**:
- `package.json` (no new dependencies, commands, or config)
- `src/templateRegistry.js` (already handles renderer metadata)
- `src/layoutLoader.js` (already parses rendererHint)
- User-facing commands or settings
</output>

<verification>
Before declaring Phase 2 complete, verify all acceptance criteria:

**Functional Verification**:
1. Run: `npm run test:download-vscode` (if test binary missing)
2. Run: `npm test` → All tests pass (including new renderer.test.js)
3. Manual test: Open `test/suite/SOP-200_Create_Workpackage_Sequencing_Type.md` in Extension Development Host
4. Execute: `extension.markprint.pdf` command
5. Verify: PDF created in correct directory (check logs for directory resolution)
6. Verify: Debug console shows renderer selection: "Selected renderer: chromium v2.1.1"
7. Execute: `extension.markprint.all` command
8. Verify: PDF, HTML, PNG, JPEG all created
9. Compare: Output files identical to Phase 1 (no visual regressions)

**Code Verification**:
1. Check: `src/renderers/chromiumRenderer.js` exists and exports ChromiumRenderer class
2. Check: `src/renderers/index.js` exports IRendererDriver and RendererRegistry
3. Check: `extension.js` has rendererRegistry initialization in activate()
4. Check: `extension.js` uses renderWithEngine() instead of renderWithChromium()
5. Check: All Puppeteer logic moved out of extension.js into chromiumRenderer.js
6. Check: JSDoc comments added to all new classes/methods
7. Check: No hardcoded renderer selection (always via registry.select())

**Documentation Verification**:
1. Check: `README.md` has renderer architecture section
2. Check: `docs/renderers.md` exists with interface documentation
3. Check: `MIGRATION.md` has Phase 2 section
4. Check: `whats-next.md` updated with Phase 2 completion
5. Check: All docs mention that only Chromium is active (future renderers in Phase 3+)

**Performance Verification**:
1. Measure: Export time for SOP-200.md before and after refactor
2. Verify: No measurable increase (< 100ms variance acceptable)
3. Check: Memory usage stable (no browser instance leaks)

**Logging Verification**:
Check debug console output contains:
- "Renderer registry initialized" with available renderers
- "Selected renderer: chromium v<version>" for each export
- "Using <profile|setting|default> output directory" for directory resolution
- "Chromium PDF render start" / "Chromium PDF render complete" for each operation
</verification>

<success_criteria>
Phase 2 is complete when ALL of the following are true:

✅ **Architecture**:
- Renderer interface (`IRendererDriver`) defined in `src/renderers/index.js`
- Renderer registry (`RendererRegistry`) implemented with selection logic
- Chromium renderer extracted into `src/renderers/chromiumRenderer.js`
- `extension.js` simplified to use renderer abstraction

✅ **Functionality**:
- All export formats work (PDF, HTML, PNG, JPEG)
- Renderer selection based on template.renderer.engine and layout.rendererHint
- Profile outputs.*.target_directory honored with correct precedence
- All existing configuration options work (margins, headers, footers, etc.)

✅ **Testing**:
- Unit tests for RendererRegistry and ChromiumRenderer pass
- All existing integration tests pass (`npm test` green)
- Manual verification: SOP-200 exports identical to Phase 1

✅ **Documentation**:
- README.md updated with renderer architecture
- docs/renderers.md created with interface docs
- MIGRATION.md updated (Phase 2 section)
- whats-next.md updated with completion notes
- pipeline-profile-manifest-spec.md updated with renderer schema

✅ **Logging**:
- Renderer registry initialization logged
- Every render logs selected renderer name, version, reason
- Output directory resolution logged with precedence

✅ **Compatibility**:
- Zero breaking changes to user experience
- All commands work identically
- All settings respected
- Existing templates work without modification

✅ **Code Quality**:
- JSDoc comments on all exported classes/methods
- Small, focused functions (<50 lines)
- No code duplication between extension.js and chromiumRenderer.js
- Follows PRP file editing safety policy
- No linting errors

✅ **PRP Compliance**:
- Self-contained (no new dependencies)
- Command naming preserved
- Templates loaded via templateRegistry
- Tests run and pass
- Documentation synchronized
</success_criteria>

<workflow>
Follow this sequence (PRP-compliant workflow per task):

**Phase 1: Discovery & Planning** (30-60 min)
1. Use MCP serena to scan codebase structure
2. Read all critical files listed in <context>
3. Map current renderer flow (what calls what)
4. Identify extraction points (functions to move)
5. Write 5-7 bullet plan with filenames
6. Get user approval before coding

**Phase 2: Implementation** (6-8 hours across 6 steps)
For each step in the roadmap:
1. Read relevant files (MANDATORY before editing)
2. Make focused changes (1-3 files per step)
3. Re-read after editing to verify
4. Run tests for that step
5. Commit changes with descriptive message
6. Show diff summary to user

**Phase 3: Testing & Validation** (2-3 hours)
1. Run full test suite: `npm test`
2. Manual verification in Extension Development Host
3. Performance check (export timing)
4. Log review (verify renderer selection messages)
5. Compare outputs to Phase 1 baseline

**Phase 4: Documentation** (1-2 hours)
1. Update all docs listed in <output>
2. Verify docs match actual implementation
3. Check for broken links or stale content
4. Add examples where helpful

**Phase 5: Final Review** (30 min)
1. Go through <success_criteria> checklist
2. Verify <verification> steps all pass
3. Create summary of changes
4. List any open questions or follow-ups
</workflow>

<recovery>
If errors occur during implementation:

**File not found (ENOENT)**:
1. Confirm path with `ls` or serena list_dir
2. Re-read the file to refresh state
3. Check if change already exists
4. Use Write instead of Edit for new files

**Tests fail**:
1. Check test output for specific failures
2. Compare implementation to proposal spec
3. Verify Chromium logic correctly ported
4. Check for missing configuration options
5. Add console.log to debug failing cases

**Renderer selection not working**:
1. Log the render context being passed
2. Verify template has renderer.engine set
3. Check registry.select() logic
4. Ensure canHandle() returns true for Chromium

**Output directory wrong**:
1. Check resolveOutputDirectory() logic
2. Verify precedence order (profile → setting → default)
3. Log all three sources to debug
4. Ensure resolveSettingPath() called correctly

**Performance regression**:
1. Check for browser instance leaks (missing close())
2. Verify waitUntil: 'networkidle0' not changed
3. Profile with Chrome DevTools
4. Compare to Phase 1 baseline timing
</recovery>

<unresolved_questions>
Address these during implementation or flag for user:

1. Should renderers track compatibility with template schema versions?
2. If renderer selection fails, fail immediately or try fallbacks from renderer.fallback array?
3. Should output directory conflicts emit warnings to user (e.g., VS Code notification)?
4. Should ChromiumRenderer be a singleton or instantiated per render?
5. Can renderers be tested outside Extension Host for faster iteration?
6. Should template schema enforce valid renderer.engine enum values now or wait for Phase 3?
7. How to educate users about renderer selection (status bar? docs? both)?
</unresolved_questions>

<meta_instructions>
**For the AI implementer**:

- This is a complex, multi-day refactoring. Break it into the 6 steps and validate at each checkpoint.
- Use MCP tools extensively to understand code before changing it.
- Read files immediately before every edit (PRP safety policy).
- Limit to 2 consecutive edits per file without re-reading.
- Run `npm test` after each major step (not after every single edit).
- Show diffs and get user confirmation before proceeding to next step.
- Keep the user informed of progress: "Step 1 complete: renderer interface created and tested."
- If stuck, ask questions rather than guessing.
- Prioritize correctness over speed—this is foundational architecture.
- Document as you go (comments, JSDoc, README updates).

**Expected timeline**:
- Steps 1-3: Core abstraction (4-6 hours)
- Step 4: Output directory (1 hour)
- Step 5: Optional enhancements (2 hours if time permits, skip if tight)
- Step 6: Testing & docs (3-4 hours)
- **Total: 10-13 hours of focused work**

**Parallel tool use**:
When gathering information, invoke multiple MCP tools simultaneously:
- serena: get_symbols_overview + search_for_pattern + find_symbol in one message
- Read multiple files in parallel when they're independent
- This maximizes efficiency and reduces round-trips

**Reflection after tool use**:
After receiving MCP tool results, pause to:
- Synthesize findings across multiple tool outputs
- Identify gaps or inconsistencies
- Determine next best action before proceeding
- Don't rush to edit—understand first

**Final note**: This prompt is self-contained. Everything needed is in `.plan/PHASE2_Renderer_Abstraction_Proposal.md` and the files listed in <context>. Trust the spec—it's been thoroughly researched and validated.
</meta_instructions>


<addendum>
1. Confirm whether SLA-to-frame-map data is consumed anywhere. If not, document the gap (docs/wiki + PHASE2_SUMMARY) and note work needed to turn SLA layouts into HTML/CSS positioning.
2. Call out that the MarkPrint proposal’s release-command requirement is still pending; update PHASE2_SUMMARY.md and whats-next.md accordingly.
3. Update docs/wiki (especially docs/wiki/dev/architecture/layout-loader.md and docs/wiki/full-docs/pipelines/overview.md) so they match final Phase 2 behavior.
4. Add a Phase 2 entry to CHANGELOG.md summarizing renderer abstraction, tests, and documentation changes.
5. Ensure README.md + docs/renderers.md mention that Chromium is still the only active renderer and SLA layouts remain metadata-only until Phase 3.
</addendum>
