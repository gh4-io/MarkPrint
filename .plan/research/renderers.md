# Renderer Architecture

**Version**: Phase 2 (Renderer Abstraction)
**Status**: Active
**Last Updated**: 2025-12-06

---

## Overview

MarkPrint uses a modular renderer architecture to support multiple rendering engines for converting Markdown to PDF, HTML, PNG, and JPEG formats. Phase 2 introduces the renderer abstraction layer while maintaining Chromium as the sole active renderer.

### Design Goals

1. **Extensibility**: Easy to add new rendering engines (Playwright, Vivliostyle, Scribus)
2. **Flexibility**: Template-driven renderer selection via `pipeline_profile`
3. **Compatibility**: Zero breaking changes to existing templates and workflows
4. **Testability**: Clear interfaces for unit and integration testing

---

## Architecture

### Component Hierarchy

```
src/renderers/
  ├── index.js              # IRendererDriver interface, RendererRegistry
  └── chromiumRenderer.js   # Puppeteer/Chromium implementation

extension.js
  └── activate()            # Initializes RendererRegistry, registers Chromium
      └── markprint()       # Selects renderer based on context
          └── renderWithEngine()  # Dispatches to selected renderer
```

### IRendererDriver Interface

All renderers must implement the `IRendererDriver` interface:

```javascript
class IRendererDriver {
  constructor(options = {}) {
    this.name = 'unknown';
    this.version = '0.0.0';
    this.supportedFormats = [];
  }

  canHandle(context) { return false; }
  async renderToPdf(html, options) { throw new Error('Not implemented'); }
  async renderToPng(html, options) { throw new Error('Not implemented'); }
  async renderToJpeg(html, options) { throw new Error('Not implemented'); }
  async renderToHtml(html, options) { /* default: write to file */ }
  async dispose() { /* cleanup */ }
}
```

### RendererRegistry

The registry manages available renderers and selects the appropriate one based on context:

**Selection Priority**:
1. **Template `renderer.engine`** - Explicit preference in manifest
2. **Layout `rendererHint`** - Artifact type suggests renderer
3. **Capability matching** - First renderer that `canHandle()` the context
4. **Default fallback** - Chromium (always available)

---

## Active Renderers

### Chromium Renderer

**Engine**: Puppeteer-core v2.1.1
**Supported Formats**: PDF, HTML, PNG, JPEG
**Default**: Yes

#### Features

- Full CSS support (Chromium rendering engine)
- PDF options: margins, headers, footers, page ranges, orientation
- Screenshot options: clip regions, quality, background transparency
- Template transformation: ISO date/time placeholders
- Configuration via `markprint.*` settings

#### Limitations

- WSL2 requires system dependencies (libnss3, libnspr4, etc.)
- No native CSS Paged Media support (consider Paged.js polyfill in future)
- Screenshot-based rendering (not native vector for images)

---

## Template-Driven Renderer Selection

Templates can specify renderer preferences in their `pipeline_profile` manifest:

### Example: Explicit Chromium

```json
{
  "profile": {
    "id": "my-template",
    "label": "My Template"
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

### Renderer Metadata

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `renderer.engine` | string | Primary renderer name | `"chromium"` |
| `renderer.fallback` | string[] | Fallback renderers in order | `["vivliostyle", "chromium"]` |
| `layout.rendererHint` | string | Suggested renderer based on layout type | `"scribus"` for SLA layouts |

**Note**: In Phase 2, only `chromium` is available. Other renderer names are logged but ignored.

---

## Renderer Lifecycle

### Initialization (extension activate)

```javascript
rendererRegistry = new RendererRegistry();
rendererRegistry.register('chromium', new ChromiumRenderer({
  extensionPath: context.extensionPath
}));
```

### Selection (per export)

```javascript
const renderContext = {
  format: 'pdf',
  template: activeTemplate,
  layout: activeTemplate.layoutDescriptor,
  document: mdfilename
};

const renderer = rendererRegistry.select(renderContext);
// Returns ChromiumRenderer instance
```

### Rendering

```javascript
await renderWithEngine({
  renderer,
  type: 'pdf',
  uri,
  text: documentText,
  filename,
  sourcePath: mdfilename,
  template: activeTemplate,
  context: renderContext
});
```

---

## Output Directory Resolution

Phase 2 introduces hierarchical output directory resolution:

**Precedence**:
1. **Profile `outputs.*.target_directory`** - Highest priority
2. **Setting `markprint.outputDirectory`** - User preference
3. **Source directory** - Fallback default

### Example

Template manifest:
```json
{
  "outputs": {
    "pdf": {
      "target_directory": "${workspaceRoot}/dist/reports"
    }
  }
}
```

Result: PDF exported to `/workspace/dist/reports/document.pdf` regardless of source location or settings.

---

## Future Renderers (Phase 3+)

### Planned

- **Playwright** (Chromium/Firefox/WebKit): Multi-browser rendering
- **Vivliostyle** (CLI): Professional print quality, CSS Paged Media
- **Paged.js** (polyfill): Inject into existing renderers for paged media support
- **Scribus** (handoff): Generate SLA import manifests for manual rendering

### Not Planned

- Pure-JS renderers (jsPDF, pdfkit): Insufficient HTML/CSS support
- External CLIs (WeasyPrint, wkhtmltopdf): Violate self-contained constraint

---

## Adding a New Renderer

### Step 1: Implement IRendererDriver

Create `src/renderers/yourRenderer.js`:

```javascript
const { IRendererDriver } = require('./index');

