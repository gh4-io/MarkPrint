# Codebase Analysis: vscode-markdown-pdf

## Executive Summary

vscode-markdown-pdf is a VS Code extension that converts Markdown documents to multiple output formats (PDF, HTML, PNG, JPEG). The extension leverages puppeteer-core with Chromium for rendering, markdown-it for parsing, and provides comprehensive support for PlantUML diagrams, Mermaid charts, syntax highlighting, and emoji rendering. The architecture follows a straightforward pipeline pattern: Markdown → HTML → Chromium rendering → Output format. The codebase is relatively compact (~900 lines core logic) with a single-file extension pattern, making it maintainable and easy to understand.

The project demonstrates mature VS Code extension development practices with proper activation events, command registration, configuration management, and multi-root workspace support. Key differentiators include support for auto-conversion on save, flexible output directory configuration, custom styling capabilities, and extensive PDF customization options (headers, footers, margins, page formats).

## Project Structure

```
vscode-markdown-pdf/
├── .github/
│   └── FUNDING.yml                    # GitHub sponsorship config
├── .vscode/
│   ├── launch.json                    # VS Code debug configuration
│   └── settings.json                  # Workspace settings
├── data/
│   └── emoji.json                     # Emoji definitions for rendering
├── images/                            # Extension icons and documentation assets
│   ├── icon.png                       # Extension marketplace icon
│   ├── PlantUML.png                   # PlantUML feature screenshot
│   ├── mermaid.png                    # Mermaid feature screenshot
│   ├── settings.gif                   # Settings UI demonstration
│   ├── usage1.gif                     # Usage example 1
│   └── usage2.gif                     # Usage example 2
├── sample/                            # Sample output files
│   ├── README.html
│   ├── README.jpeg
│   ├── README.pdf
│   └── README.png
├── src/
│   └── compile.js                     # Pre-publish cleanup script
├── styles/
│   ├── markdown-pdf.css               # Default extension stylesheet
│   ├── markdown.css                   # Base markdown styles
│   └── tomorrow.css                   # Default syntax highlight theme
├── template/
│   └── template.html                  # Mustache template for HTML generation
├── test/
│   ├── runTest.js                     # Test runner entry point
│   └── suite/
│       ├── extension.test.js          # Extension test suite
│       ├── index.js                   # Mocha test configuration
│       └── mermaid.md                 # Test markdown file
├── extension.js                       # Main extension entry point (900 lines)
├── package.json                       # Extension manifest and configuration
├── jsconfig.json                      # JavaScript/TypeScript config
├── .vscodeignore                      # Files excluded from package
├── .gitignore                         # Git exclusions
├── CHANGELOG.md                       # Version history
├── LICENSE.txt                        # MIT license
├── README.md                          # English documentation
└── README.ja.md                       # Japanese documentation
```

## Technology Stack

### Core Dependencies
- **vscode**: `^1.0.0` - VS Code Extension API
- **puppeteer-core**: `^2.1.1` - Headless Chromium for rendering (no bundled browser)
- **markdown-it**: `^10.0.0` - Markdown parser with plugin architecture
- **cheerio**: `^0.20.0` - Server-side jQuery for HTML manipulation
- **mustache**: `^4.0.1` - Template engine for HTML generation

### Markdown Enhancement Libraries
- **markdown-it-checkbox**: `^1.1.0` - GitHub-style task lists
- **markdown-it-container**: `^2.0.0` - Custom container blocks (`::: warning`)
- **markdown-it-emoji**: `^1.4.0` - Emoji shortcode support
- **markdown-it-include**: `^1.1.0` - File inclusion syntax
- **markdown-it-named-headers**: `0.0.4` - Header ID generation for TOC
- **markdown-it-plantuml**: `^1.4.1` - PlantUML diagram rendering

### Syntax Highlighting & Rendering
- **highlight.js**: `^9.18.1` - Code syntax highlighting (88 themes available)
- **emoji-images**: `^0.1.1` - Emoji PNG assets

### Utilities
- **gray-matter**: `^4.0.2` - Front matter parsing for per-document config
- **mkdirp**: `^1.0.3` - Recursive directory creation
- **rimraf**: `^3.0.2` - Cross-platform file/directory deletion

