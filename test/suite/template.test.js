const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const vscode = require('vscode');
const LayoutLoader = require('../../src/layoutLoader');
const { resolveStylesheetHref } = require('../../src/stylesheetResolver');

const repoRoot = path.join(__dirname, '..', '..');

function createWorkspaceState() {
  const store = new Map();
  return {
    get: key => store.get(key),
    update: (key, value) => {
      if (value === undefined) {
        store.delete(key);
      } else {
        store.set(key, value);
      }
      return Promise.resolve();
    }
  };
}

function createMockDocument(text, fileName) {
  const filePath = path.join(repoRoot, 'test', '.test-workspace', fileName);
  const uri = vscode.Uri.file(filePath);
  return {
    uri,
    getText: () => text
  };
}

suite('Template Registry Tests', function() {
  const TemplateRegistry = require('../../src/templateRegistry');

  test('Should create template registry instance', function() {
    const mockContext = {
      extensionPath: path.join(__dirname, '..', '..'),
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);
    assert.ok(registry);
  });

  test('Should load bundled templates', async function() {
    const mockContext = {
      extensionPath: path.join(__dirname, '..', '..'),
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);
    await registry.loadBundledTemplates();

    const templates = registry.getAllTemplates();
    assert.ok(templates.length > 0, 'Should load at least one bundled template');
  });

  test('Should get template by ID', async function() {
    const mockContext = {
      extensionPath: path.join(__dirname, '..', '..'),
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);
    await registry.initialize();

    const template = registry.getTemplate('standard-letter');
    assert.ok(template, 'Should find standard-letter template');
    assert.strictEqual(template.id, 'standard-letter');
    assert.strictEqual(template.label, 'Standard Letter');
  });

  test('Should validate required template fields', async function() {
    const mockContext = {
      extensionPath: path.join(__dirname, '..', '..'),
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);

    const invalidTemplatePath = path.join(__dirname, 'invalid-template.json');
    fs.writeFileSync(invalidTemplatePath, JSON.stringify({ label: 'Test', version: '1.0.0' }));

    try {
      await registry.loadTemplate(invalidTemplatePath);
      assert.fail('Should throw error for invalid template');
    } catch (error) {
      assert.ok(error.message.includes('missing required fields'));
    } finally {
      fs.unlinkSync(invalidTemplatePath);
    }
  });

  test('Should merge templates with inheritance', function() {
    const mockContext = {
      extensionPath: path.join(__dirname, '..', '..'),
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);

    const parent = {
      id: 'parent',
      label: 'Parent',
      version: '1.0.0',
      layout: {
        format: 'Letter',
        margins: { top: '1in' }
      }
    };

    const child = {
      id: 'child',
      extends: 'parent',
      label: 'Child',
      version: '1.0.0',
      layout: {
        margins: { bottom: '2in' }
      }
    };

    const merged = registry.mergeTemplates(parent, child);

    assert.strictEqual(merged.id, 'child');
    assert.strictEqual(merged.label, 'Child');
    assert.strictEqual(merged.layout.format, 'Letter'); // inherited
    assert.strictEqual(merged.layout.margins.top, '1in'); // inherited
    assert.strictEqual(merged.layout.margins.bottom, '2in'); // overridden
  });

  test('Should prefer pipeline_profile over layout_template', async function() {
    const mockContext = {
      extensionPath: repoRoot,
      subscriptions: []
    };
    const registry = new TemplateRegistry(mockContext);
    await registry.initialize();

    const workspaceState = createWorkspaceState();
    const document = createMockDocument(
      [
        '---',
        'pipeline_profile: dts-master-report',
        'layout_template: standard-letter',
        '---',
        '',
        '# Sample'
      ].join('\n'),
      'pipeline-profile.md'
    );

    const template = await registry.getTemplateForDocument(document, workspaceState);
    assert.ok(template, 'Template should resolve');
    assert.strictEqual(template.id, 'dts-master-report');
  });

  test('Should fallback to default profile when metadata missing', async function() {
    const originalGetConfiguration = vscode.workspace.getConfiguration;
    vscode.workspace.getConfiguration = () => ({
      templateFallbackMode: 'auto',
      defaultTemplate: 'standard-letter'
    });

    try {
      const mockContext = {
        extensionPath: repoRoot,
        subscriptions: []
      };
      const registry = new TemplateRegistry(mockContext);
      await registry.initialize();

      const workspaceState = createWorkspaceState();
      const document = createMockDocument(
        [
          '---',
          'title: Untagged Document',
          '---',
          '',
          '# Body'
        ].join('\n'),
        'fallback.md'
      );

      const template = await registry.getTemplateForDocument(document, workspaceState);
      assert.ok(template, 'Fallback template should resolve');
      assert.strictEqual(template.id, 'standard-letter');
    } finally {
      vscode.workspace.getConfiguration = originalGetConfiguration;
    }
  });
});