class YourRenderer extends IRendererDriver {
  constructor(options = {}) {
    super(options);
    this.name = 'yourrenderer';
    this.version = '1.0.0';
    this.supportedFormats = ['pdf', 'html'];
  }

  canHandle(context) {
    // Only handle if explicitly requested
    return context.template &&
           context.template.renderer &&
           context.template.renderer.engine === 'yourrenderer';
  }

  async renderToPdf(html, options) {
    // Your rendering logic here
  }
}

module.exports = YourRenderer;
```

### Step 2: Register in extension.js

```javascript
const YourRenderer = require('./src/renderers/yourRenderer');

// In activate():
rendererRegistry.register('yourrenderer', new YourRenderer({
  extensionPath: context.extensionPath
}));
```

### Step 3: Add Tests

```javascript
// test/suite/renderer.test.js
suite('YourRenderer', function() {
  test('Handles PDF rendering', async function() {
    const renderer = new YourRenderer();
    // Test implementation
  });
});
```

### Step 4: Update Documentation

- Add renderer to this document
- Update `pipeline-profile-manifest-spec.md` with new engine option
- Add example template using the renderer

---

## Debugging

### Enable Debug Logging

Set `markprint.debug: true` in settings to see detailed renderer logs:

```json
{
  "markprint.debug": true
}
```

### Logged Events

- Renderer registry initialization
- Renderer selection per export
- Output directory resolution precedence
- Render pipeline start/complete
- Errors and fallbacks

### Debug Console Output

```
[renderer] Renderer registry initialized
  available: ["chromium"]
  default: "chromium"

[renderer] Selected renderer
  name: "chromium"
  version: "2.1.1"
  formats: ["pdf"]
  template: "dts-master-report"
  layoutHint: "scribus"

[renderer] Using profile output directory
  directory: "${workspaceRoot}/dist"
  precedence: "profile"

[renderer] Render pipeline complete
  renderer: "chromium"
  output: "/workspace/dist/document.pdf"
```

---

## Testing

### Unit Tests

Location: `test/suite/renderer.test.js`

Coverage:
- IRendererDriver interface compliance
- RendererRegistry registration and retrieval
- Selection logic with various contexts
- ChromiumRenderer methods and configuration

Run: `npm test` (requires VS Code test binary)

### Integration Tests

Location: `test/suite/extension.test.js`

Verifies:
- End-to-end Chromium export (SOP-200 test document)
- Renderer selection logged correctly
- Template metadata passed to renderer
- All output formats work (PDF, HTML, PNG, JPEG)

---

## Migration Notes

### From Phase 1 to Phase 2

**No user action required**. Phase 2 is a pure refactoring:

- Same commands (`extension.markprint.pdf`, etc.)
- Same configuration (`markprint.*` settings)
- Same templates (existing manifests work unchanged)
- Same default behavior (Chromium rendering)

**What changed internally**:
- Chromium logic extracted to `src/renderers/chromiumRenderer.js`
- Renderer selection via `RendererRegistry`
- Output directory resolution honors `profile.outputs`
- Better logging of renderer decisions

### Deprecated Patterns

None. All Phase 1 patterns remain valid.

---

## Troubleshooting

### "No suitable renderer available"

**Cause**: RendererRegistry empty or no renderer can handle format
**Fix**: Verify renderer registered in `extension.js` activate()

### "renderToPdf not implemented"

**Cause**: Using base `IRendererDriver` instead of concrete renderer
**Fix**: Ensure renderer registered correctly and selection logic works

### Chromium library errors (WSL2)

**Cause**: Missing system dependencies
**Fix**:
```bash
sudo apt update && sudo apt install -y \
  libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
```

### Template renderer hint ignored

**Expected**: Phase 2 only has Chromium. Non-chromium hints logged as warnings.
**Future**: Phase 3 will add Playwright, Vivliostyle, etc.

---

## References

- [Pipeline Profile Manifest Spec](pipeline-profile-manifest-spec.md)
- [Phase 2 Proposal](.plan/PHASE2_Renderer_Abstraction_Proposal.md)
- [Puppeteer API](https://pptr.dev/api)
- [Playwright Documentation](https://playwright.dev)
- [Vivliostyle CLI](https://github.com/vivliostyle/vivliostyle-cli)

---

**Phase 2 Complete**: Renderer abstraction shipped 2025-12-06