### Development Tools
- **glob**: `^7.1.6` - File pattern matching
- **mocha**: `^7.1.1` - Test framework
- **vscode-test**: `^1.3.0` - VS Code extension testing utilities
- **removeNPMAbsolutePaths**: `^2.0.0` - Package size optimization

## Architecture Overview

### High-Level Flow
```
User Action (Command/Save)
         ↓
    extension.js:activate()
         ↓
    markdownPdf(type)
         ↓
┌────────────────────────────┐
│  1. Read Markdown File     │ ← editor.document.getText()
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  2. Convert MD → HTML      │ ← convertMarkdownToHtml()
│     • Parse with markdown-it
│     • Apply plugins         │
│     • Transform image paths │
│     • Inject emoji data     │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  3. Build Full HTML        │ ← makeHtml()
│     • Load stylesheets     │
│     • Apply Mustache       │
│     • Inject Mermaid JS    │
└────────────────────────────┘
         ↓
┌────────────────────────────┐
│  4. Export via Puppeteer   │ ← exportPdf()
│     • Launch Chromium      │
│     • Render HTML          │
│     • Generate output      │
└────────────────────────────┘
         ↓
    Output: PDF/HTML/PNG/JPEG
```

### Key Architectural Patterns

1. **Single-File Extension Pattern**: All logic in `extension.js` - simple, no over-engineering
2. **Pipeline Architecture**: Linear transformation flow (MD → HTML → Render → Output)
3. **Plugin-Based Markdown Processing**: markdown-it with modular plugins for extensibility
4. **Template-Based HTML Generation**: Mustache templates for clean separation of structure
5. **Configuration Cascade**: VS Code settings → Front matter → Defaults
6. **Workspace-Aware Paths**: Multi-root workspace support with relative path resolution

## Major Components

### Component 1: Extension Lifecycle (extension.js:9-35)

**Purpose**: VS Code extension initialization and command registration

**Key Files**:
- `extension.js:9-35` - Activation/deactivation handlers

**Responsibilities**:
- Initialize Chromium installation check
- Register 6 commands (settings, pdf, html, png, jpeg, all)
- Setup auto-convert-on-save listener if enabled
- Manage extension subscriptions

**Integration**:
- Hooks into VS Code Extension API via `activate()` export
- Registers commands with `vscode.commands.registerCommand()`
- Subscribes to `onDidSaveTextDocument` for auto-conversion

**Notable Pattern**: Lazy Chromium installation - downloads on first use, not at install time

---

### Component 2: Markdown Processing Engine (extension.js:150-296)

**Purpose**: Convert Markdown to HTML with comprehensive feature support

**Key Files**:
- `extension.js:150-296` - `convertMarkdownToHtml()` function
- `data/emoji.json` - Emoji definitions

**Responsibilities**:
- Parse front matter (gray-matter) for per-document config overrides
- Configure markdown-it with syntax highlighting via highlight.js
- Load and apply 6 markdown-it plugins (checkbox, emoji, container, plantuml, named-headers, include)
- Transform image paths to file:// URIs for Chromium
- Convert HTML `<img>` tags in markdown HTML blocks
- Render emoji as base64-encoded PNG data URIs

**Integration**:
- Called by `markdownPdf()` with filename, type, and text
- Returns rendered HTML string for `makeHtml()` to wrap
- Integrates with PlantUML server (configurable URL)
- Uses Cheerio for DOM manipulation of embedded HTML

**Notable Patterns**:
- Custom renderer overrides for markdown-it (image, html_block, emoji)
- Mermaid detection via language hint regex `/\bmermaid\b/i`
- Front matter config overrides workspace settings

---

### Component 3: HTML Template Engine (extension.js:320-350)

**Purpose**: Assemble complete HTML document from markdown content

**Key Files**:
- `extension.js:320-350` - `makeHtml()` function
- `template/template.html` - Mustache template
- `styles/*.css` - Stylesheets

**Responsibilities**:
- Load and concatenate all applicable stylesheets via `readStyles()`
- Inject Mermaid JavaScript library
- Compile Mustache template with title, styles, content, mermaid
- Generate complete standalone HTML document

