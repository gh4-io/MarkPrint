# Phase 2 – Renderer Abstraction Proposal

**Document ID**: PLAN-Phase2-001
**Version**: 1.0
**Date**: 2025-12-06
**Status**: Ready for Implementation
**Author**: Codex (Claude Sonnet 4.5)

---

## 1. Overview & Goals

### 1.1 Purpose

Phase 2 – Renderer Abstraction refactors MarkPrint's export pipeline to support multiple rendering engines beyond the current Puppeteer/Chromium implementation. This enables:

- **Future multi-engine support**: Playwright, Vivliostyle, Paged.js, Scribus
- **Improved testability**: Isolated renderer logic with clear interfaces
- **Layout flexibility**: Route SLA/DocBook/XML layouts to appropriate renderers
- **Risk mitigation**: Fallback options if primary renderer fails

### 1.2 Phase 2 Acceptance Criteria

From existing planning docs (`.plan/MarkPrint-impromptu-proposal.md`, `multi-engine-phase2.md`):

✅ **Goal**: Split `extension.js` into parser/template/export modules with a renderer interface
✅ **Acceptance**:
- Chromium path continues to work end-to-end (no regressions)
- Unit tests cover renderer interface boundaries
- Renderer hints from pipeline profiles are respected (logged, ideally routed)
- Code is self-contained (Node/JS only, no external CLIs)

### 1.3 Non-Goals (Deferred to Phase 3+)

- ❌ Implementing alternate renderers (Playwright, Vivliostyle) — abstraction only
- ❌ Scribus CLI invocation — Phase 2 creates handoff artifacts, doesn't execute
- ❌ PDF/X-1a or advanced output formats — handled by renderer implementations later
- ❌ Breaking changes to user-facing commands or configuration

---

## 2. Current State (Post-Phase 1)

### 2.1 Architecture Snapshot

```
Markdown + YAML front matter
    ↓ (gray-matter parsing)
Template Registry → resolves pipeline_profile
    ↓
Schema Validator → enforces metadata compliance
    ↓
Layout Loader → parses CSS/JSON/SLA/XML artifacts
    ↓
extension.js → markprint() → renderWithChromium()
    ↓
convertMarkdownToHtml (markdown-it + plugins)
    ↓
makeHtml (Mustache templating + CSS injection)
    ↓
exportPdf (Puppeteer page.pdf() / page.screenshot())
    ↓
PDF/HTML/PNG/JPEG output
```

### 2.2 Key Phase 1 Components

| Module | Responsibility | Status |
|--------|---------------|--------|
| `src/templateRegistry.js` | Load/resolve pipeline profiles (JSON/XML) | ✅ Complete |
| `src/layoutLoader.js` | Parse layout artifacts (SLA/JSON/DocBook) | ✅ Complete |
| `src/schemaValidator.js` | Validate metadata via AJV | ✅ Complete |
| `src/statusBar.js` | UI for build mode + template selection | ✅ Complete |
| `extension.js` (lines 313-329) | `renderWithChromium()` orchestration | ⚠️ Monolithic |
| `extension.js` (lines 372-600+) | `convertMarkdownToHtml()` logic | ⚠️ Tightly coupled |
| `extension.js` (lines 600-800+) | `makeHtml()` + `exportPdf()` | ⚠️ Chromium-specific |

### 2.3 Current Renderer Flow (Chromium)

```javascript
// extension.js line 313
async function renderWithChromium({ type, uri, text, filename, sourcePath, template }) {
  debugLogger.log('renderer', 'Chromium render start', { type, document: sourcePath });

  // 1. Parse front matter
  const grayMatter = require('gray-matter');
  const matterParts = grayMatter(text);

  // 2. Markdown → HTML
  const content = convertMarkdownToHtml(sourcePath, type, text, { matterParts });

  // 3. HTML + template → final HTML
  const html = makeHtml(content, uri, {
    template,
    frontMatter: matterParts.data
  });

  // 4. HTML → PDF/PNG/JPEG
  await exportPdf(html, filename, type, uri);
}
```

**Problems**:
- Renderer selection hardcoded (`renderWithChromium` always called)
- Markdown parsing, HTML generation, PDF export all inline
- No abstraction for future renderers (Playwright, Vivliostyle, Scribus)
- Template `rendererHint` logged but not respected

---

## 3. Non-Negotiable Requirements & Constraints

### 3.1 Compatibility Requirements

1. **Preserve existing commands**: `extension.markprint.pdf`, `extension.markprint.html`, etc.
2. **Maintain configuration**: All `markprint.*` settings continue to work
3. **No user-facing changes**: Same UI, same workflows
4. **Backward compatibility**: Existing templates/profiles work without modification
5. **Default behavior unchanged**: Chromium remains default renderer

### 3.2 Technical Constraints

