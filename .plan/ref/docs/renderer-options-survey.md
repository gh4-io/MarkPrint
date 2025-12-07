# Renderer Options Survey for MarkPrint Phase 2

**Date**: 2025-12-06
**Purpose**: Evaluate renderer engines for multi-engine support in MarkPrint
**Scope**: Node/JS-compatible renderers for HTML/CSS/Markdown to PDF/HTML conversion

---

## Executive Summary

MarkPrint Phase 2 requires abstracting the renderer layer to support multiple engines beyond the current Puppeteer/Chromium implementation. This survey evaluates viable options based on:

- **Self-contained constraint**: Must run as Node/JS dependencies (no external binaries/CLIs required)
- **Print fidelity**: Support for CSS paged media, headers/footers, margins
- **Footprint**: Installation size and runtime dependencies
- **Maturity**: Active maintenance, documentation quality, community support
- **Compatibility**: Alignment with existing template/layout system

**Recommendation**: Retain Puppeteer as default; add Playwright for multi-engine flexibility; evaluate Vivliostyle CLI for CSS paged media; defer pure-JS solutions until proven mature.

---

## Current Baseline: Puppeteer + Chromium

### Overview
- **Package**: `puppeteer-core` v2.1.1 (as of package.json)
- **Engine**: Bundled Chromium headless browser
- **Integration**: Deeply embedded in `extension.js` (lines 313-329, 600-700+)

### Current Implementation
```javascript
async function renderWithChromium({ type, uri, text, filename, sourcePath, template }) {
  const grayMatter = require('gray-matter');
  const matterParts = grayMatter(text);
  const content = convertMarkdownToHtml(sourcePath, type, text, { matterParts });
  const html = makeHtml(content, uri, { template, frontMatter: matterParts.data });
  await exportPdf(html, filename, type, uri);
}
```

### Strengths
- ✅ **Proven stability**: Production-tested across MarkPrint user base
- ✅ **Full CSS support**: Modern flexbox, grid, transforms
- ✅ **Screenshot capability**: PNG/JPEG generation via `page.screenshot()`
- ✅ **Familiar API**: Well-documented, large community
- ✅ **Existing integration**: No migration required for default path

### Weaknesses
- ❌ **Large footprint**: ~170-300MB download (Chromium binary)
- ❌ **WSL dependencies**: Requires `libnss3`, `libatk`, `libgbm`, etc. (see whats-next.md)
- ❌ **Limited paged media**: Basic `@page` support, lacks advanced features (footnotes, floats, running headers)
- ❌ **Single engine**: No fallback if Chromium fails

### Verdict
**Keep as default renderer**. Refactor into modular driver (`src/renderers/chromiumRenderer.js`) but maintain full functionality.

---

## Option 1: Playwright

### Overview
- **Package**: `playwright` or `@playwright/test`
- **Engines**: Chromium, Firefox, WebKit (all three browsers)
- **License**: Apache 2.0
- **Maturity**: Microsoft-backed, active development (2025)

### API Example
```javascript
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('file:///path/to/output.html');
await page.pdf({
  path: 'output.pdf',
  format: 'A4',
  printBackground: true
});
await browser.close();
```

### Strengths
- ✅ **Multi-engine**: Can test rendering across Chromium/Firefox/WebKit
- ✅ **Modern API**: Better DevTools integration than Puppeteer
- ✅ **Active maintenance**: Frequent updates, excellent docs
- ✅ **Similar migration**: Nearly 1:1 API mapping from Puppeteer
- ✅ **Official npm distribution**: No separate browser install required

### Weaknesses
- ❌ **Larger footprint**: ~400-500MB (three browsers vs one)
- ❌ **Browser-based limitations**: Same CSS paged media gaps as Puppeteer
- ❌ **Redundancy**: Chromium engine overlaps with existing Puppeteer
- ❌ **Still headless browser**: Doesn't solve advanced pagination needs

### Integration Strategy
- Create `src/renderers/playwrightRenderer.js` alongside Chromium driver
- Use Chromium engine by default (smallest subset)
- Allow template `rendererHint: "webkit"` to test Apple rendering
- Profile flag: `renderer.engine: "playwright"` with optional `renderer.browser: "chromium|firefox|webkit"`

### Footprint Analysis
- **playwright**: ~450MB (all three browsers)
- **playwright-chromium**: ~280MB (Chromium only)
- **Comparison**: Puppeteer-core + Chromium ~250MB

### Verdict
**Strong candidate for Phase 3**. Provides multi-engine testing without architectural changes. Use Chromium-only variant to minimize footprint.

---

## Option 2: Vivliostyle CLI

### Overview
- **Package**: `@vivliostyle/cli` v8.12.1 (2025)
- **Engine**: Chromium-based with CSS Paged Media extensions
- **License**: AGPL-3.0
- **Focus**: Book/print production with advanced pagination

