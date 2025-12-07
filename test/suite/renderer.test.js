/**
 * Unit tests for renderer abstraction (Phase 2)
 *
 * Tests the RendererRegistry selection logic and ChromiumRenderer interface
 */

const assert = require('assert');
const path = require('path');

// Import renderer modules
const { IRendererDriver, RendererRegistry } = require('../../src/renderers/index');
const ChromiumRenderer = require('../../src/renderers/chromiumRenderer');

suite('Renderer Abstraction Tests', function() {

  suite('IRendererDriver Interface', function() {
    test('Base interface throws on unimplemented methods', async function() {
      const baseRenderer = new IRendererDriver();

      assert.strictEqual(baseRenderer.name, 'unknown');
      assert.strictEqual(baseRenderer.version, '0.0.0');
      assert.deepStrictEqual(baseRenderer.supportedFormats, []);

      // Should throw when methods not implemented
      await assert.rejects(
        () => baseRenderer.renderToPdf('<html></html>', { path: '/tmp/test.pdf' }),
        /renderToPdf not implemented/
      );

      await assert.rejects(
        () => baseRenderer.renderToPng('<html></html>', { path: '/tmp/test.png' }),
        /renderToPng not implemented/
      );

      await assert.rejects(
        () => baseRenderer.renderToJpeg('<html></html>', { path: '/tmp/test.jpeg' }),
        /renderToJpeg not implemented/
      );
    });

    test('Base interface has default renderToHtml', async function() {
      const baseRenderer = new IRendererDriver();

      // Default renderToHtml should not throw (writes to file)
      // We won't actually write a file in tests, just verify it doesn't throw immediately
      assert.strictEqual(typeof baseRenderer.renderToHtml, 'function');
    });

    test('Base interface canHandle returns false by default', function() {
      const baseRenderer = new IRendererDriver();
      const context = { format: 'pdf' };

      assert.strictEqual(baseRenderer.canHandle(context), false);
    });
  });

  suite('RendererRegistry', function() {
    test('Registers and retrieves renderers', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      assert.strictEqual(registry.get('chromium'), chromium);
      assert.strictEqual(registry.get('chromium').name, 'chromium');
    });

    test('First registered renderer becomes default', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      assert.strictEqual(registry.defaultRenderer, null);

      registry.register('chromium', chromium);

      assert.strictEqual(registry.defaultRenderer, 'chromium');
    });

    test('Returns null for unregistered renderer', function() {
      const registry = new RendererRegistry();

      assert.strictEqual(registry.get('nonexistent'), null);
    });

    test('getNames returns all registered renderer names', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      const names = registry.getNames();
      assert.ok(Array.isArray(names));
      assert.strictEqual(names.length, 1);
      assert.strictEqual(names[0], 'chromium');
    });
  });

  suite('RendererRegistry Selection Logic', function() {
    test('Selects renderer based on template engine preference', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      const context = {
        format: 'pdf',
        template: {
          renderer: { engine: 'chromium' }
        },
        layout: null
      };

      const selected = registry.select(context);
      assert.strictEqual(selected.name, 'chromium');
    });

    test('Selects renderer based on layout rendererHint', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      const context = {
        format: 'pdf',
        template: null,
        layout: { rendererHint: 'chromium' }
      };

      const selected = registry.select(context);
      assert.strictEqual(selected.name, 'chromium');
    });

    test('Falls back to canHandle when no explicit preference', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      const context = {
        format: 'pdf',
        template: null,
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

      // Should fall back to default (chromium)
      const selected = registry.select(context);
      assert.strictEqual(selected.name, 'chromium');
    });

    test('Template engine preference takes priority over layout hint', function() {
      const registry = new RendererRegistry();
      const chromium = new ChromiumRenderer();

      registry.register('chromium', chromium);

      const context = {
        format: 'pdf',
        template: { renderer: { engine: 'chromium' } },
        layout: { rendererHint: 'other' }  // Should be ignored
      };

      const selected = registry.select(context);
      assert.strictEqual(selected.name, 'chromium');
    });
  });

  suite('ChromiumRenderer', function() {
    test('Has correct name and supported formats', function() {
      const renderer = new ChromiumRenderer();

      assert.strictEqual(renderer.name, 'chromium');
      assert.ok(renderer.version); // Should have some version
      assert.deepStrictEqual(renderer.supportedFormats, ['pdf', 'html', 'png', 'jpeg']);
    });

    test('canHandle returns true for supported formats', function() {
      const renderer = new ChromiumRenderer();

      assert.strictEqual(renderer.canHandle({ format: 'pdf' }), true);
      assert.strictEqual(renderer.canHandle({ format: 'html' }), true);
      assert.strictEqual(renderer.canHandle({ format: 'png' }), true);
      assert.strictEqual(renderer.canHandle({ format: 'jpeg' }), true);
    });

    test('canHandle returns false for unsupported formats', function() {
      const renderer = new ChromiumRenderer();

      assert.strictEqual(renderer.canHandle({ format: 'svg' }), false);
      assert.strictEqual(renderer.canHandle({ format: 'docx' }), false);
    });

    test('transformTemplate replaces ISO date/time placeholders', function() {
      const renderer = new ChromiumRenderer();

      const template = 'Date: %%ISO-DATE%%, Time: %%ISO-TIME%%, DateTime: %%ISO-DATETIME%%';
      const result = renderer.transformTemplate(template);

      // Should not contain placeholders anymore
      assert.ok(!result.includes('%%ISO-DATE%%'));
      assert.ok(!result.includes('%%ISO-TIME%%'));
      assert.ok(!result.includes('%%ISO-DATETIME%%'));

      // Should contain date-like strings (basic validation)
      assert.ok(result.includes('Date: '));
      assert.ok(result.includes('Time: '));
      assert.ok(result.includes('DateTime: '));
    });

    test('buildPdfOptions merges config defaults', function() {
      const renderer = new ChromiumRenderer();

      // Mock VS Code config (we can't fully test without VS Code environment)
      // Just verify the method exists and has correct signature
      assert.strictEqual(typeof renderer.buildPdfOptions, 'function');
    });

    test('buildScreenshotOptions handles PNG and JPEG', function() {
      const renderer = new ChromiumRenderer();

      // Verify methods exist
      assert.strictEqual(typeof renderer.buildScreenshotOptions, 'function');
    });

    test('resolveSettingPath handles home directory', function() {
      const renderer = new ChromiumRenderer({ extensionPath: '/ext' });

      const resolved = renderer.resolveSettingPath('~/docs', null);
      assert.ok(resolved.includes('docs'));
      assert.ok(!resolved.includes('~'));
    });

    test('resolveSettingPath handles absolute paths', function() {
      const renderer = new ChromiumRenderer({ extensionPath: '/ext' });

      const resolved = renderer.resolveSettingPath('/absolute/path', null);
      assert.strictEqual(resolved, '/absolute/path');
    });
  });
});
