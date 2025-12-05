'use strict';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const debugLogger = require('./debugLogger');
const { resolveSettingPath } = require('./pathResolver');
const { confirmContinueCancel } = require('./prompt');
const LayoutLoader = require('./layoutLoader');

const BUILT_IN_DEFAULT_TEMPLATE_ID = 'standard-letter';

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
    this.layoutLoader = new LayoutLoader({ extensionPath: context.extensionPath });
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
        const template = await this.loadTemplate(templatePath, {
          manifestDir: path.dirname(templatePath)
        });
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
          const template = await this.loadTemplate(templatePath, {
            manifestDir: path.dirname(templatePath),
            workspaceFolder: folder.uri.fsPath
          });
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
  async loadTemplate(filePath, options = {}) {
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

    if (template.profile) {
      template = this.flattenProfileManifest(template);
    }

    // Validate required fields
    if (!template.id || !template.label || !template.version) {
      throw new Error('Template missing required fields: id, label, version');
    }

    template.renderer = this.normalizeRenderer(template.renderer);
    template.layoutDescriptor = template.layoutDescriptor || null;
    await this.resolveLayoutArtifact(template, {
      manifestDir: options.manifestDir || path.dirname(filePath),
      workspaceFolder: options.workspaceFolder
    });

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

  flattenProfileManifest(manifest) {
    const profile = manifest.profile || {};
    const flattened = {
      id: profile.id,
      label: profile.label,
      version: profile.version,
      description: profile.description || manifest.description,
      category: profile.category || manifest.category,
      schema: profile.schema || manifest.schema,
      extends: profile.extends || manifest.extends || null,
      renderer: profile.renderer || manifest.renderer || 'chromium',
      outputs: profile.outputs || manifest.outputs,
      buildMode: profile.buildMode || manifest.buildMode,
      logging: profile.logging || manifest.logging,
      resources: manifest.resources || profile.resources || {},
      artifactMappings: manifest.artifactMappings || profile.artifactMappings || {},
      layoutDescriptor: manifest.layout || profile.layout || null
    };

    return flattened;
  }

  normalizeRenderer(rendererValue) {
    if (!rendererValue) {
      return { engine: 'chromium', options: {} };
    }

    if (typeof rendererValue === 'string') {
      return { engine: rendererValue, options: {} };
    }

    return {
      engine: rendererValue.engine || 'chromium',
      options: rendererValue.options || {}
    };
  }

  async resolveLayoutArtifact(template, options = {}) {
    if (!this.layoutLoader) {
      return;
    }

    if (!template.layoutDescriptor) {
      if (template.layout) {
        template.layoutArtifact = {
          type: 'inline',
          source: null,
          descriptor: { type: 'inline' },
          data: template.layout
        };
      }
      return;
    }

    try {
      const artifact = await this.layoutLoader.load(template.layoutDescriptor, options);
      if (artifact) {
        template.layoutArtifact = artifact;
        template.layoutRendererHint =
          artifact.descriptor?.rendererHint ||
          template.layoutDescriptor.rendererHint ||
          artifact.rendererHint ||
          null;
        template.layout = artifact.data;
      }
    } catch (error) {
      debugLogger.log('template', 'Failed to resolve layout artifact', {
        templateId: template.id,
        source: template.layoutDescriptor && template.layoutDescriptor.source,
        error: error.message
      });
    }
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

  async resolveTemplateIdentifier(identifier, document) {
    if (!identifier || typeof identifier !== 'string') {
      return null;
    }

    const trimmed = identifier.trim();
    if (!trimmed) {
      return null;
    }

    if (this.templates.has(trimmed)) {
      return this.templates.get(trimmed);
    }

    if (!trimmed.includes('/') && !trimmed.includes('\\')) {
      const hyphenated = trimmed.replace(/_/g, '-');
      if (hyphenated !== trimmed && this.templates.has(hyphenated)) {
        return this.templates.get(hyphenated);
      }
    }

    return await this.resolveTemplateReference(trimmed, document);
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
    if (frontMatter) {
      if (frontMatter.pipeline_profile) {
        const requestedProfile = frontMatter.pipeline_profile;
        const template = await this.resolveTemplateIdentifier(requestedProfile, document);
        if (template) {
          this.logTemplateSelection(document, template, 'frontMatter', {
            pipeline_profile: requestedProfile
          });
          return template;
        }
        const fallback = await this.applyTemplateFallback(document, 'unresolvedFrontMatter', {
          requested: requestedProfile,
          field: 'pipeline_profile'
        });
        if (fallback) {
          return fallback;
        }
      }

      if (frontMatter.layout_template) {
        const frontMatterValue = frontMatter.layout_template;
        const template = await this.resolveTemplateIdentifier(frontMatterValue, document);
        if (template) {
          this.logTemplateSelection(document, template, 'frontMatter', {
            layout_template: frontMatterValue,
            field: 'layout_template'
          });
          return template;
        }
        const fallback = await this.applyTemplateFallback(document, 'unresolvedFrontMatter', {
          requested: frontMatterValue,
          field: 'layout_template'
        });
        if (fallback) {
          return fallback;
        }
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
      await workspaceState.update(`markprint.lastTemplate.${document.uri.fsPath}`, undefined);
      const fallback = await this.applyTemplateFallback(document, 'invalidWorkspaceState', {
        lastTemplateId
      });
      if (fallback) {
        return fallback;
      }
    }

    const fallbackTemplate = await this.applyTemplateFallback(document, 'missingTemplate');
    if (fallbackTemplate) {
      return fallbackTemplate;
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

    // Add pipeline_profile to front matter (canonical) and layout_template for backward compatibility
    matter.data.pipeline_profile = template.id;
    if (!matter.data.layout_template) {
      matter.data.layout_template = template.id;
    }

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

    const rendererInfo = template.renderer || { engine: 'chromium' };
    const layoutType =
      (template.layoutArtifact && template.layoutArtifact.type) ||
      (template.layoutDescriptor && template.layoutDescriptor.type) ||
      'inline';
    const rendererHint =
      template.layoutRendererHint ||
      (template.layoutDescriptor && template.layoutDescriptor.rendererHint) ||
      null;

    debugLogger.log('template', `Using pipeline profile '${template.id}'`, {
      document: document.uri.fsPath,
      selectionSource: source,
      templateId: template.id,
      templateLabel: template.label,
      templateVersion: template.version,
      templateSource: template._source,
      schema: template.schema || 'none',
      rendererEngine: rendererInfo.engine,
      rendererOptions: rendererInfo.options || {},
      layoutType,
      layoutRendererHint: rendererHint,
      resources: template.resources || {},
      metadata: extra
    });
  }

  async resolveTemplateReference(reference, document) {
    if (!reference || typeof reference !== 'string') {
      return null;
    }
    const trimmed = reference.trim();
    if (!trimmed) {
      return null;
    }
    if (this.templates.has(trimmed)) {
      return this.templates.get(trimmed);
    }

    const resolvedPath = resolveSettingPath(trimmed, document ? document.uri : null);
    if (!resolvedPath) {
      return null;
    }

    let candidatePath = resolvedPath;
    try {
      if (candidatePath.startsWith('file://')) {
        candidatePath = vscode.Uri.parse(candidatePath).fsPath;
      }
    } catch (error) {
      debugLogger.log('template', 'Failed to parse template URI reference', {
        reference,
        resolvedPath,
        error: error.message
      });
      return null;
    }

    if (!path.isAbsolute(candidatePath) && document && document.uri) {
      candidatePath = path.resolve(path.dirname(document.uri.fsPath), candidatePath);
    }

    if (!fs.existsSync(candidatePath)) {
      debugLogger.log('template', 'Resolved template path does not exist', {
        reference,
        candidatePath
      });
      return null;
    }

    try {
      const workspaceFolderPath = this.getWorkspaceFolderPath(document);
      const template = await this.loadTemplate(candidatePath, {
        manifestDir: path.dirname(candidatePath),
        workspaceFolder: workspaceFolderPath
      });
      if (template) {
        template._source = 'direct';
        template._workspaceFolder = workspaceFolderPath;
        this.templates.set(template.id, template);
        debugLogger.log('template', 'Loaded template via direct reference', {
          reference,
          candidatePath,
          templateId: template.id
        });
        return template;
      }
    } catch (error) {
      debugLogger.log('template', 'Failed to load template via reference', {
        reference,
        candidatePath,
        error: error.message
      });
    }
    return null;
  }

  getWorkspaceFolderPath(document) {
    if (!document || !document.uri) {
      return undefined;
    }
    const folder = vscode.workspace.getWorkspaceFolder(document.uri);
    return folder ? folder.uri.fsPath : undefined;
  }

  async applyTemplateFallback(document, reason, extra = {}) {
    const fallbackTemplate = await this.getDefaultTemplate(document);
    if (!fallbackTemplate) {
      debugLogger.log('template', 'Fallback requested but no default template available', {
        document: document.uri.fsPath,
        reason,
        extra
      });
      return null;
    }

    const config = vscode.workspace.getConfiguration('markprint');
    const fallbackMode = config ? (config['templateFallbackMode'] || 'prompt') : 'prompt';

    if (fallbackMode === 'disabled') {
      debugLogger.log('template', 'Template fallback disabled via settings', {
        document: document.uri.fsPath,
        reason,
        extra
      });
      return null;
    }

    if (fallbackMode === 'prompt') {
      let detail = `No template specified. Continue with ${fallbackTemplate.label}?`;
      if (extra.requested) {
        const fieldLabel = extra.field ? `${extra.field} ` : '';
        detail = `Requested ${fieldLabel}"${extra.requested}" could not be resolved. Continue with ${fallbackTemplate.label}?`;
      } else if (extra.lastTemplateId) {
        detail = `Last used template "${extra.lastTemplateId}" is unavailable. Continue with ${fallbackTemplate.label}?`;
      }
      const confirmed = await confirmContinueCancel(
        'Template fallback',
        detail,
        {
          proceedLabel: `Continue with ${fallbackTemplate.label}`,
          cancelLabel: 'Cancel export'
        }
      );
      if (!confirmed) {
        debugLogger.log('template', 'User cancelled template fallback', {
          document: document.uri.fsPath,
          reason,
          extra
        });
        return null;
      }
    }

    this.logTemplateSelection(document, fallbackTemplate, 'defaultFallback', {
      reason,
      fallbackMode,
      ...extra
    });
    return fallbackTemplate;
  }

  async getDefaultTemplate(document) {
    const config = vscode.workspace.getConfiguration('markprint');
    const configuredDefault = config ? config['defaultTemplate'] : undefined;
    const candidateIds = [];
    if (configuredDefault && typeof configuredDefault === 'string') {
      candidateIds.push(configuredDefault);
    }
    candidateIds.push(BUILT_IN_DEFAULT_TEMPLATE_ID);

    for (const candidateId of candidateIds) {
      if (!candidateId) {
        continue;
      }
      const template = this.templates.get(candidateId);
      if (template) {
        return template;
      }
      if (candidateId.includes('/') || candidateId.includes('\\') || candidateId.endsWith('.json') || candidateId.endsWith('.xml')) {
        const resolved = await this.resolveTemplateReference(candidateId, document);
        if (resolved) {
          return resolved;
        }
      }
    }

    const iterator = this.templates.values();
    const first = iterator.next();
    return first && !first.done ? first.value : null;
  }
}

module.exports = TemplateRegistry;