### Features
- **CSS Paged Media**: Full support for `@page`, running headers, footnotes, floats
- **Print standards**: PDF/X-1a output (via Ghostscript + PRESS-READY)
- **VFM support**: Vivliostyle-flavored Markdown
- **Theme system**: Pre-built typographic themes
- **EPUB input**: Can convert EPUB to PDF

### API Example
```javascript
const { build } = require('@vivliostyle/cli');
await build({
  input: 'manuscript.html',
  output: 'output.pdf',
  theme: '@vivliostyle/theme-techbook',
  format: 'A4',
  crop: true
});
```

### Strengths
- ✅ **Advanced pagination**: Solves CSS paged media gaps
- ✅ **Print quality**: Designed for book/manual production
- ✅ **Node-based**: Fits self-contained constraint
- ✅ **Theme ecosystem**: Could replace custom CSS management
- ✅ **Active project**: Japanese/international community, regular releases

### Weaknesses
- ❌ **Still Chromium**: Underlying engine same as Puppeteer (no diversification)
- ❌ **AGPL license**: Viral license may complicate commercial use
- ❌ **External dependencies**: PDF/X-1a requires Ghostscript (breaks self-contained goal)
- ❌ **Configuration overhead**: Requires `vivliostyle.config.js` or CLI invocation
- ❌ **Opinionated**: Optimized for books, may conflict with SOP/technical doc workflows

### Integration Strategy
- Create `src/renderers/vivliostyleRenderer.js` wrapper
- Map MarkPrint template metadata to Vivliostyle config
- Use for templates with `rendererHint: "vivliostyle"` or `requiresPagedMedia: true`
- Graceful fallback to Chromium if Vivliostyle fails

### License Considerations
AGPL-3.0 requires:
- Source code disclosure if distributed
- Same license for derivative works
- VS Code extensions distributed via Marketplace may trigger AGPL obligations

**Mitigation**: Make Vivliostyle optional dependency; users install separately if needed.

### Verdict
**Promising for Phase 4+**. Best-in-class paged media support, but AGPL + Ghostscript dependencies require careful evaluation. Consider as opt-in enhancement rather than core renderer.

---

## Option 3: Paged.js Polyfill + Headless Browser

### Overview
- **Package**: `pagedjs` (polyfill library)
- **Engine**: Client-side JS polyfill for CSS Paged Media
- **License**: MIT
- **Approach**: Pre-process HTML with Paged.js, then render via Puppeteer/Playwright

### Workflow
```javascript
// 1. Inject Paged.js polyfill into HTML
const pagedjs = fs.readFileSync('node_modules/pagedjs/dist/paged.polyfill.js', 'utf-8');
const htmlWithPaged = `
  <script>${pagedjs}</script>
  <script>
    window.PagedConfig = { auto: true };
  </script>
  ${originalHtml}
`;

// 2. Render with existing Chromium/Playwright
await page.setContent(htmlWithPaged);
await page.waitForSelector('.pagedjs_pages'); // Wait for polyfill
await page.pdf({ path: 'output.pdf' });
```

### Strengths
- ✅ **Pure JavaScript**: No binary dependencies
- ✅ **MIT license**: Permissive, no distribution concerns
- ✅ **CSS Paged Media**: Implements `@page`, margins, breaks, floats
- ✅ **Incremental adoption**: Works with existing Chromium renderer
- ✅ **Community**: Active development, used in publishing industry

### Weaknesses
- ❌ **Still requires browser**: Depends on Puppeteer/Playwright for PDF output
- ❌ **Client-side processing**: Slower than native pagination
- ❌ **Async complexity**: Must wait for polyfill to finish chunking pages
- ❌ **Not a standalone renderer**: Only enhances existing engines

### Integration Strategy
- Enhance `renderWithChromium()` to optionally inject Paged.js
- Template flag: `injectPagedJs: true` or `pagedMediaPolyfill: true`
- Keep as opt-in for complex layouts (SOP documents with floats, footnotes)
- No separate renderer module needed—integrate into existing path

### Verdict
**Best hybrid approach**. Adds paged media capabilities without changing renderer architecture. Lower risk than Vivliostyle, MIT-licensed, incremental adoption.

**Recommendation**: Implement in Phase 3 as enhancement layer.

---

## Option 4: WeasyPrint-like Pure JS (Hypothetical)

### Concept
Pure JavaScript PDF generator (HTML → layout engine → PDF commands) without browser dependency.

### Known Projects
- **jsPDF**: Low-level PDF generation (no HTML parsing)
- **pdfkit**: Document generation API (no CSS layout)
- **pdf-lib**: PDF manipulation (not rendering)
- **parse5 + custom layout**: Would require building full layout engine

### Reality Check
No mature, feature-complete pure-JS renderer exists comparable to WeasyPrint. Building one would require:
- HTML/CSS parser (parse5, cheerio)
- Layout engine (box model, flexbox, grid, positioning)
- Font rendering and shaping
- Image decoding and embedding
- Pagination logic
- PDF generation