**Integration**:
- Receives HTML fragment from `convertMarkdownToHtml()`
- Calls `readStyles()` to build CSS cascade
- Passes result to `exportPdf()` for rendering

**Notable Pattern**: Stylesheet cascade priority:
1. VSCode markdown styles (if includeDefaultStyles)
2. `markdown.styles` workspace setting
3. highlight.js theme
4. Extension default styles
5. User custom styles (`markdown-pdf.styles`)

---

### Component 4: Stylesheet Manager (extension.js:683-786)

**Purpose**: Build cascading stylesheet hierarchy from multiple sources

**Key Files**:
- `extension.js:683-786` - `readStyles()`, `fixHref()` functions
- `styles/markdown.css` - Base markdown styles
- `styles/markdown-pdf.css` - Extension-specific styles
- `styles/tomorrow.css` - Default highlight.js theme

**Responsibilities**:
- Load 5 layers of stylesheets in priority order
- Resolve relative, absolute, home directory (~), and HTTP(S) paths
- Support multi-root workspaces with workspace-relative paths
- Handle `stylesRelativePathFile` option for file-relative paths
- Inline local CSS or link external stylesheets

**Integration**:
- Called by `makeHtml()` during HTML assembly
- Uses `fixHref()` for path normalization
- Reads from `node_modules/highlight.js/styles/*.css` for syntax themes

**Notable Pattern**: Path resolution priority (workspace → file-relative based on config)

---

### Component 5: Puppeteer Rendering Engine (extension.js:367-507)

**Purpose**: Render HTML to PDF/PNG/JPEG using headless Chromium

**Key Files**:
- `extension.js:367-507` - `exportPdf()` function
- `extension.js:788-808` - `checkPuppeteerBinary()`
- `extension.js:814-864` - `installChromium()`

**Responsibilities**:
- Verify Chromium binary availability
- Launch puppeteer-core with custom executable path or bundled Chromium
- Create temporary HTML file for rendering
- Navigate to HTML with `waitUntil: 'networkidle0'` for complete loading
- Generate PDF with full options (margins, headers/footers, orientation, page size)
- Generate PNG/JPEG screenshots with optional clipping
- Clean up temporary files (unless debug mode)
- Show progress notifications

**Integration**:
- Receives complete HTML from `makeHtml()`
- Uses VSCode Progress API for user feedback
- Reads extensive configuration from `markdown-pdf.*` settings
- Handles both user-provided Chrome path and auto-downloaded Chromium

**Notable Patterns**:
- Timeout set to `0` (unlimited) to handle large documents
- Custom `transformTemplate()` for ISO date placeholders
- Quality option only applies to JPEG (ignored for PNG)
- Full-page screenshots unless clip region specified

---

### Component 6: Path & File Utilities (extension.js:530-668)

**Purpose**: Cross-platform file operations and path resolution

**Key Files**:
- `extension.js:530-668` - Utility functions

**Responsibilities**:
- Check file/directory existence
- Convert relative/home/absolute paths consistently
- Transform image src attributes to file:// URIs
- Handle output directory resolution with workspace awareness
- Create output directories recursively
- Delete temporary files

**Integration**:
- Used throughout extension for all file operations
- `convertImgPath()` called from markdown-it renderers
- `getOutputDir()` supports 3 path resolution modes:
  - Home directory relative (`~/output`)
  - Absolute (`/path/to/output`)
  - Workspace or file relative (configurable)

**Notable Patterns**:
- `file://` URI normalization (adds correct slashes for Windows/Unix)
- Hash character encoding (`#` → `%23`) to prevent anchor links

---

### Component 7: Configuration Manager (Distributed)

**Purpose**: Multi-layer configuration with cascading priorities

**Key Files**:
- `package.json:130-480` - Configuration schema with 40+ options
- `extension.js` - Configuration access via `vscode.workspace.getConfiguration()`

**Responsibilities**:
- Define configuration schema in package.json
- Provide defaults, validation, and descriptions
- Support workspace, folder, and file-scoped settings
- Allow front matter overrides (gray-matter)

**Configuration Layers** (highest to lowest priority):
1. Front matter in markdown file (`---` delimited)
2. Workspace/folder settings
3. User settings
4. Extension defaults