1. **Self-contained Node/JS**: No external CLIs or system dependencies beyond Phase 1
2. **VS Code extension compatibility**: Must work in Extension Host environment
3. **WSL2 support**: Existing Linux dependencies (libnss3, etc.) remain acceptable
4. **Test coverage**: Unit tests for new interfaces, integration tests for Chromium path
5. **Performance**: No measurable regression in export times

### 3.3 Pipeline Profile Contract

Templates use `pipeline_profile` manifest structure:

```json
{
  "profile": {
    "id": "dts-master-report",
    "label": "DTS Master Report",
    "schema": ".markprint/schemas/dts-master-report.schema.json"
  },
  "layout": {
    "type": "sla",
    "source": "${extensionPath}/templates/layouts/DTS_Master_Report_Template.sla",
    "rendererHint": "scribus"
  },
  "renderer": {
    "engine": "chromium",
    "fallback": ["vivliostyle", "chromium"]
  }
}
```

Phase 2 must respect:
- `layout.rendererHint` (log and route when possible)
- `renderer.engine` (select primary renderer)
- `renderer.fallback` (graceful degradation)

---

## 4. Target Architecture for Phase 2

### 4.1 Module Structure

```
src/
  renderers/
    index.js              # Renderer registry + interface
    chromiumRenderer.js   # Puppeteer implementation
    baseRenderer.js       # Abstract base class (optional)

  parsers/
    markdownParser.js     # Extract convertMarkdownToHtml

  templates/
    htmlGenerator.js      # Extract makeHtml

  exporters/
    pdfExporter.js        # Extract exportPdf (Chromium-agnostic wrapper)

extension.js              # Simplified orchestration
```

### 4.2 Renderer Interface (IRendererDriver)

```javascript
// src/renderers/index.js

/**
 * Base renderer interface
 * All renderers must implement these methods
 */
class IRendererDriver {
  constructor(options = {}) {
    this.name = 'unknown';
    this.version = '0.0.0';
    this.supportedFormats = [];
  }

  /**
   * Check if this renderer can handle the request
   * @param {Object} context - Rendering context (format, template, layout)
   * @returns {boolean}
   */
  canHandle(context) {
    return false;
  }

  /**
   * Render HTML to PDF
   * @param {string} html - HTML content
   * @param {Object} options - Rendering options (path, format, margins, etc.)
   * @returns {Promise<void>}
   */
  async renderToPdf(html, options) {
    throw new Error('renderToPdf not implemented');
  }

  /**
   * Render HTML to PNG image
   * @param {string} html - HTML content
   * @param {Object} options - Screenshot options
   * @returns {Promise<void>}
   */
  async renderToPng(html, options) {
    throw new Error('renderToPng not implemented');
  }

  /**
   * Render HTML to JPEG image
   * @param {string} html - HTML content
   * @param {Object} options - Screenshot options
   * @returns {Promise<void>}
   */
  async renderToJpeg(html, options) {
    throw new Error('renderToJpeg not implemented');
  }

  /**
   * Render to HTML file (pass-through or enhanced)
   * @param {string} html - HTML content
   * @param {Object} options - Output options
   * @returns {Promise<void>}
   */
  async renderToHtml(html, options) {
    // Default implementation: write HTML to file
    const fs = require('fs');
    await fs.promises.writeFile(options.path, html, 'utf-8');
  }

  /**
   * Cleanup resources (close browser, temp files, etc.)
   * @returns {Promise<void>}
   */
  async dispose() {
    // Override if cleanup needed
  }
}

/**
 * Renderer Registry
 * Manages available renderers and selects appropriate one
 */
class RendererRegistry {
  constructor() {
    this.renderers = new Map();
    this.defaultRenderer = null;
  }

  /**
   * Register a renderer
   * @param {string} name - Renderer identifier
   * @param {IRendererDriver} renderer - Renderer instance
   */
  register(name, renderer) {
    this.renderers.set(name, renderer);
    if (!this.defaultRenderer) {
      this.defaultRenderer = name;
    }
  }

  /**
   * Select renderer based on context
   * @param {Object} context - { format, template, layout, hints }
   * @returns {IRendererDriver|null}
   */
  select(context) {
    const { template, layout } = context;

    // 1. Check template renderer.engine preference
    if (template && template.renderer && template.renderer.engine) {
      const preferred = this.renderers.get(template.renderer.engine);
      if (preferred && preferred.canHandle(context)) {
        return preferred;
      }
    }

    // 2. Check layout rendererHint
    if (layout && layout.rendererHint) {
      const hinted = this.renderers.get(layout.rendererHint);
      if (hinted && hinted.canHandle(context)) {
        return hinted;
      }
    }

    // 3. Find first renderer that can handle
    for (const renderer of this.renderers.values()) {
      if (renderer.canHandle(context)) {
        return renderer;
      }
    }

    // 4. Fall back to default
    return this.renderers.get(this.defaultRenderer);
  }

  /**
   * Get renderer by name
   * @param {string} name - Renderer identifier
   * @returns {IRendererDriver|null}
   */
  get(name) {
    return this.renderers.get(name) || null;
  }
}

module.exports = { IRendererDriver, RendererRegistry };
```