**Estimated effort**: 1000+ developer hours for MVP

### Verdict
**Not viable for Phase 2-4**. Monitor projects like `react-pdf` (React components → PDF) but expect browser dependency to remain necessary for general HTML/CSS rendering.

---

## Option 5: External CLI Invocation (Ruled Out)

### Examples
- **PrinceXML**: Commercial, excellent output ($495-$3800/license)
- **wkhtmltopdf**: WebKit-based, deprecated
- **WeasyPrint**: Python-based, requires external install
- **Scribus CLI**: Desktop publishing, complex setup

### Why Excluded
Violates MarkPrint's **self-contained constraint**:
> "No external Python/Pandoc/WeasyPrint installs; everything must ship as Node/JS dependencies"

While these produce superior output, requiring users to install separate tools conflicts with VS Code extension expectations.

**Exception**: Phase 2 may implement Scribus handoff (write exchange files + instructions) but not require Scribus installation for core functionality.

---

## Comparative Matrix

| Renderer | Footprint | Paged Media | License | Self-Contained | Maturity | Recommendation |
|----------|-----------|-------------|---------|----------------|----------|----------------|
| **Puppeteer (current)** | 250MB | Basic | Apache 2.0 | ✅ Yes | ⭐⭐⭐⭐⭐ Proven | ✅ Keep default |
| **Playwright** | 280-450MB | Basic | Apache 2.0 | ✅ Yes | ⭐⭐⭐⭐⭐ Active | ✅ Phase 3 multi-engine |
| **Vivliostyle CLI** | 300MB+ | Advanced | AGPL-3.0 | ⚠️ Partial (needs Ghostscript) | ⭐⭐⭐⭐ Specialized | ⚠️ Opt-in Phase 4 |
| **Paged.js + browser** | +50KB | Advanced | MIT | ✅ Yes (with browser) | ⭐⭐⭐⭐ Good | ✅ Phase 3 enhancement |
| **Pure JS renderer** | Minimal | N/A | N/A | ✅ Yes | ❌ Non-existent | ❌ Not viable |
| **External CLIs** | Varies | Excellent | Varies | ❌ No | ⭐⭐⭐⭐⭐ Enterprise | ❌ Violates constraints |

---

## Recommendations by Phase

### Phase 2 (Immediate)
1. **Refactor Chromium into modular driver** (`src/renderers/chromiumRenderer.js`)
2. **Create renderer interface** (`src/renderers/index.js`)
3. **Wire renderer selection** based on `template.renderer.engine` and `layout.rendererHint`
4. **Log renderer hints** for future expansion
5. **No new renderer dependencies** yet—focus on abstraction

### Phase 3 (Multi-Engine)
1. **Add Playwright renderer** (Chromium-only variant to minimize footprint)
2. **Integrate Paged.js polyfill** as opt-in enhancement for existing renderers
3. **Document multi-engine selection** in templates
4. **Add comparison fixtures** to test output across engines

### Phase 4 (Advanced Pagination)
1. **Evaluate Vivliostyle CLI** with legal review of AGPL implications
2. **Implement as optional dependency** (user-installed, not bundled)
3. **Create Vivliostyle renderer stub** that checks for installation
4. **Document manual Vivliostyle setup** for advanced users

### Future R&D
- Monitor pure-JS renderer projects
- Evaluate commercial renderers (PrinceXML API, DocRaptor) for enterprise tier
- Research Scribus scripting API for `.sla` playback

---

## Technical Constraints Summary

All recommended renderers must:
- ✅ Install via npm (no system binaries)
- ✅ Run in Node.js 12+ (current VS Code extension engine)
- ✅ Support headless execution (no GUI required)
- ✅ Handle file:// URLs or raw HTML strings
- ✅ Produce PDF/PNG/JPEG output
- ✅ Work in WSL2/Linux environments (current user base)

Optional capabilities:
- 🟡 Multi-format output (HTML, EPUB, etc.)
- 🟡 CSS Paged Media (@page, @footnote, running headers)
- 🟡 PDF/A, PDF/X standards
- 🟡 Scriptable theming/layouts

---

## Conclusion

**Phase 2 focus**: Abstract renderer interface without adding new engines. Current Puppeteer path becomes one driver among future options.

**Recommended progression**:
1. **Phase 2**: Chromium driver refactor + interface
2. **Phase 3**: Playwright (multi-engine) + Paged.js (paged media enhancement)
3. **Phase 4**: Vivliostyle CLI (opt-in for advanced print requirements)

This staged approach:
- Maintains stability (Chromium remains default)
- Adds flexibility (Playwright for cross-browser testing)
- Enables print quality (Paged.js/Vivliostyle for advanced layouts)
- Respects constraints (all Node/JS-based, incrementally adoptable)