suite('Schema Validator Tests', function() {
  const SchemaValidator = require('../../src/schemaValidator');

  test('Should create validator instance', function() {
    const validator = new SchemaValidator();
    assert.ok(validator);
    assert.ok(validator.ajv);
  });

  test('Should validate valid front matter', async function() {
    const validator = new SchemaValidator();

    const schema = {
      type: 'object',
      required: ['title', 'document_id'],
      properties: {
        title: { type: 'string' },
        document_id: { type: 'string' }
      }
    };

    const validate = validator.ajv.compile(schema);
    const valid = validate({ title: 'Test', document_id: 'SOP-100' });

    assert.ok(valid, 'Should validate correct data');
  });

  test('Should reject invalid front matter', async function() {
    const validator = new SchemaValidator();

    const schema = {
      type: 'object',
      required: ['title', 'document_id'],
      properties: {
        title: { type: 'string' },
        document_id: { type: 'string', pattern: '^[A-Z]{3}-[0-9]{3}$' }
      }
    };

    const validate = validator.ajv.compile(schema);
    const valid = validate({ title: 'Test', document_id: 'invalid' });

    assert.ok(!valid, 'Should reject invalid pattern');
    assert.ok(validate.errors.length > 0);
  });

  test('Should format AJV errors', function() {
    const validator = new SchemaValidator();

    const error1 = {
      keyword: 'required',
      params: { missingProperty: 'title' }
    };

    const error2 = {
      keyword: 'type',
      instancePath: '/revision',
      params: { type: 'string' }
    };

    const msg1 = validator.formatAjvError(error1);
    const msg2 = validator.formatAjvError(error2);

    assert.ok(msg1.includes('title'));
    assert.ok(msg2.includes('revision'));
    assert.ok(msg2.includes('string'));
  });
});

suite('Status Bar Manager Tests', function() {
  const StatusBarManager = require('../../src/statusBar');

  test('Should create status bar instance', function() {
    const statusBar = new StatusBarManager();
    assert.ok(statusBar);
    assert.ok(statusBar.statusBarItem);
  });

  test('Should get correct icon for build mode', function() {
    const statusBar = new StatusBarManager();

    assert.strictEqual(statusBar.getModeIcon('auto'), '$(sync)');
    assert.strictEqual(statusBar.getModeIcon('manual'), '$(gear)');
    assert.strictEqual(statusBar.getModeIcon('hybrid'), '$(eye)');
  });

  test('Should update display with template', function() {
    const statusBar = new StatusBarManager();
    statusBar.buildMode = 'manual';

    const template = {
      id: 'test',
      label: 'Test Template',
      version: '1.0.0'
    };

    statusBar.setTemplate(template);

    assert.ok(statusBar.statusBarItem.text.includes('MANUAL'));
    assert.ok(statusBar.statusBarItem.text.includes('Test Template'));
  });

  test('Should clear template from display', function() {
    const statusBar = new StatusBarManager();
    statusBar.buildMode = 'manual';

    const template = {
      id: 'test',
      label: 'Test Template',
      version: '1.0.0'
    };

    statusBar.setTemplate(template);
    statusBar.clearTemplate();

    assert.ok(statusBar.statusBarItem.text.includes('MANUAL'));
    assert.ok(!statusBar.statusBarItem.text.includes('Test Template'));
  });
});

suite('Layout Loader Tests', function() {
  test('Should load JSON layout artifacts', async function() {
    const loader = new LayoutLoader({ extensionPath: repoRoot });
    const descriptor = {
      type: 'json',
      source: path.join(repoRoot, 'templates', 'layouts', 'standard-letter.layout.json')
    };
    const artifact = await loader.load(descriptor);
    assert.strictEqual(artifact.type, 'json');
    assert.ok(artifact.data);
    assert.ok(artifact.data.frames);
    assert.ok(artifact.data.frames.title);
  });

  test('Should parse Scribus SLA frames', async function() {
    const loader = new LayoutLoader({ extensionPath: repoRoot });
    const descriptor = {
      type: 'sla',
      source: path.join(repoRoot, 'templates', 'layouts', 'DTS_Master_Report_Template.sla')
    };
    const artifact = await loader.load(descriptor);
    assert.strictEqual(artifact.type, 'sla');
    assert.ok(artifact.data);
    assert.ok(Array.isArray(artifact.data.pages));
    assert.ok(artifact.data.pages.length > 0);
    assert.ok(artifact.data.pages[0].frames.length > 0);
  });
});