### 4.3 Chromium Renderer Implementation

```javascript
// src/renderers/chromiumRenderer.js

const { IRendererDriver } = require('./index');
const debugLogger = require('../debugLogger');

class ChromiumRenderer extends IRendererDriver {
  constructor(options = {}) {
    super(options);
    this.name = 'chromium';
    this.version = this.getChromiumVersion();
    this.supportedFormats = ['pdf', 'html', 'png', 'jpeg'];
    this.extensionPath = options.extensionPath;
  }

  getChromiumVersion() {
    try {
      const puppeteer = require('puppeteer-core');
      return require(path.join(__dirname, '../../node_modules/puppeteer-core/package.json')).version;
    } catch (error) {
      return 'unknown';
    }
  }

  canHandle(context) {
    // Chromium handles all formats
    return this.supportedFormats.includes(context.format);
  }

  async renderToPdf(html, options) {
    debugLogger.log('renderer', 'Chromium PDF render start', options);

    const puppeteer = require('puppeteer-core');
    const vscode = require('vscode');
    const path = require('path');

    // Get Chromium executable path
    const executablePath = vscode.workspace.getConfiguration('markprint')['executablePath']
      || puppeteer.executablePath();

    // Launch browser
    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      // Build PDF options from markprint config + override
      const pdfOptions = this.buildPdfOptions(options);
      await page.pdf(pdfOptions);

      debugLogger.log('renderer', 'Chromium PDF render complete', {
        path: pdfOptions.path,
        format: pdfOptions.format
      });
    } finally {
      await browser.close();
    }
  }

  async renderToPng(html, options) {
    debugLogger.log('renderer', 'Chromium PNG render start', options);

    const puppeteer = require('puppeteer-core');
    const vscode = require('vscode');

    const executablePath = vscode.workspace.getConfiguration('markprint')['executablePath']
      || puppeteer.executablePath();

    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const screenshotOptions = this.buildScreenshotOptions(options, 'png');
      await page.screenshot(screenshotOptions);

      debugLogger.log('renderer', 'Chromium PNG render complete', {
        path: screenshotOptions.path
      });
    } finally {
      await browser.close();
    }
  }

  async renderToJpeg(html, options) {
    // Similar to PNG but with type: 'jpeg' and quality setting
    debugLogger.log('renderer', 'Chromium JPEG render start', options);

    const puppeteer = require('puppeteer-core');
    const vscode = require('vscode');

    const executablePath = vscode.workspace.getConfiguration('markprint')['executablePath']
      || puppeteer.executablePath();

    const browser = await puppeteer.launch({
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const screenshotOptions = this.buildScreenshotOptions(options, 'jpeg');
      await page.screenshot(screenshotOptions);

      debugLogger.log('renderer', 'Chromium JPEG render complete', {
        path: screenshotOptions.path
      });
    } finally {
      await browser.close();
    }
  }

  buildPdfOptions(options) {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('markprint');

    return {
      path: options.path,
      scale: config['scale'] || 1,
      displayHeaderFooter: config['displayHeaderFooter'] !== false,
      headerTemplate: config['headerTemplate'] || '',
      footerTemplate: config['footerTemplate'] || '',
      printBackground: config['printBackground'] !== false,
      landscape: config['orientation'] === 'landscape',
      pageRanges: config['pageRanges'] || '',
      format: config['format'] || 'A4',
      width: config['width'] || undefined,
      height: config['height'] || undefined,
      margin: {
        top: config['margin.top'] || '1.5cm',
        right: config['margin.right'] || '1cm',
        bottom: config['margin.bottom'] || '1cm',
        left: config['margin.left'] || '1cm'
      },
      preferCSSPageSize: options.preferCSSPageSize || false
    };
  }

  buildScreenshotOptions(options, type) {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('markprint');

    const opts = {
      path: options.path,
      type,
      fullPage: true,
      omitBackground: config['omitBackground'] || false
    };

    if (type === 'jpeg') {
      opts.quality = config['quality'] || 100;
    }

    // Clip region if specified
    const clip = {};
    if (config['clip.x']) clip.x = config['clip.x'];
    if (config['clip.y']) clip.y = config['clip.y'];
    if (config['clip.width']) clip.width = config['clip.width'];
    if (config['clip.height']) clip.height = config['clip.height'];

    if (Object.keys(clip).length === 4) {
      opts.clip = clip;
      opts.fullPage = false;
    }

    return opts;
  }
}

module.exports = ChromiumRenderer;
```

### 4.4 Renderer Orchestration in extension.js