**Key Configuration Categories**:
- **Save Options**: output formats, auto-convert, output directory
- **Style Options**: custom CSS, default styles, syntax highlighting
- **PDF Options**: margins, headers/footers, orientation, page size (resource-scoped)
- **Image Options**: quality, clipping, background (PNG/JPEG)
- **Diagram Options**: PlantUML/Mermaid server URLs
- **Feature Toggles**: emoji, markdown-it-include, line breaks

**Notable Pattern**: Resource-scoped settings (PDF options) allow per-file customization

---

### Component 8: Chromium Installer (extension.js:814-864)

**Purpose**: Auto-download bundled Chromium on first use

**Key Files**:
- `extension.js:814-864` - `installChromium()` function
- `extension.js:875-881` - `setProxy()` for corporate networks

**Responsibilities**:
- Download Chromium revision matching puppeteer-core version
- Show progress in status bar (percentage)
- Support HTTP proxy configuration from VS Code settings
- Clean up old Chromium revisions after successful install
- Handle download failures with actionable error messages

**Integration**:
- Called from `init()` if binary not found
- Uses `puppeteer.createBrowserFetcher()` API
- Respects `http.proxy` setting from VS Code
- Sets `INSTALL_CHECK` flag on success

**Notable Pattern**: Deferred installation reduces initial extension size, but requires network on first use

---

### Component 9: Build & Package Optimizer (src/compile.js)

**Purpose**: Reduce extension package size before publishing

**Key Files**:
- `src/compile.js` - Pre-publish script
- `package.json:483` - npm script `vscode:prepublish`

**Responsibilities**:
- Delete unnecessary files from node_modules (emoji-images JSON, Chromium binaries)
- Remove absolute paths from package.json files in node_modules (security/portability)
- Run before `vsce package` or `vsce publish`

**Integration**:
- Triggered automatically by npm lifecycle hook
- Uses rimraf for deletions
- Uses removeNPMAbsolutePaths to sanitize package metadata

**Notable Pattern**: Removes `.local-chromium` to force users to download appropriate binary for their platform

---

### Component 10: Test Suite (test/)

**Purpose**: Automated testing infrastructure

**Key Files**:
- `test/runTest.js` - VS Code test runner
- `test/suite/index.js` - Mocha configuration
- `test/suite/extension.test.js` - Extension tests
- `test/suite/mermaid.md` - Test fixture

**Responsibilities**:
- Setup VS Code extension test environment
- Configure Mocha test runner
- Test extension activation and commands

**Integration**:
- Run via `npm test`
- Uses `@vscode/test-electron` for VS Code API simulation

**Notable Pattern**: Minimal test coverage - opportunity for expansion

## Data Flow

### Primary Conversion Flow

```
1. USER ACTION
   - Command Palette: "Markdown PDF: Export (pdf)"
   - Context Menu: Right-click → "Markdown PDF: Export (pdf)"
   - Auto-save: Save markdown file (if convertOnSave enabled)

2. COMMAND HANDLER (extension.js:37-108)
   - Validate active editor exists and is markdown language mode
   - Validate file is saved (not untitled)
   - Determine output type(s) from command or settings

3. MARKDOWN PARSING (extension.js:150-296)
   Input:  markdown text, filename, output type
   Process:
     a. Extract front matter (gray-matter)
     b. Configure markdown-it parser
        - Set line breaks option
        - Configure syntax highlighter
        - Detect Mermaid code blocks
     c. Load plugins in order:
        1. markdown-it-checkbox
        2. markdown-it-emoji (with base64 PNG encoding)
        3. markdown-it-named-headers (for TOC)
        4. markdown-it-container (custom divs)
        5. markdown-it-plantuml (server rendering)
        6. markdown-it-include (file transclusion)
     d. Override renderers:
        - image: Transform src to file:// URIs
        - html_block: Fix <img> tags in raw HTML
        - emoji: Convert to data URI PNGs
   Output: HTML fragment (body content only)

4. HTML ASSEMBLY (extension.js:320-350)
   Input:  HTML fragment, file URI
   Process:
     a. Build stylesheet cascade:
        1. VSCode markdown styles
        2. markdown.styles setting
        3. highlight.js theme (or default tomorrow.css)
        4. markdown-pdf.css
        5. User custom styles (markdown-pdf.styles)
     b. Get document title (filename)
     c. Load Mermaid JavaScript CDN URL
     d. Compile Mustache template
   Output: Complete HTML document

5. CHROMIUM RENDERING (extension.js:367-507)
   Input:  HTML document, filename, output type, URI
   Process:
     a. Check Chromium binary exists
     b. Calculate output path (supports 3 modes):
        - Home relative: ~/output/doc.pdf
        - Absolute: /full/path/output/doc.pdf
        - Workspace/file relative: ./output/doc.pdf
     c. For HTML output:
        - Write HTML file directly
     d. For PDF/PNG/JPEG:
        1. Write temporary HTML file (_tmp.html)
        2. Launch puppeteer with Chromium
        3. Navigate to file:// URL
        4. Wait for networkidle0 (all resources loaded)
        5. Render:
           - PDF: page.pdf() with full options
           - PNG/JPEG: page.screenshot() with options
        6. Close browser
        7. Delete temporary file (unless debug mode)
   Output: File written to disk

6. USER FEEDBACK
   - Progress notification during rendering
   - Status bar message with output file path
   - Error messages if failures occur
```

