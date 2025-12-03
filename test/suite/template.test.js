const assert = require('assert');
const path = require('path');
const fs = require('fs');
const vscode = require('vscode');

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