```javascript
// extension.js (simplified)

const { RendererRegistry } = require('./src/renderers/index');
const ChromiumRenderer = require('./src/renderers/chromiumRenderer');
const { convertMarkdownToHtml } = require('./src/parsers/markdownParser');
const { makeHtml } = require('./src/templates/htmlGenerator');

let rendererRegistry;

function activate(context) {
  // ... existing Phase 1 initialization ...

  // Initialize renderer registry
  rendererRegistry = new RendererRegistry();
  rendererRegistry.register('chromium', new ChromiumRenderer({
    extensionPath: context.extensionPath
  }));

  debugLogger.log('renderer', 'Renderer registry initialized', {
    available: Array.from(rendererRegistry.renderers.keys()),
    default: rendererRegistry.defaultRenderer
  });

  // ... command registration ...
}

async function markprint(type, context) {
  try {
    // ... validation and setup ...

    // Get active template
    const activeTemplate = await templateRegistry.getActiveTemplate(editor.document, context.workspaceState);

    // Build render context
    const renderContext = {
      format: type,
      template: activeTemplate,
      layout: activeTemplate ? activeTemplate.layoutDescriptor : null,
      document: mdfilename
    };

    // Select renderer
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

    // Render
    const documentText = editor.document.getText();
    for (var i = 0; i < types.length; i++) {
      var exportType = types[i];
      if (types_format.indexOf(exportType) >= 0) {
        filename = mdfilename.replace(ext, '.' + exportType);
        await renderWithEngine({
          renderer,
          type: exportType,
          uri,
          text: documentText,
          filename,
          sourcePath: mdfilename,
          template: activeTemplate,
          context: renderContext
        });
      }
    }
  } catch (error) {
    showErrorMessage('markprint()', error);
  }
}

async function renderWithEngine({ renderer, type, uri, text, filename, sourcePath, template, context }) {
  debugLogger.log('renderer', 'Render pipeline start', {
    renderer: renderer.name,
    type,
    document: sourcePath
  });

  // 1. Parse front matter
  const grayMatter = require('gray-matter');
  const matterParts = grayMatter(text);

  // 2. Markdown → HTML
  const content = convertMarkdownToHtml(sourcePath, type, text, { matterParts });

  // 3. HTML + template → final HTML
  const html = makeHtml(content, uri, {
    template,
    frontMatter: matterParts.data
  });

  if (typeof html !== 'string' || html.length === 0) {
    throw new Error('Renderer produced empty HTML content.');
  }

  // 4. Dispatch to renderer
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

  switch (type) {
    case 'pdf':
      await renderer.renderToPdf(html, renderOptions);
      break;
    case 'html':
      await renderer.renderToHtml(html, renderOptions);
      break;
    case 'png':
      await renderer.renderToPng(html, renderOptions);
      break;
    case 'jpeg':
      await renderer.renderToJpeg(html, renderOptions);
      break;
    default:
      throw new Error('Unsupported format: ' + type);
  }

  debugLogger.log('renderer', 'Render pipeline complete', {
    renderer: renderer.name,
    output: outputPath
  });
}

function resolveOutputDirectory(sourcePath, template) {
  const vscode = require('vscode');
  const config = vscode.workspace.getConfiguration('markprint');

  // Profile output directory takes precedence
  if (template && template.profile && template.profile.outputs) {
    const outputConfig = template.profile.outputs.pdf || template.profile.outputs.html;
    if (outputConfig && outputConfig.target_directory) {
      debugLogger.log('renderer', 'Using profile output directory', {
        directory: outputConfig.target_directory
      });
      return resolveSettingPath(outputConfig.target_directory, sourcePath);
    }
  }

  // Fall back to markprint.outputDirectory setting
  const settingDir = config['outputDirectory'];
  if (settingDir) {
    return resolveSettingPath(settingDir, sourcePath);
  }

  // Default: same directory as source file
  return path.dirname(sourcePath);
}
```

---

## 5. Renderer Driver Strategy

### 5.1 Chromium Driver Encapsulation

**Location**: `src/renderers/chromiumRenderer.js`

**Inputs**:
- HTML content (string)
- Render options (path, format, margins, header/footer templates)
- Template metadata (for CSS, fonts, custom settings)
- VS Code configuration (`markprint.*` settings)

**Processing**:
1. Launch Puppeteer browser with configured executable path
2. Set page content with HTML
3. Wait for `networkidle0` (images, CSS loaded)
4. Call `page.pdf()` or `page.screenshot()` with options from config
5. Close browser
6. Log completion with output path

**Integration Points**:
- Reads `markprint.executablePath`, `markprint.format`, `markprint.margin.*`
- Uses existing `debugLogger` for telemetry
- No changes to Puppeteer API usage—direct port from current `exportPdf()`

### 5.2 Future Renderer Implementations

While **not implemented in Phase 2**, the architecture enables:

#### Playwright Renderer (`src/renderers/playwrightRenderer.js`)