### Image Path Resolution Flow

```
Markdown Image: ![alt](./images/icon.png)
       ↓
markdown-it parses to token
       ↓
Custom renderer: md.renderer.rules.image
       ↓
convertImgPath(href, filename)
       ↓
Path analysis:
  - file:// protocol? → Normalize slashes
  - http(s):// protocol? → Return as-is
  - Absolute path? → Convert to file:///full/path
  - Relative path? → Resolve from markdown file dir
       ↓
Encode special chars: # → %23
       ↓
Result: file:///full/path/to/image.png
       ↓
Chromium can load local image
```

### Stylesheet Cascade Flow

```
1. includeDefaultStyles check
   ├─ TRUE: Load styles/markdown.css
   └─ FALSE: Skip

2. includeDefaultStyles check
   ├─ TRUE: Load markdown.styles setting (VSCode default)
   └─ FALSE: Skip

3. Syntax highlighting enabled?
   ├─ highlightStyle set? → Load node_modules/highlight.js/styles/{theme}.css
   └─ No style set? → Load styles/tomorrow.css

4. includeDefaultStyles check
   ├─ TRUE: Load styles/markdown-pdf.css
   └─ FALSE: Skip

5. markdown-pdf.styles setting
   └─ Load each custom stylesheet (local or remote URLs)

All styles concatenated into single <style> tag in template
```

## Configuration & Environment

### Installation & Setup

1. **Initial Install**: `code --install-extension yzane.markdown-pdf`
2. **First Run**: Chromium download triggered automatically (~170-280MB)
3. **Proxy Setup** (if behind corporate firewall):
   ```json
   {
     "http.proxy": "http://proxy.company.com:8080"
   }
   ```
4. **Custom Chrome Path** (to skip download):
   ```json
   {
     "markdown-pdf.executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
   }
   ```

### Key Configuration Patterns

**Output Directory Modes**:
```json
{
  "markdown-pdf.outputDirectory": "~/output",                    // Home relative
  "markdown-pdf.outputDirectory": "/absolute/path/output",       // Absolute
  "markdown-pdf.outputDirectory": "output",                      // Workspace/file relative
  "markdown-pdf.outputDirectoryRelativePathFile": true           // Force file-relative
}
```

**Multi-Format Export**:
```json
{
  "markdown-pdf.type": ["pdf", "html", "png"]  // Generates all 3 on export
}
```

**Auto-Convert on Save**:
```json
{
  "markdown-pdf.convertOnSave": true,
  "markdown-pdf.convertOnSaveExclude": [
    "^work",          // Exclude files starting with "work"
    "draft.md$",      // Exclude draft.md
    "temp|test"       // Exclude files with "temp" or "test"
  ]
}
```

**Custom Styling**:
```json
{
  "markdown-pdf.styles": [
    "~/my-styles/custom.css",
    "./project-styles.css"
  ],
  "markdown-pdf.includeDefaultStyles": false    // Use only custom styles
}
```

