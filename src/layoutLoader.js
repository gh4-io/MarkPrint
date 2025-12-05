'use strict';

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const debugLogger = require('./debugLogger');

class LayoutLoader {
  constructor(options = {}) {
    this.extensionPath = options.extensionPath;
  }

  async load(descriptor, options = {}) {
    if (!descriptor) {
      return null;
    }

    const type = (descriptor.type || 'json').toLowerCase();
    const resolvedSource = this.resolveSource(descriptor.source, options, descriptor);

    try {
      switch (type) {
        case 'css':
          return await this.loadCss(resolvedSource, descriptor);
        case 'json':
          return await this.loadJson(resolvedSource, descriptor);
        case 'inline':
          return this.loadInline(descriptor);
        case 'sla':
          return await this.loadSla(resolvedSource, descriptor);
        case 'xml':
          return await this.loadXml(resolvedSource, descriptor);
        case 'docbook':
        case 'pandoc':
          return await this.loadDocPipeline(resolvedSource, descriptor);
        default:
          debugLogger.log('layout', 'Unknown layout type. Returning descriptor only.', {
            type,
            source: resolvedSource
          });
          return {
            type,
            source: resolvedSource,
            descriptor,
            data: null
          };
      }
    } catch (error) {
      debugLogger.log('layout', 'Failed to load layout descriptor', {
        type,
        source: resolvedSource,
        descriptorSource: descriptor && descriptor.source ? descriptor.source : null,
        error: error.message
      });
      throw error;
    }
  }

  resolveSource(source, options = {}) {
    if (!source) {
      return null;
    }

    let resolved = source;
    if (this.extensionPath) {
      resolved = resolved.replace(/\$\{extensionPath\}/g, this.extensionPath);
    }
    if (options.workspaceFolder) {
      resolved = resolved.replace(/\$\{workspaceFolder\}/g, options.workspaceFolder);
    }
    if (options.manifestDir) {
      resolved = resolved.replace(/\$\{manifestDir\}/g, options.manifestDir);
    }

    if (resolved.startsWith('file://')) {
      try {
        resolved = new URL(resolved).pathname;
      } catch (error) {
        debugLogger.log('layout', 'Failed to parse file URI for layout source', {
          source,
          error: error.message
        });
      }
    }

    if (!path.isAbsolute(resolved)) {
      const baseDir = options.manifestDir || options.workspaceFolder || process.cwd();
      resolved = path.resolve(baseDir, resolved);
    }

    return resolved;
  }

  async loadCss(source, descriptor) {
    const cssContent = source && fs.existsSync(source)
      ? await fs.promises.readFile(source, 'utf-8')
      : null;

    return {
      type: 'css',
      source,
      descriptor,
      data: cssContent
    };
  }

  async loadJson(source, descriptor) {
    if (descriptor.inline) {
      return {
        type: 'json',
        source: null,
        descriptor,
        data: descriptor.inline
      };
    }

    if (!source || !fs.existsSync(source)) {
      throw new Error(`JSON layout source not found. descriptor="${descriptor.source || ''}", resolved="${source || 'undefined'}"`);
    }

    const content = await fs.promises.readFile(source, 'utf-8');
    return {
      type: 'json',
      source,
      descriptor,
      data: JSON.parse(content)
    };
  }

  loadInline(descriptor) {
    return {
      type: 'inline',
      source: null,
      descriptor,
      data: descriptor.inline || null
    };
  }

  async loadXml(source, descriptor) {
    if (!source || !fs.existsSync(source)) {
      throw new Error(`XML layout source not found. descriptor="${descriptor.source || ''}", resolved="${source || 'undefined'}"`);
    }

    const content = await fs.promises.readFile(source, 'utf-8');
    const parsed = cheerio.load(content, { xmlMode: true });
    const root = parsed.root();

    return {
      type: 'xml',
      source,
      descriptor,
      data: root.html()
    };
  }

  async loadDocPipeline(source, descriptor) {
    const result = {
      type: descriptor.type,
      source,
      descriptor,
      data: null,
      metadata: {
        stylesheet: descriptor.stylesheet || null,
        filters: descriptor.filters || null,
        namespace: descriptor.namespace || null
      }
    };

    if (source && fs.existsSync(source)) {
      result.data = await fs.promises.readFile(source, 'utf-8');
    }

    return result;
  }

  async loadSla(source, descriptor) {
    if (!source || !fs.existsSync(source)) {
      throw new Error(`SLA layout source not found. descriptor="${descriptor.source || ''}", resolved="${source || 'undefined'}"`);
    }

    const content = await fs.promises.readFile(source, 'utf-8');
    const parsed = cheerio.load(content, { xmlMode: true });
    const documentNode = parsed('DOCUMENT').first();

    const frames = [];
    parsed('PAGEOBJECT').each((_, element) => {
      const node = parsed(element);
      frames.push({
        name: node.attr('ANNAME') || node.attr('ItemID'),
        type: this.mapScribusFrameType(node.attr('PTYPE')),
        page: this.parseNumber(node.attr('OwnPage'), 0),
        x: this.parseNumber(node.attr('XPOS')),
        y: this.parseNumber(node.attr('YPOS')),
        width: this.parseNumber(node.attr('WIDTH')),
        height: this.parseNumber(node.attr('HEIGHT'))
      });
    });

    return {
      type: 'sla',
      source,
      descriptor,
      metadata: {
        pageWidth: this.parseNumber(documentNode.attr('PAGEWIDTH')),
        pageHeight: this.parseNumber(documentNode.attr('PAGEHEIGHT')),
        margins: {
          left: this.parseNumber(documentNode.attr('BORDERLEFT')),
          right: this.parseNumber(documentNode.attr('BORDERRIGHT')),
          top: this.parseNumber(documentNode.attr('BORDERTOP')),
          bottom: this.parseNumber(documentNode.attr('BORDERBOTTOM'))
        }
      },
      data: {
        pages: this.buildPageMap(frames)
      }
    };
  }

  parseNumber(value, fallback = 0) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  mapScribusFrameType(ptype) {
    const lookup = {
      '2': 'image',
      '4': 'text'
    };
    const normalized = String(ptype || '').trim();
    return lookup[normalized] || 'frame';
  }

  buildPageMap(frames) {
    const pages = new Map();
    for (const frame of frames) {
      const pageIndex = Number(frame.page) || 0;
      if (!pages.has(pageIndex)) {
        pages.set(pageIndex, []);
      }
      pages.get(pageIndex).push(frame);
    }

    return Array.from(pages.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNumber, pageFrames]) => ({
        page: pageNumber,
        frames: pageFrames
      }));
  }
}

module.exports = LayoutLoader;