```javascript
class PlaywrightRenderer extends IRendererDriver {
  constructor(options = {}) {
    super(options);
    this.name = 'playwright';
    this.supportedFormats = ['pdf', 'png', 'jpeg', 'html'];
    this.browserType = options.browserType || 'chromium'; // or 'firefox', 'webkit'
  }

  async renderToPdf(html, options) {
    const { chromium, firefox, webkit } = require('playwright');
    const browser = await (this.browserType === 'firefox' ? firefox :
                           this.browserType === 'webkit' ? webkit : chromium).launch();
    const page = await browser.newPage();
    await page.setContent(html);
    await page.pdf({ path: options.path, format: options.format || 'A4' });
    await browser.close();
  }
}
```

#### Vivliostyle Renderer (`src/renderers/vivliostyleRenderer.js`)

```javascript
class VivliostyleRenderer extends IRendererDriver {
  constructor(options = {}) {
    super(options);
    this.name = 'vivliostyle';
    this.supportedFormats = ['pdf'];
    this.requiresPagedMedia = true;
  }

  canHandle(context) {
    // Only if template explicitly requests vivliostyle
    return context.template &&
           context.template.renderer &&
           context.template.renderer.engine === 'vivliostyle';
  }

  async renderToPdf(html, options) {
    const { build } = require('@vivliostyle/cli');
    // Write HTML to temp file
    const tempHtml = `/tmp/markprint-${Date.now()}.html`;
    await fs.promises.writeFile(tempHtml, html);

    await build({
      input: tempHtml,
      output: options.path,
      format: options.format || 'A4'
    });

    await fs.promises.unlink(tempHtml);
  }
}
```

#### Scribus Renderer (Stub for Phase 2)

```javascript
class ScribusRenderer extends IRendererDriver {
  constructor(options = {}) {
    super(options);
    this.name = 'scribus';
    this.supportedFormats = ['pdf', 'sla'];
  }

  canHandle(context) {
    // Only for SLA layouts with scribus hint
    return context.layout &&
           (context.layout.type === 'sla' || context.layout.rendererHint === 'scribus');
  }

  async renderToPdf(html, options) {
    // Phase 2: Create handoff artifacts, don't invoke Scribus
    const handoffDir = path.join(path.dirname(options.path), 'scribus-handoff');
    await fs.promises.mkdir(handoffDir, { recursive: true });

    const manifest = {
      slaSource: options.context.layout.source,
      contentHtml: 'content.html',
      metadata: options.frontMatter,
      targetPdf: path.basename(options.path),
      instructions: 'Open SLA in Scribus, import content.html, export to PDF'
    };

    await fs.promises.writeFile(
      path.join(handoffDir, 'content.html'),
      html,
      'utf-8'
    );

    await fs.promises.writeFile(
      path.join(handoffDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );

    debugLogger.log('renderer', 'Scribus handoff created', {
      directory: handoffDir,
      sla: manifest.slaSource
    });

    // Show notification
    const vscode = require('vscode');
    vscode.window.showInformationMessage(
      `Scribus handoff created at ${handoffDir}. See manifest.json for instructions.`
    );
  }
}
```

### 5.3 Renderer Selection Logic

**Priority Order**:

1. **Template `renderer.engine`**: Explicit preference in manifest
   ```json
   "renderer": { "engine": "vivliostyle" }
   ```

2. **Layout `rendererHint`**: Artifact type suggests renderer
   ```json
   "layout": { "type": "sla", "rendererHint": "scribus" }
   ```

3. **Capability matching**: First renderer that `canHandle()` the context

4. **Default fallback**: Chromium (always available)

**Logging**: Every render logs selected renderer, version, and reason for selection.

---

## 6. Library & Plugin Recommendations

Based on research in `.plan/ref/docs/renderer-options-survey.md`:

### 6.1 Keep (Phase 2)

- ✅ **puppeteer-core** v2.1.1
  - Current Chromium driver
  - Proven stability
  - Minimal changes to existing logic

### 6.2 Add Later (Phase 3+)

- 🟡 **@playwright/test** or **playwright-chromium**
  - Multi-engine support (Chromium/Firefox/WebKit)
  - Better API than Puppeteer
  - ~280-450MB footprint
  - **Recommendation**: Chromium-only variant to minimize size

- 🟡 **pagedjs** (Paged.js polyfill)
  - MIT license, pure JavaScript
  - Inject into HTML before rendering
  - Adds CSS Paged Media support to existing renderers
  - ~50KB overhead
  - **Recommendation**: Opt-in enhancement for complex layouts

### 6.3 Evaluate Carefully (Phase 4+)

- ⚠️ **@vivliostyle/cli** v8.12.1
  - **Pros**: Best-in-class CSS Paged Media, print quality
  - **Cons**: AGPL-3.0 license (viral), requires Ghostscript for PDF/X
  - **Recommendation**: Optional dependency, user-installed, legal review required

### 6.4 Defer / Monitor

- ❌ Pure-JS renderers (jsPDF, pdfkit, pdf-lib)
  - No mature HTML/CSS rendering capability
  - Would require building full layout engine
  - Monitor future developments