**PDF Headers/Footers** (ISO date format as of v1.5.0):
```json
{
  "markdown-pdf.displayHeaderFooter": true,
  "markdown-pdf.headerTemplate": "<div style='font-size: 9px;'><span class='title'></span> - %%ISO-DATE%%</div>",
  "markdown-pdf.footerTemplate": "<div style='font-size: 9px;'><span class='pageNumber'></span>/<span class='totalPages'></span></div>"
}
```

### Front Matter Overrides

Per-document configuration via YAML front matter:

```markdown
---
breaks: true
emoji: false
plantumlOpenMarker: "@startuml"
plantumlCloseMarker: "@enduml"
---

# Document Title

Content here...
```

Supported front matter keys: `breaks`, `emoji`, `plantumlOpenMarker`, `plantumlCloseMarker`

### Environment Requirements

- **Node.js**: Implicitly required by VS Code extension host
- **VS Code**: `^1.0.0` (any version 1.x or later)
- **Platform**: Windows, macOS, Linux (WSL supported)
- **Network**: Required for first-run Chromium download (unless custom executablePath set)
- **Disk Space**: ~300MB for Chromium + ~50MB for node_modules

## Notable Patterns & Conventions

### Code Organization Patterns

1. **Flat Function Structure**: All functions at module scope, no classes
2. **Try-Catch Wrapper**: Every function wrapped in try-catch with `showErrorMessage()`
3. **Configuration Access**: Direct `vscode.workspace.getConfiguration()` calls (no caching)
4. **Path Normalization**: Consistent `path.join()` and `vscode.Uri` usage for cross-platform support
5. **Error Handling**: User-friendly messages with technical details in console

### Naming Conventions

- **Functions**: camelCase, descriptive verbs (`convertMarkdownToHtml`, `exportPdf`)
- **Variables**: camelCase, descriptive nouns (`mdfilename`, `outputDir`)
- **Constants**: SCREAMING_SNAKE_CASE (`INSTALL_CHECK`)
- **Settings**: kebab-case with namespace (`markdown-pdf.outputDirectory`)

### VS Code Extension Patterns

1. **Activation Events**:
   - Command activation: `onCommand:extension.markdown-pdf.*`
   - Language activation: `onLanguage:markdown`
   - Lazy loading: Extension loads only when markdown file opened

2. **Command Registration**:
   - 6 commands registered in array, pushed to subscriptions
   - Command IDs: `extension.markdown-pdf.{settings|pdf|html|png|jpeg|all}`

3. **Context Menus**:
   - Commands appear in both Command Palette and editor context menu
   - Filtered by `when` clause: `resourceLangId == markdown`

4. **Multi-Root Workspace Support**:
   - `vscode.workspace.getWorkspaceFolder(resource)` for folder detection
   - Path resolution respects workspace root

5. **Progress Indication**:
   - Status bar messages for quick feedback
   - Progress notifications for long operations
   - Configurable timeout: `markdown-pdf.StatusbarMessageTimeout`

### Security Considerations

1. **Path Traversal Prevention**: Relative paths resolved safely via `path.resolve()`
2. **No Arbitrary Code Execution**: Template rendering via Mustache (logic-less)
3. **Remote Resource Loading**: Supports HTTP(S) for styles/Mermaid, but validated by Chromium
4. **Temporary File Cleanup**: `_tmp.html` deleted after rendering (unless debug mode)
5. **Proxy Respect**: Uses VS Code's `http.proxy` setting for corporate environments

### Performance Optimizations

1. **Lazy Chromium Install**: Defers 300MB download until first use
2. **Network Idle Detection**: Waits for all resources loaded before rendering
3. **Temporary File Strategy**: Writes to disk for Chromium (avoids large data URIs)
4. **Stylesheet Inlining**: Embeds CSS to avoid additional HTTP requests
5. **Old Revision Cleanup**: Removes previous Chromium versions after upgrade

### Extensibility Points

1. **markdown-it Plugins**: Easy to add new plugins in `convertMarkdownToHtml()`
2. **Custom Renderers**: Override any markdown-it renderer (image, emoji, etc.)
3. **Stylesheet Cascade**: Users can add unlimited custom CSS files
4. **Template Modification**: `template/template.html` can be edited
5. **Front Matter Schema**: Can add new keys for per-document config

