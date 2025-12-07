/**
 * Renderer abstraction for MarkPrint
 *
 * This module defines the core renderer interface and registry for managing
 * multiple rendering engines (Chromium, Playwright, Vivliostyle, etc.)
 *
 * Phase 2: Only Chromium is registered. Future phases will add more renderers.
 */

/**
 * Base renderer interface that all renderers must implement
 * @interface IRendererDriver
 */
class IRendererDriver {
  /**
   * @param {Object} options - Renderer configuration options
   * @param {string} [options.extensionPath] - VS Code extension path
   */
  constructor(options = {}) {
    /** @type {string} Renderer name (e.g., 'chromium', 'playwright') */
    this.name = 'unknown';

    /** @type {string} Renderer version */
    this.version = '0.0.0';

    /** @type {string[]} Supported output formats */
    this.supportedFormats = [];
  }

  /**
   * Check if this renderer can handle the given rendering context
   * @param {Object} context - Rendering context
   * @param {string} context.format - Output format (pdf, html, png, jpeg)
   * @param {Object} [context.template] - Active template metadata
   * @param {Object} [context.layout] - Layout descriptor
   * @param {string} [context.document] - Source document path
   * @returns {boolean} True if this renderer can handle the request
   */
  canHandle(context) {
    return false;
  }

  /**
   * Render HTML content to PDF
   * @param {string} html - HTML content to render
   * @param {Object} options - Rendering options
   * @param {string} options.path - Output file path
   * @param {string} options.format - Output format ('pdf')
   * @param {Object} [options.template] - Active template metadata
   * @param {Object} [options.frontMatter] - Document front matter
   * @param {Object} [options.context] - Full render context
   * @returns {Promise<void>}
   * @throws {Error} If not implemented
   */
  async renderToPdf(html, options) {
    throw new Error(`${this.name}: renderToPdf not implemented`);
  }

  /**
   * Render HTML content to PNG image
   * @param {string} html - HTML content to render
   * @param {Object} options - Screenshot options
   * @param {string} options.path - Output file path
   * @param {string} options.format - Output format ('png')
   * @returns {Promise<void>}
   * @throws {Error} If not implemented
   */
  async renderToPng(html, options) {
    throw new Error(`${this.name}: renderToPng not implemented`);
  }

  /**
   * Render HTML content to JPEG image
   * @param {string} html - HTML content to render
   * @param {Object} options - Screenshot options
   * @param {string} options.path - Output file path
   * @param {string} options.format - Output format ('jpeg')
   * @returns {Promise<void>}
   * @throws {Error} If not implemented
   */
  async renderToJpeg(html, options) {
    throw new Error(`${this.name}: renderToJpeg not implemented`);
  }

  /**
   * Render to HTML file (pass-through or enhanced)
   * Default implementation: write HTML to file
   * @param {string} html - HTML content
   * @param {Object} options - Output options
   * @param {string} options.path - Output file path
   * @returns {Promise<void>}
   */
  async renderToHtml(html, options) {
    const fs = require('fs');
    await fs.promises.writeFile(options.path, html, 'utf-8');
  }

  /**
   * Cleanup resources (close browser instances, temp files, etc.)
   * Override in subclass if cleanup is needed
   * @returns {Promise<void>}
   */
  async dispose() {
    // No-op by default
  }
}

/**
 * Renderer Registry
 * Manages available renderers and selects the appropriate one based on context
 */
class RendererRegistry {
  constructor() {
    /** @type {Map<string, IRendererDriver>} */
    this.renderers = new Map();

    /** @type {string|null} Default renderer name */
    this.defaultRenderer = null;
  }

  /**
   * Register a renderer
   * @param {string} name - Renderer identifier (e.g., 'chromium')
   * @param {IRendererDriver} renderer - Renderer instance
   */
  register(name, renderer) {
    this.renderers.set(name, renderer);

    // First registered renderer becomes default
    if (!this.defaultRenderer) {
      this.defaultRenderer = name;
    }
  }

  /**
   * Select renderer based on context
   *
   * Selection priority:
   * 1. Template renderer.engine preference
   * 2. Layout rendererHint
   * 3. First renderer that canHandle() the context
   * 4. Default fallback
   *
   * @param {Object} context - Rendering context
   * @param {string} context.format - Output format
   * @param {Object} [context.template] - Active template with renderer preferences
   * @param {Object} [context.layout] - Layout descriptor with rendererHint
   * @param {string} [context.document] - Source document path
   * @returns {IRendererDriver|null} Selected renderer or null if none available
   */
  select(context) {
    const { template, layout, format } = context;

    // Priority 1: Check template renderer.engine preference
    if (template && template.renderer && template.renderer.engine) {
      const preferred = this.renderers.get(template.renderer.engine);
      if (preferred && preferred.canHandle(context)) {
        return preferred;
      }
    }

    // Priority 2: Check layout rendererHint
    if (layout && layout.rendererHint) {
      const hinted = this.renderers.get(layout.rendererHint);
      if (hinted && hinted.canHandle(context)) {
        return hinted;
      }
    }

    // Priority 3: Find first renderer that can handle the context
    for (const renderer of this.renderers.values()) {
      if (renderer.canHandle(context)) {
        return renderer;
      }
    }

    // Priority 4: Fall back to default renderer
    return this.renderers.get(this.defaultRenderer);
  }

  /**
   * Get renderer by name
   * @param {string} name - Renderer identifier
   * @returns {IRendererDriver|null} Renderer instance or null if not found
   */
  get(name) {
    return this.renderers.get(name) || null;
  }

  /**
   * Get all registered renderer names
   * @returns {string[]} Array of renderer names
   */
  getNames() {
    return Array.from(this.renderers.keys());
  }
}

module.exports = { IRendererDriver, RendererRegistry };