- ❌ External CLIs (PrinceXML, wkhtmltopdf, WeasyPrint)
  - Violate self-contained constraint
  - Not viable for VS Code extension distribution

---

## 7. Testing & CI Implications

### 7.1 Unit Tests (New)

**File**: `test/suite/renderer.test.js`

```javascript
const assert = require('assert');
const { RendererRegistry, IRendererDriver } = require('../../src/renderers/index');
const ChromiumRenderer = require('../../src/renderers/chromiumRenderer');

suite('Renderer Registry', function() {
  test('Registers and retrieves renderers', function() {
    const registry = new RendererRegistry();
    const chromium = new ChromiumRenderer();

    registry.register('chromium', chromium);

    assert.strictEqual(registry.get('chromium'), chromium);
    assert.strictEqual(registry.defaultRenderer, 'chromium');
  });

  test('Selects renderer based on template engine', function() {
    const registry = new RendererRegistry();
    const chromium = new ChromiumRenderer();
    registry.register('chromium', chromium);

    const context = {
      format: 'pdf',
      template: { renderer: { engine: 'chromium' } },
      layout: null
    };

    const selected = registry.select(context);
    assert.strictEqual(selected.name, 'chromium');
  });

  test('Falls back to default when no match', function() {
    const registry = new RendererRegistry();
    const chromium = new ChromiumRenderer();
    registry.register('chromium', chromium);

    const context = {
      format: 'pdf',
      template: { renderer: { engine: 'unknown' } },
      layout: null
    };

    const selected = registry.select(context);
    assert.strictEqual(selected.name, 'chromium');
  });
});

suite('Chromium Renderer', function() {
  test('canHandle supports all formats', function() {
    const renderer = new ChromiumRenderer();

    assert.strictEqual(renderer.canHandle({ format: 'pdf' }), true);
    assert.strictEqual(renderer.canHandle({ format: 'html' }), true);
    assert.strictEqual(renderer.canHandle({ format: 'png' }), true);
    assert.strictEqual(renderer.canHandle({ format: 'jpeg' }), true);
  });

  test('buildPdfOptions merges config and overrides', function() {
    // Mock vscode.workspace.getConfiguration
    // Assert options structure
  });
});
```

### 7.2 Integration Tests (Updated)

**File**: `test/suite/extension.test.js`

Update existing test to verify:
- Chromium renderer still exports PDF
- Renderer selection logged
- Template metadata passed to renderer

```javascript
test('SOP-200 Export via Chromium Renderer', async function() {
  this.timeout(60000);

  const sopFilePath = path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.md');
  var textDocument = await vscode.workspace.openTextDocument(sopFilePath);
  await vscode.window.showTextDocument(textDocument);

  // Execute export
  await vscode.commands.executeCommand('extension.markprint.pdf');

  // Verify PDF created
  const pdfPath = sopFilePath.replace('.md', '.pdf');
  assert.ok(fs.existsSync(pdfPath), 'PDF should be created');

  // Cleanup
  rimraf.sync(pdfPath);
});
```

### 7.3 WSL / Linux Test Environment

**Current blockers** (from `whats-next.md`):
- `.vscode-test/vscode-1.106.3/Code.exe` missing
- WSL2 missing Chromium dependencies (libnss3, libnspr4, etc.)

**Resolution steps**:
1. Run `npm run test:download-vscode` to restore test binary
2. Install WSL2 dependencies:
   ```bash
   sudo apt update && sudo apt install -y \
     libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
     libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
     libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
   ```

### 7.4 CI/CD Considerations

**GitHub Actions** (example):
```yaml
name: Test Phase 2 Renderer Abstraction

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Install Chromium dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 \
            libatk-bridge2.0-0 libcups2 libdrm2 libgbm1

      - name: Download VS Code test binary
        run: npm run test:download-vscode

      - name: Run tests
        run: xvfb-run -a npm test
```

---

## 8. Migration & Compatibility Plan

### 8.1 User Impact

**Zero breaking changes**:
- ✅ Existing commands work identically
- ✅ Configuration settings unchanged
- ✅ Templates/profiles backward compatible
- ✅ Default behavior (Chromium) preserved

**New capabilities** (opt-in):
- 🆕 Templates can specify `renderer.engine`
- 🆕 Layouts can provide `rendererHint`
- 🆕 Better logging of renderer selection
- 🆕 Foundation for future multi-engine support

### 8.2 Template Migration

**No changes required**, but templates can opt into new features:

```json
{
  "profile": {
    "id": "my-template"
  },
  "renderer": {
    "engine": "chromium",
    "fallback": ["chromium"]
  },
  "layout": {
    "type": "json",
    "source": "layout.json",
    "rendererHint": "chromium"
  }
}
```

### 8.3 Gradual Rollout

**Phase 2 (this proposal)**:
- Refactor without adding renderers
- All exports use Chromium (no change from user perspective)
- Renderer selection logged but only one option available

