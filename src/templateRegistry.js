'use strict';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const debugLogger = require('./debugLogger');

/**
 * Template Registry
 * Manages loading, validation, and selection of MarkPrint templates
 */
class TemplateRegistry {
  constructor(context) {
    this.context = context;
    this.templates = new Map();
    this.bundledTemplatesPath = path.join(context.extensionPath, 'templates');
    this.workspaceTemplatesPath = '.markprint/templates';
  }

  /**
   * Initialize registry by loading all templates
   */
  async initialize() {
    await this.loadBundledTemplates();
    await this.loadWorkspaceTemplates();
    this.resolveInheritanceForAll();
  }

  /**
   * Load bundled default templates from extension
   */
  async loadBundledTemplates() {
    if (!fs.existsSync(this.bundledTemplatesPath)) {
      return;
    }

    const files = fs.readdirSync(this.bundledTemplatesPath);
    for (const file of files) {
      if (file.endsWith('.json') || file.endsWith('.xml')) {
        const templatePath = path.join(this.bundledTemplatesPath, file);
        try {
          const template = await this.loadTemplate(templatePath);
          if (template) {
            template._source = 'bundled';
            this.templates.set(template.id, template);
            debugLogger.log('template', 'Loaded bundled template', {
              templateId: template.id,
              file: templatePath,
              resources: template.resources || {}
            });
          }
        } catch (error) {
          console.error(`Failed to load bundled template ${file}:`, error);
        }
      }
    }
  }