## Extension Points

### Adding New Output Formats

To add support for a new format (e.g., DOCX):

1. **Update format list** (extension.js:67):
   ```javascript
   var types_format = ['html', 'pdf', 'png', 'jpeg', 'docx'];
   ```

2. **Add command** (package.json:38-42):
   ```json
   {
     "command": "extension.markdown-pdf.docx",
     "title": "Markdown PDF: Export (docx)"
   }
   ```

3. **Register command** (extension.js:12-19):
   ```javascript
   vscode.commands.registerCommand('extension.markdown-pdf.docx', async () => {
     await markdownPdf('docx');
   })
   ```

4. **Implement export logic** (extension.js:367-507):
   ```javascript
   if (type == 'docx') {
     // Use pandoc or docx library
     exportDocx(data, exportFilename);
   }
   ```

### Adding New markdown-it Plugins

To add a new markdown feature:

1. **Install plugin**:
   ```bash
   npm install markdown-it-footnote --save
   ```

2. **Load and use** (extension.js:287):
   ```javascript
   md.use(require('markdown-it-footnote'));
   ```

3. **Add configuration** (package.json:130-480):
   ```json
   "markdown-pdf.footnote.enable": {
     "type": "boolean",
     "default": true,
     "description": "Enable footnote support"
   }
   ```

### Custom Styling Workflow

For organization-specific branding:

1. Create custom CSS file: `~/.config/markdown-pdf/corporate.css`
2. Configure in settings:
   ```json
   {
     "markdown-pdf.styles": ["~/.config/markdown-pdf/corporate.css"],
     "markdown-pdf.includeDefaultStyles": false
   }
   ```
3. Override styles for:
   - Headers: `h1, h2, h3 { ... }`
   - Code blocks: `pre.hljs { ... }`
   - Tables: `table { ... }`
   - Page breaks: `.page { ... }`

### Server-Side Deployment

To run conversions outside VS Code:

1. **Extract core logic** from extension.js
2. **Replace VS Code APIs**:
   - `vscode.workspace.getConfiguration()` → Read JSON config
   - `vscode.window.setStatusBarMessage()` → Console logging
   - `vscode.Uri` → Node.js `url` module
3. **Expose CLI**:
   ```bash
   markdown-pdf convert input.md --output output.pdf --config config.json
   ```
4. **Handle Chromium**:
   - Use `puppeteer` instead of `puppeteer-core` (bundles Chromium)
   - Or require Chrome/Chromium installation

## Recommendations

### Code Quality Improvements

1. **Modularization**:
   - **Current**: Single 900-line file
   - **Suggestion**: Split into modules:
     - `src/parser.js` - Markdown processing
     - `src/renderer.js` - Puppeteer operations
     - `src/config.js` - Configuration management
     - `src/utils.js` - File/path utilities
   - **Benefit**: Easier testing, maintenance, and onboarding

2. **Error Handling Enhancement**:
   - **Current**: Generic `showErrorMessage()` calls
   - **Suggestion**: Custom error classes with recovery strategies
   ```javascript
   class ChromiumNotFoundError extends Error {
     constructor() {
       super('Chromium not found');
       this.recoveryAction = 'Run "Markdown PDF: Install Chromium" command';
     }
   }
   ```
   - **Benefit**: More actionable error messages

3. **Type Safety**:
   - **Current**: Plain JavaScript with JSDoc comments
   - **Suggestion**: Migrate to TypeScript or add comprehensive JSDoc types
   - **Benefit**: Catch configuration errors at development time

4. **Test Coverage**:
   - **Current**: Minimal test suite
   - **Suggestion**: Add integration tests for:
     - Each output format (PDF, HTML, PNG, JPEG)
     - All markdown-it plugins
     - Path resolution modes
     - Front matter parsing
   - **Benefit**: Prevent regressions during refactoring

### Feature Enhancements

1. **Batch Conversion**:
   - Add command to convert entire folder of markdown files
   - Configuration: `markdown-pdf.batchConvert.include` (glob patterns)
   - Use case: Documentation generation, e-book compilation