**Phase 3** (future):
- Add Playwright/Paged.js as opt-in
- Users install additional packages if desired
- Templates can request specific engines

**Phase 4+** (future):
- Vivliostyle, Scribus as advanced options
- Enterprise-grade renderers (PrinceXML API) as paid tier

---

## 9. Implementation Roadmap for Phase 2

### Step 1: Create Renderer Interface (1-2 days)

**Files to create**:
- `src/renderers/index.js` (IRendererDriver, RendererRegistry)
- `src/renderers/baseRenderer.js` (optional abstract base)

**Tests**:
- `test/suite/renderer.test.js` (registry, selection logic)

**Validation**:
- Unit tests pass
- Interface documented with JSDoc

---

### Step 2: Extract Chromium Renderer (2-3 days)

**Files to create**:
- `src/renderers/chromiumRenderer.js`

**Files to refactor**:
- `extension.js` (move Puppeteer logic out)

**Migration checklist**:
- [ ] `exportPdf()` → `ChromiumRenderer.renderToPdf()`
- [ ] Screenshot logic → `renderToPng()`, `renderToJpeg()`
- [ ] Config reading → `buildPdfOptions()`, `buildScreenshotOptions()`
- [ ] Error handling preserved
- [ ] Logging preserved

**Tests**:
- All existing integration tests pass
- Manual export of SOP-200 works

**Validation**:
- `npm test` green
- PDF/HTML/PNG/JPEG exports identical to Phase 1

---

### Step 3: Wire Renderer Selection (1-2 days)

**Files to modify**:
- `extension.js` (replace `renderWithChromium()` with `renderWithEngine()`)

**Logic**:
- Initialize `RendererRegistry` in `activate()`
- Register Chromium renderer
- Select renderer in `markprint()` based on template/layout
- Log selection decision

**Tests**:
- Verify Chromium selected for all current templates
- Verify logs show renderer name + version

**Validation**:
- All exports use Chromium (same behavior)
- Logs confirm "Selected renderer: chromium v2.1.1"

---

### Step 4: Honor profile.outputs (1 day)

**Files to modify**:
- `extension.js` (add `resolveOutputDirectory()`)

**Logic**:
- Check `template.profile.outputs.pdf.target_directory`
- Fall back to `markprint.outputDirectory`
- Fall back to source file directory
- Log precedence decision

**Tests**:
- Template with output directory specified
- Template without output directory
- Empty `markprint.outputDirectory` setting

**Validation**:
- Files export to correct directories
- Logs show directory resolution

---

### Step 5: Optional Enhancements (1-2 days)

**Files to create**:
- `src/parsers/markdownParser.js` (extract `convertMarkdownToHtml`)
- `src/templates/htmlGenerator.js` (extract `makeHtml`)

**Rationale**:
- Further decouple Markdown parsing from rendering
- Easier to test and maintain
- Cleaner `extension.js`

**Not required for Phase 2**, but recommended for maintainability.

---

### Step 6: Testing & Documentation (2-3 days)

**Testing**:
- [ ] Write unit tests for renderer registry
- [ ] Write unit tests for Chromium renderer
- [ ] Update integration tests to verify renderer selection
- [ ] Test in WSL2 environment (requires dependency install)
- [ ] Manual testing of all export formats

**Documentation**:
- [ ] Update `README.md` with renderer architecture
- [ ] Update `MIGRATION.md` with Phase 2 changes (none user-facing)
- [ ] Update `docs/pipeline-profile-manifest-spec.md` with `renderer.engine` schema
- [ ] Create `docs/renderers.md` explaining architecture
- [ ] Update `whats-next.md` with Phase 2 completion notes

**Validation**:
- All tests pass (`npm test`)
- Documentation reviewed
- Phase 2 acceptance criteria met

---

## 10. Risks, Trade-offs, and Open Issues

### 10.1 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Regression in Chromium path** | High | Extensive testing, side-by-side comparison with Phase 1 |
| **Performance overhead** | Medium | Renderer selection is fast (Map lookup); no measurable impact expected |
| **WSL test failures** | Medium | Document dependency install; automate in CI |
| **Interface too rigid** | Low | Base interface minimal; renderers can extend with custom methods |

### 10.2 Trade-offs

**Abstraction complexity vs flexibility**:
- ➕ Enables future multi-engine support
- ➕ Cleaner code separation
- ➖ More files, indirection
- ➖ Learning curve for contributors

**Decision**: Accept complexity for long-term flexibility.

**Immediate vs deferred renderer implementations**:
- ➕ Phase 2 focuses on abstraction only (lower risk)
- ➕ Real-world testing before adding more renderers
- ➖ No immediate user-facing value
- ➖ Can't validate interface with multiple implementations

**Decision**: Phase 2 abstraction-only is correct; validate with Playwright in Phase 3.

### 10.3 Open Issues for Resolution