suite('Stylesheet Resolver Tests', function() {
  let originalGetConfiguration;
  let originalGetWorkspaceFolder;
  let originalExtensionPath;
  let cleanupDirs = [];

  function sandbox(relativeStylePath) {
    const rel = relativeStylePath || path.join('styles', 'custom.css');
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'markprint-styles-'));
    cleanupDirs.push(root);
    const workspaceDir = path.join(root, 'workspace');
    const docDir = path.join(workspaceDir, 'docs');
    const extensionDir = path.join(root, 'extension');
    fs.mkdirSync(docDir, { recursive: true });
    fs.mkdirSync(extensionDir, { recursive: true });
    const docPath = path.join(docDir, 'test.md');
    fs.writeFileSync(docPath, '# Test');
    return { root, workspaceDir, docDir, extensionDir, docPath, rel };
  }

  function stubMarkprintConfig(options) {
    vscode.workspace.getConfiguration = () => ({
      stylesRelativePathFile: options.stylesRelativePathFile
    });
  }

  function stubWorkspaceFolder(dir) {
    vscode.workspace.getWorkspaceFolder = () => ({
      uri: vscode.Uri.file(dir)
    });
  }

  function writeStyle(targetDir, rel, contents) {
    const filePath = path.join(targetDir, rel);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents || 'body{}');
    return filePath;
  }

  setup(function() {
    originalGetConfiguration = vscode.workspace.getConfiguration;
    originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
    originalExtensionPath = process.env.MARKPRINT_EXTENSION_PATH;
    cleanupDirs = [];
  });

  teardown(function() {
    vscode.workspace.getConfiguration = originalGetConfiguration;
    vscode.workspace.getWorkspaceFolder = originalGetWorkspaceFolder;
    process.env.MARKPRINT_EXTENSION_PATH = originalExtensionPath;
    cleanupDirs.forEach(dir => {
      try {
        fs.rmSync(dir, { recursive: true, force: true });
      } catch (error) {
        console.warn('Failed to clean sandbox', dir, error.message);
      }
    });
  });

  test('Prefers document styles before workspace and extension', function() {
    const env = sandbox();
    stubWorkspaceFolder(env.workspaceDir);
    stubMarkprintConfig({ stylesRelativePathFile: true });
    process.env.MARKPRINT_EXTENSION_PATH = env.extensionDir;
    writeStyle(env.docDir, env.rel, 'body{color: red;}');
    writeStyle(env.workspaceDir, env.rel, 'body{color: blue;}');
    writeStyle(env.extensionDir, env.rel, 'body{color: green;}');

    const uri = vscode.Uri.file(env.docPath);
    const result = resolveStylesheetHref(env.rel, env.rel, uri);

    assert.strictEqual(result.origin, 'document');
    assert.ok(result.resolvedPath.endsWith(env.rel));
  });

  test('Falls back to workspace styles when document entry missing', function() {
    const env = sandbox();
    stubWorkspaceFolder(env.workspaceDir);
    stubMarkprintConfig({ stylesRelativePathFile: true });
    process.env.MARKPRINT_EXTENSION_PATH = env.extensionDir;
    writeStyle(env.workspaceDir, env.rel, 'body{color: blue;}');

    const uri = vscode.Uri.file(env.docPath);
    const result = resolveStylesheetHref(env.rel, env.rel, uri);

    assert.strictEqual(result.origin, 'workspace');
  });

  test('Falls back to extension styles last', function() {
    const env = sandbox();
    stubWorkspaceFolder(env.workspaceDir);
    stubMarkprintConfig({ stylesRelativePathFile: true });
    process.env.MARKPRINT_EXTENSION_PATH = env.extensionDir;
    writeStyle(env.extensionDir, env.rel, 'body{color: green;}');

    const uri = vscode.Uri.file(env.docPath);
    const result = resolveStylesheetHref(env.rel, env.rel, uri);

    assert.strictEqual(result.origin, 'extension');
  });

  test('Throws helpful error when stylesheet missing', function() {
    const env = sandbox();
    stubWorkspaceFolder(env.workspaceDir);
    stubMarkprintConfig({ stylesRelativePathFile: true });
    process.env.MARKPRINT_EXTENSION_PATH = env.extensionDir;

    const uri = vscode.Uri.file(env.docPath);
    assert.throws(
      () => resolveStylesheetHref(env.rel, env.rel, uri),
      /Stylesheet not found/
    );
  });
});