2. **Output Format Templates**:
   - Support multiple HTML templates (academic, presentation, e-book)
   - Configuration: `markdown-pdf.template` → path to custom template
   - Include variables: `{author}`, `{date}`, `{version}` from front matter

3. **Live Preview**:
   - Add webview panel showing PDF preview
   - Auto-refresh on markdown file save
   - Implement via `vscode.window.createWebviewPanel()`

4. **Custom Preprocessors**:
   - Allow shell commands to run before conversion
   - Configuration: `markdown-pdf.preprocessor` → `"python preprocess.py {file}"`
   - Use case: Generate dynamic content, fetch data, run scripts

5. **Export Profiles**:
   - Named configuration sets (e.g., "print", "web", "ebook")
   - Quick switching via Command Palette
   - Configuration: `markdown-pdf.profiles.print = { ... }`

### Performance Optimizations

1. **Chromium Launch Caching**:
   - Keep Chromium instance running for multiple conversions
   - Only restart on configuration changes
   - Expected speedup: 2-3x for batch operations

2. **Incremental Stylesheet Resolution**:
   - Cache stylesheet contents between conversions
   - Invalidate on file modification
   - Benefit: Faster repeated conversions

3. **Async Plugin Loading**:
   - Load markdown-it plugins lazily based on content
   - Example: Only load PlantUML plugin if `@startuml` detected
   - Benefit: Faster activation for simple documents

### Documentation Improvements

1. **Architecture Diagrams**:
   - Add Mermaid diagrams to README showing data flow
   - Include sequence diagrams for conversion process

2. **Troubleshooting Guide**:
   - Common issues: Chromium download failures, proxy configuration
   - Platform-specific gotchas (WSL paths, Windows backslashes)
   - Debug mode instructions

3. **Cookbook**:
   - Common customization recipes:
     - Corporate branding
     - Academic paper formatting
     - E-book generation
     - Presentation slides

### Security Hardening

1. **Content Security Policy**:
   - Add CSP headers to generated HTML
   - Restrict script sources to known CDNs (Mermaid)

2. **Path Sanitization**:
   - Validate all user-provided paths against path traversal
   - Use allowlist for permitted output directories

3. **Dependency Audit**:
   - Run `npm audit` regularly
   - Update highlight.js (currently v9, latest is v11)
   - Update puppeteer-core to latest stable

### Maintainability

1. **Configuration Documentation**:
   - Generate reference docs from package.json schema
   - Keep README in sync via automation

2. **Changelog Automation**:
   - Use conventional commits
   - Auto-generate changelog from git history

3. **Continuous Integration**:
   - Add GitHub Actions for:
     - Linting (ESLint)
     - Testing on Windows/macOS/Linux
     - Automated releases to marketplace

---

## File Reference Index

**Core Logic**:
- `extension.js:9-35` - Extension lifecycle
- `extension.js:37-108` - Command handler (`markdownPdf`)
- `extension.js:150-296` - Markdown parser (`convertMarkdownToHtml`)
- `extension.js:320-350` - HTML builder (`makeHtml`)
- `extension.js:367-507` - Renderer (`exportPdf`)
- `extension.js:683-786` - Stylesheet manager (`readStyles`, `fixHref`)

**Configuration**:
- `package.json:27-35` - Activation events
- `package.json:38-96` - Command definitions
- `package.json:130-480` - Configuration schema (40+ options)
- `package.json:482-484` - Build scripts
- `package.json:486-508` - Dependencies

**Resources**:
- `data/emoji.json` - Emoji definitions
- `template/template.html` - HTML structure
- `styles/markdown-pdf.css` - Default extension styles
- `styles/markdown.css` - Base markdown rendering
- `styles/tomorrow.css` - Default syntax highlighting theme

**Build & Test**:
- `src/compile.js` - Pre-publish optimizer
- `test/runTest.js` - Test runner
- `test/suite/extension.test.js` - Extension tests

---

**Analysis completed**: 2025-12-02
**Extension version analyzed**: 1.5.0
**Lines of code (core)**: ~900 (extension.js)
**Configuration options**: 40+
**Supported output formats**: 4 (PDF, HTML, PNG, JPEG)
**markdown-it plugins**: 6 (checkbox, emoji, container, named-headers, plantuml, include)