1. **Renderer versioning**: Should we track renderer compatibility with template schema versions?
   - Proposal: Add `minRendererVersion` to template manifest (optional)

2. **Renderer fallback behavior**: If primary renderer fails, try fallback or fail immediately?
   - Proposal: Try fallbacks from `renderer.fallback` array, log each attempt

3. **Output directory conflicts**: Profile says `/foo`, setting says `/bar`. Precedence unclear to user?
   - Proposal: Log warning when conflict detected; document precedence rule clearly

4. **Renderer lifecycle**: Should renderers be singletons or instantiated per render?
   - Proposal: Instantiate once, reuse; add `dispose()` for cleanup

5. **Testing without VS Code**: Can we test renderers outside Extension Host?
   - Proposal: Make renderers pure Node modules (no vscode import inside renderers)

6. **Template validation**: Should schema enforce valid `renderer.engine` values?
   - Proposal: Add enum validation in Phase 3 when more renderers exist

7. **User education**: How do users know which renderer is best for their needs?
   - Proposal: Create decision matrix in docs; status bar could show active renderer

---

## 11. Success Criteria

Phase 2 complete when:

- ✅ **Chromium renderer extracted** into `src/renderers/chromiumRenderer.js`
- ✅ **Renderer interface defined** in `src/renderers/index.js`
- ✅ **Registry selects Chromium** for all existing templates
- ✅ **All export formats work** (PDF/HTML/PNG/JPEG) identically to Phase 1
- ✅ **Renderer selection logged** with name, version, reason
- ✅ **Profile outputs respected** (`profile.outputs.*.target_directory`)
- ✅ **Unit tests pass** (renderer registry, selection logic)
- ✅ **Integration tests pass** (SOP-200 export via Chromium)
- ✅ **Documentation updated** (README, pipeline spec, renderers.md)
- ✅ **No user-facing breaking changes**
- ✅ **VS Code test binary restored** (`npm test` runs successfully)

---

## 12. Unresolved Questions

- Should renderers declare required system dependencies in manifest?
- How to handle renderer plugins/extensions (e.g., custom Puppeteer plugins)?
- Performance benchmarking: measure registry overhead vs direct call?
- Error aggregation: collect failures from multiple fallback renderers?
- Renderer marketplace: allow third-party renderer contributions?
- Configuration UI: picker for available renderers in status bar?
- Version compatibility: fail if renderer version incompatible with template?

---

## Appendix A: File Change Summary

### New Files
```
src/renderers/
  index.js              # IRendererDriver, RendererRegistry (~150 lines)
  chromiumRenderer.js   # ChromiumRenderer implementation (~250 lines)
  baseRenderer.js       # Optional abstract base (~50 lines)

test/suite/
  renderer.test.js      # Unit tests for renderer system (~200 lines)

docs/
  renderers.md          # Renderer architecture documentation (~500 lines)
```

### Modified Files
```
extension.js
  - Extract renderWithChromium() logic → ChromiumRenderer
  - Add rendererRegistry initialization in activate()
  - Replace renderWithChromium() with renderWithEngine()
  - Add resolveOutputDirectory() for profile.outputs
  ~ Est. 200 lines changed, 100 lines removed, 150 lines added

package.json
  - No changes (Puppeteer remains dependency)

README.md
  - Add renderer architecture section (~50 lines)

docs/pipeline-profile-manifest-spec.md
  - Document renderer.engine and renderer.fallback schema (~30 lines)

MIGRATION.md
  - Add Phase 2 section (no user migration, internal changes only) (~20 lines)

whats-next.md
  - Update with Phase 2 completion status (~10 lines)
```

### Total Impact
- **~850 new lines** (renderers, tests, docs)
- **~200 modified lines** (extension.js refactor)
- **~100 removed lines** (consolidated into renderers)
- **Net: +950 lines**

---

## Appendix B: Reference Documentation

### Research Documents
- `.plan/ref/docs/renderer-options-survey.md` (renderer evaluation)
- `.plan/MarkPrint-impromptu-proposal.md` (original vision)
- `.claude/prompt/multi-engine-phase2.md` (Phase 2 requirements)
- `whats-next.md` (Phase 1 handoff notes)

### Codebase Structure
- `extension.js` (current monolithic implementation)
- `src/templateRegistry.js` (template loading)
- `src/layoutLoader.js` (layout artifact parsing)
- `src/schemaValidator.js` (metadata validation)
- `docs/pipeline-profile-manifest-spec.md` (profile schema)

### External References
- Puppeteer API: https://pptr.dev/api
- Playwright PDF: https://playwright.dev/docs/api/class-page#page-pdf
- Vivliostyle CLI: https://github.com/vivliostyle/vivliostyle-cli
- Paged.js: https://gitlab.coko.foundation/pagedjs/pagedjs

---

**End of Proposal**

This document is self-contained and ready for implementation. The next developer (or AI agent) can proceed directly from this specification without additional context gathering.
