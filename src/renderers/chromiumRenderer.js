/**
 * Chromium Renderer for MarkPrint
 *
 * Wraps Puppeteer-core to render HTML to PDF/PNG/JPEG/HTML
 * Ported from extension.js exportPdf() function (Phase 1)
 */

const { IRendererDriver } = require('./index');
const path = require('path');
const fs = require('fs');

class ChromiumRenderer extends IRendererDriver {
  /**
   * @param {Object} options - Renderer configuration
   * @param {string} [options.extensionPath] - VS Code extension path
   */
  constructor(options = {}) {
    super(options);
    this.name = 'chromium';
    this.version = this.getChromiumVersion();
    this.supportedFormats = ['pdf', 'html', 'png', 'jpeg'];
    this.extensionPath = options.extensionPath;
  }

  /**
   * Get Chromium/Puppeteer version
   * @returns {string} Version string
   */
  getChromiumVersion() {
    try {
      const pkgPath = path.join(__dirname, '../../node_modules/puppeteer-core/package.json');
      const pkg = require(pkgPath);
      return pkg.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Check if this renderer can handle the request
   * Chromium handles all standard formats
   * @param {Object} context - Rendering context
   * @returns {boolean}
   */
  canHandle(context) {
    return this.supportedFormats.includes(context.format);
  }

  /**
   * Render HTML to PDF using Puppeteer
   * @param {string} html - HTML content
   * @param {Object} options - Rendering options
   * @returns {Promise<void>}
   */
  async renderToPdf(html, options) {
    const debugLogger = require('../debugLogger');
    const vscode = require('vscode');

    debugLogger.log('renderer', 'Chromium PDF render start', {
      path: options.path,
      format: options.format
    });

    const puppeteer = require('puppeteer-core');
    let browser = null;
    let tmpfilename = null;

    try {
      // Write HTML to temporary file
      const f = path.parse(options.path);
      tmpfilename = path.join(f.dir, f.name + '_tmp.html');
      await fs.promises.writeFile(tmpfilename, html, 'utf-8');

      // Get executable path from config
      const executablePathSetting = vscode.workspace.getConfiguration('markprint')['executablePath'] || '';
      const executablePath = this.resolveSettingPath(executablePathSetting, options.uri);

      // Launch browser
      const launchOptions = {
        executablePath: executablePath || puppeteer.executablePath(),
        args: [
          '--lang=' + vscode.env.language,
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      };

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setDefaultTimeout(0);
      await page.goto(vscode.Uri.file(tmpfilename).toString(), { waitUntil: 'networkidle0' });

      // Build PDF options from VS Code config
      const pdfOptions = this.buildPdfOptions(options);
      await page.pdf(pdfOptions);

      debugLogger.log('renderer', 'Chromium PDF render complete', {
        path: options.path,
        format: pdfOptions.format
      });
    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }

      // Delete temp file unless debug mode
      const debug = require('vscode').workspace.getConfiguration('markprint')['debug'] || false;
      if (!debug && tmpfilename && fs.existsSync(tmpfilename)) {
        fs.unlinkSync(tmpfilename);
      }
    }
  }

  /**
   * Render HTML to PNG using Puppeteer screenshot
   * @param {string} html - HTML content
   * @param {Object} options - Rendering options
   * @returns {Promise<void>}
   */
  async renderToPng(html, options) {
    await this.renderToImage(html, options, 'png');
  }

  /**
   * Render HTML to JPEG using Puppeteer screenshot
   * @param {string} html - HTML content
   * @param {Object} options - Rendering options
   * @returns {Promise<void>}
   */
  async renderToJpeg(html, options) {
    await this.renderToImage(html, options, 'jpeg');
  }

  /**
   * Render HTML to image (PNG or JPEG)
   * @param {string} html - HTML content
   * @param {Object} options - Rendering options
   * @param {string} imageType - 'png' or 'jpeg'
   * @returns {Promise<void>}
   */
  async renderToImage(html, options, imageType) {
    const debugLogger = require('../debugLogger');
    const vscode = require('vscode');

    debugLogger.log('renderer', `Chromium ${imageType.toUpperCase()} render start`, {
      path: options.path
    });

    const puppeteer = require('puppeteer-core');
    let browser = null;
    let tmpfilename = null;

    try {
      // Write HTML to temporary file
      const f = path.parse(options.path);
      tmpfilename = path.join(f.dir, f.name + '_tmp.html');
      await fs.promises.writeFile(tmpfilename, html, 'utf-8');

      // Get executable path from config
      const executablePathSetting = vscode.workspace.getConfiguration('markprint')['executablePath'] || '';
      const executablePath = this.resolveSettingPath(executablePathSetting, options.uri);

      // Launch browser
      const launchOptions = {
        executablePath: executablePath || puppeteer.executablePath(),
        args: [
          '--lang=' + vscode.env.language,
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ]
      };

      browser = await puppeteer.launch(launchOptions);
      const page = await browser.newPage();
      await page.setDefaultTimeout(0);
      await page.goto(vscode.Uri.file(tmpfilename).toString(), { waitUntil: 'networkidle0' });

      // Build screenshot options from VS Code config
      const screenshotOptions = this.buildScreenshotOptions(options, imageType);
      await page.screenshot(screenshotOptions);

      debugLogger.log('renderer', `Chromium ${imageType.toUpperCase()} render complete`, {
        path: options.path
      });
    } finally {
      // Cleanup
      if (browser) {
        await browser.close();
      }

      // Delete temp file unless debug mode
      const debug = require('vscode').workspace.getConfiguration('markprint')['debug'] || false;
      if (!debug && tmpfilename && fs.existsSync(tmpfilename)) {
        fs.unlinkSync(tmpfilename);
      }
    }
  }

  /**
   * Build PDF options from VS Code configuration
   * @param {Object} options - Base options with uri
   * @returns {Object} Puppeteer PDF options
   */
  buildPdfOptions(options) {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('markprint', options.uri);

    // Width/height override format
    const width_option = config['width'] || '';
    const height_option = config['height'] || '';
    const format_option = (!width_option && !height_option) ? (config['format'] || 'A4') : '';

    // Orientation
    const landscape_option = config['orientation'] === 'landscape';

    // Transform header/footer templates (ISO date/time placeholders)
    const headerTemplate = this.transformTemplate(config['headerTemplate'] || '');
    const footerTemplate = this.transformTemplate(config['footerTemplate'] || '');

    return {
      path: options.path,
      scale: config['scale'] || 1,
      displayHeaderFooter: config['displayHeaderFooter'] !== false,
      headerTemplate,
      footerTemplate,
      printBackground: config['printBackground'] !== false,
      landscape: landscape_option,
      pageRanges: config['pageRanges'] || '',
      format: format_option,
      width: width_option,
      height: height_option,
      margin: {
        top: config['margin']['top'] || '1.5cm',
        right: config['margin']['right'] || '1cm',
        bottom: config['margin']['bottom'] || '1cm',
        left: config['margin']['left'] || '1cm'
      },
      timeout: 0
    };
  }

  /**
   * Build screenshot options from VS Code configuration
   * @param {Object} options - Base options with uri
   * @param {string} imageType - 'png' or 'jpeg'
   * @returns {Object} Puppeteer screenshot options
   */
  buildScreenshotOptions(options, imageType) {
    const vscode = require('vscode');
    const config = vscode.workspace.getConfiguration('markprint');

    const screenshotOptions = {
      path: options.path,
      type: imageType,
      fullPage: true,
      omitBackground: config['omitBackground'] || false
    };

    // Quality only for JPEG
    if (imageType === 'jpeg') {
      screenshotOptions.quality = config['quality'] || 100;
    }

    // Clip region (if all four coordinates specified)
    const clip_x = config['clip']['x'];
    const clip_y = config['clip']['y'];
    const clip_width = config['clip']['width'];
    const clip_height = config['clip']['height'];

    if (clip_x !== null && clip_x !== '' &&
        clip_y !== null && clip_y !== '' &&
        clip_width !== null && clip_width !== '' &&
        clip_height !== null && clip_height !== '') {
      screenshotOptions.clip = {
        x: clip_x,
        y: clip_y,
        width: clip_width,
        height: clip_height
      };
      screenshotOptions.fullPage = false;
    }

    return screenshotOptions;
  }

  /**
   * Transform template text with date/time placeholders
   * Ported from extension.js transformTemplate()
   * @param {string} templateText - Template with placeholders
   * @returns {string} Transformed template
   */
  transformTemplate(templateText) {
    if (templateText.indexOf('%%ISO-DATETIME%%') !== -1) {
      templateText = templateText.replace('%%ISO-DATETIME%%', new Date().toISOString().substr(0, 19).replace('T', ' '));
    }
    if (templateText.indexOf('%%ISO-DATE%%') !== -1) {
      templateText = templateText.replace('%%ISO-DATE%%', new Date().toISOString().substr(0, 10));
    }
    if (templateText.indexOf('%%ISO-TIME%%') !== -1) {
      templateText = templateText.replace('%%ISO-TIME%%', new Date().toISOString().substr(11, 8));
    }
    return templateText;
  }

  /**
   * Resolve setting path (absolute, workspace-relative, or home-relative)
   * Ported from extension.js resolveSettingPath
   * @param {string} settingPath - Path from settings
   * @param {Object} resource - VS Code URI resource
   * @returns {string} Resolved absolute path
   */
  resolveSettingPath(settingPath, resource) {
    if (!settingPath) {
      return '';
    }

    const os = require('os');
    const vscode = require('vscode');

    // Home directory relative
    if (settingPath.indexOf('~') === 0) {
      return settingPath.replace(/^~/, os.homedir());
    }

    // Absolute path
    if (path.isAbsolute(settingPath)) {
      return settingPath;
    }

    // Workspace relative
    if (resource) {
      const root = vscode.workspace.getWorkspaceFolder(resource);
      if (root) {
        return path.join(root.uri.fsPath, settingPath);
      }
    }

    // Relative to extension
    return path.join(this.extensionPath || __dirname, settingPath);
  }
}

module.exports = ChromiumRenderer;