  /**
   * Load workspace-specific templates
   */
  async loadWorkspaceTemplates() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    for (const folder of workspaceFolders) {
      const templatesDir = path.join(folder.uri.fsPath, this.workspaceTemplatesPath);
      if (!fs.existsSync(templatesDir)) {
        continue;
      }

      const files = fs.readdirSync(templatesDir);
      for (const file of files) {
        if (file.endsWith('.json') || file.endsWith('.xml')) {
          const templatePath = path.join(templatesDir, file);
          try {
            const template = await this.loadTemplate(templatePath);
            if (template) {
              template._source = 'workspace';
              template._workspaceFolder = folder.uri.fsPath;
              this.templates.set(template.id, template);
              debugLogger.log('template', 'Loaded workspace template', {
                templateId: template.id,
                file: templatePath,
                workspaceFolder: folder.uri.fsPath,
                resources: template.resources || {}
              });
            }
          } catch (error) {
            console.error(`Failed to load workspace template ${file}:`, error);
          }
        }
      }
    }
  }

  /**
   * Load and parse a single template file
   */
  async loadTemplate(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath).toLowerCase();

    let template;
    if (ext === '.json') {
      template = JSON.parse(content);
    } else if (ext === '.xml') {
      template = this.parseXmlTemplate(content);
    } else {
      throw new Error(`Unsupported template format: ${ext}`);
    }

    // Validate required fields
    if (!template.id || !template.label || !template.version) {
      throw new Error('Template missing required fields: id, label, version');
    }

    return template;
  }

  /**
   * Parse XML template to JSON structure
   */
  parseXmlTemplate(xmlContent) {
    // Basic XML parsing - for Phase 1, support simple structure
    // In future phases, use a proper XML parser like fast-xml-parser
    const idMatch = xmlContent.match(/<id>(.*?)<\/id>/);
    const labelMatch = xmlContent.match(/<label>(.*?)<\/label>/);
    const versionMatch = xmlContent.match(/<version>(.*?)<\/version>/);
    const extendsMatch = xmlContent.match(/<extends>(.*?)<\/extends>/);
    const rendererMatch = xmlContent.match(/<renderer>(.*?)<\/renderer>/);

    if (!idMatch || !labelMatch || !versionMatch) {
      throw new Error('XML template missing required fields');
    }

    return {
      id: idMatch[1],
      label: labelMatch[1],
      version: versionMatch[1],
      extends: extendsMatch ? extendsMatch[1] : null,
      renderer: rendererMatch ? rendererMatch[1] : 'chromium',
      // Additional fields would be parsed here
    };
  }

  /**
   * Resolve template inheritance (extends)
   */
  resolveInheritanceForAll() {
    const resolved = new Set();
    const resolving = new Set();

    const resolveTemplate = (template) => {
      if (resolved.has(template.id)) {
        return template;
      }
      if (resolving.has(template.id)) {
        throw new Error(`Circular template inheritance detected: ${template.id}`);
      }

      resolving.add(template.id);

      let merged = template;
      if (template.extends) {
        const parent = this.templates.get(template.extends);
        if (!parent) {
          throw new Error(`Parent template not found: ${template.extends}`);
        }
        const resolvedParent = resolveTemplate(parent);
        merged = this.mergeTemplates(resolvedParent, template);
        this.templates.set(template.id, merged);
      }

      resolving.delete(template.id);
      resolved.add(template.id);
      return merged;
    };

    for (const template of Array.from(this.templates.values())) {
      try {
        resolveTemplate(template);
      } catch (error) {
        console.error(`Failed to resolve template inheritance for ${template.id}:`, error);
      }
    }
  }

  /**
   * Deep merge two templates
   */
  mergeTemplates(parent, child) {
    const merged = JSON.parse(JSON.stringify(parent)); // Deep clone

    for (const key in child) {
      if (key === 'extends') continue; // Don't copy extends field

      if (typeof child[key] === 'object' && !Array.isArray(child[key])) {
        merged[key] = this.mergeTemplates(merged[key] || {}, child[key]);
      } else {
        merged[key] = child[key];
      }
    }

    return merged;
  }

  /**
   * Get template by ID
   */
  getTemplate(id) {
    return this.templates.get(id);
  }

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return Array.from(this.templates.values());
  }

  /**
   * Get template for current document
   * Checks front matter, then workspace state, then prompts user
   */
  async getTemplateForDocument(document, workspaceState) {
    // Check front matter for layout_template
    const frontMatter = this.extractFrontMatter(document);
    if (frontMatter && frontMatter.layout_template) {
      const template = this.getTemplate(frontMatter.layout_template);
      if (template) {
        this.logTemplateSelection(document, template, 'frontMatter', { layout_template: frontMatter.layout_template });
        return template;
      }
    }

    // Check workspace state for last selection
    const lastTemplateId = workspaceState.get(`markprint.lastTemplate.${document.uri.fsPath}`);
    if (lastTemplateId) {
      const template = this.getTemplate(lastTemplateId);
      if (template) {
        this.logTemplateSelection(document, template, 'workspaceState', { lastTemplateId });
        return template;
      }
    }

    // Prompt user to select template
    return await this.promptTemplateSelection(document, workspaceState);
  }

  /**
   * Extract YAML front matter from document
   */
  extractFrontMatter(document) {
    const grayMatter = require('gray-matter');
    const text = document.getText();
    try {
      const matter = grayMatter(text);
      return matter.data;
    } catch (error) {
      console.error('Failed to parse front matter:', error);
      return null;
    }
  }

  /**
   * Prompt user to select a template
   */
  async promptTemplateSelection(document, workspaceState) {
    const templates = this.getAllTemplates();
    if (templates.length === 0) {
      vscode.window.showWarningMessage('No templates available');
      return null;
    }

    const items = templates.map(t => ({
      label: t.label,
      description: `v${t.version} (${t._source})`,
      detail: t.description || t.id,
      template: t
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a template for this document',
      ignoreFocusOut: true
    });

    if (!selected) {
      return null;
    }

    // Store selection in workspace state
    await workspaceState.update(`markprint.lastTemplate.${document.uri.fsPath}`, selected.template.id);

    // Offer to insert metadata
    const insertMetadata = await vscode.window.showInformationMessage(
      'Would you like to insert template metadata into the document?',
      'Yes', 'No'
    );

    if (insertMetadata === 'Yes') {
      await this.insertTemplateMetadata(document, selected.template);
    }

    this.logTemplateSelection(document, selected.template, 'quickPick', {
      description: selected.template.description || '',
      version: selected.template.version
    });

    return selected.template;
  }

  /**
   * Insert template metadata into document front matter
   */
  async insertTemplateMetadata(document, template) {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document !== document) {
      return;
    }

    const text = document.getText();
    const grayMatter = require('gray-matter');
    let matter = grayMatter(text);

    // Add layout_template to front matter
    matter.data.layout_template = template.id;

    // Rebuild document with updated front matter
    const newContent = grayMatter.stringify(matter.content, matter.data);

    await editor.edit(editBuilder => {
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );
      editBuilder.replace(fullRange, newContent);
    });
  }

  /**
   * Reload all templates
   */
  async reload() {
    this.templates.clear();
    await this.initialize();
  }

  logTemplateSelection(document, template, source, extra = {}) {
    if (!template) {
      return;
    }

    debugLogger.log('template', `Using template '${template.id}'`, {
      document: document.uri.fsPath,
      selectionSource: source,
      templateId: template.id,
      templateLabel: template.label,
      templateVersion: template.version,
      templateSource: template._source,
      schema: template.schema || 'none',
      resources: template.resources || {},
      metadata: extra
    });
  }
}

module.exports = TemplateRegistry;
