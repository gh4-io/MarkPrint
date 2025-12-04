'use strict';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

const ALWAYS_SCALAR_FIELDS = new Set([
  'category',
  'catagory', // retain misspelling just in case metadata uses it
  'title',
  'owner',
  'approver',
  'effective_date',
  'status',
  'amos_version',
  'department',
  'revision',
  'pipeline_profile'
]);

/**
 * Schema Validator
 * Validates document front matter against template schemas
 */
class SchemaValidator {
  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      coerceTypes: true,
      strict: false
    });
    addFormats(this.ajv);
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('markprint');
  }

  /**
   * Validate document against template schema
   * @param {vscode.TextDocument} document
   * @param {Object} template
   * @returns {boolean} true if valid
   */
  async validateDocument(document, template) {
    // Clear previous diagnostics for this document
    this.diagnosticCollection.delete(document.uri);

    if (!template || !template.schema) {
      // No schema specified, skip validation
      return true;
    }

    // Extract front matter
    let frontMatter = this.extractFrontMatter(document);
    if (!frontMatter) {
      this.addError(document, 0, 'No front matter found in document');
      return false;
    }

    // Load schema
    const schema = await this.loadSchema(template.schema, template._workspaceFolder);
    if (!schema) {
      this.addError(document, 0, `Schema not found: ${template.schema}`);
      return false;
    }

    const relaxedSchema = this.relaxSchema(schema);

    // Normalize front matter before validation
    frontMatter = this.normalizeFrontMatter(frontMatter, schema);

    // Validate
    const validate = this.ajv.compile(relaxedSchema);
    const valid = validate(frontMatter);

    if (!valid) {
      this.reportValidationErrors(document, validate.errors);
      return false;
    }

    return true;
  }

  /**
   * Normalize front matter to match schema expectations
   * Coerces types, handles nulls, provides defaults
   */
  normalizeFrontMatter(data, schema) {
    if (!schema.properties) {
      return data;
    }

    const normalized = { ...data };

    for (const [key, propSchema] of Object.entries(schema.properties)) {
      if (!(key in normalized)) {
        continue;
      }

      const value = normalized[key];

      if (value === null || value === undefined || value === '') {
        normalized[key] = null;
        continue;
      }

      if (Array.isArray(value)) {
        if (ALWAYS_SCALAR_FIELDS.has(key)) {
          normalized[key] = this.normalizeScalarValue(key, value.length ? value[0] : null, propSchema);
        } else {
          normalized[key] = value.map(entry => this.normalizeScalarValue(key, entry, propSchema));
        }
        continue;
      }

      normalized[key] = this.normalizeScalarValue(key, value, propSchema);
    }

    return normalized;
  }

  normalizeScalarValue(key, value, propSchema) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (key === 'revision') {
      return this.normalizeRevision(value);
    }

    if (propSchema.enum) {
      return this.normalizeEnumValue(value, propSchema.enum);
    }

    if (propSchema.format === 'date') {
      return this.normalizeDate(value);
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }

    return this.toStringValue(value);
  }

  /**
   * Normalize date to YYYY-MM-DD format
   */
  normalizeDate(value) {
    if (!value) {
      return null;
    }

    const str = this.toStringValue(value);

    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return str;
  }

  normalizeRevision(value) {
    if (value === null || value === undefined) {
      return null;
    }

    return this.toStringValue(value);
  }

  normalizeEnumValue(value, allowedValues) {
    const str = this.toStringValue(value);
    const match = allowedValues.find(option => option.toUpperCase() === str.toUpperCase());
    return match || str;
  }

  toStringValue(value) {
    if (value === null || value === undefined) {
      return null;
    }

    return String(value).trim();
  }

  /**
   * Load JSON schema from file
   */
  async loadSchema(schemaPath, workspaceFolder) {
    try {
      // Resolve schema path (could be relative to workspace or absolute)
      let fullPath;

      if (path.isAbsolute(schemaPath)) {
        fullPath = schemaPath;
      } else if (workspaceFolder) {
        fullPath = path.join(workspaceFolder, schemaPath);
      } else {
        // Try workspace folders
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
          fullPath = path.join(workspaceFolders[0].uri.fsPath, schemaPath);
        } else {
          console.error('No workspace folder available for schema resolution');
          return null;
        }
      }

      console.log('Schema resolution:', {
        schemaPath,
        workspaceFolder,
        fullPath,
        exists: fs.existsSync(fullPath)
      });

      if (!fs.existsSync(fullPath)) {
        console.error('Schema file not found:', fullPath);
        return null;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load schema:', error);
      return null;
    }
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
   * Report validation errors to Problems panel
   */
  reportValidationErrors(document, errors) {
    const diagnostics = [];

    for (const error of errors) {
      const diagnostic = this.createDiagnostic(document, error);
      if (diagnostic) {
        diagnostics.push(diagnostic);
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);

    // Show notification
    const action = 'Open Metadata';
    vscode.window.showErrorMessage(
      `Template validation failed: ${errors.length} error(s) found`,
      action
    ).then(selection => {
      if (selection === action) {
        this.openMetadata(document);
      }
    });
  }

  /**
   * Create diagnostic from AJV error
   */
  createDiagnostic(document, error) {
    const text = document.getText();
    const grayMatter = require('gray-matter');

    try {
      const matter = grayMatter(text);

      // Find the line number of the front matter error
      // For now, point to the start of front matter
      // In future, can parse YAML structure to find exact line
      const frontMatterEnd = text.indexOf('---', 3);
      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(frontMatterEnd > 0 ? frontMatterEnd : 100)
      );

      let message = this.formatAjvError(error);

      const diagnostic = new vscode.Diagnostic(
        range,
        message,
        vscode.DiagnosticSeverity.Error
      );

      diagnostic.source = 'MarkPrint Template Validation';
      return diagnostic;
    } catch (err) {
      console.error('Failed to create diagnostic:', err);
      return null;
    }
  }

  /**
   * Format AJV error message
   */
  formatAjvError(error) {
    const field = error.instancePath ? error.instancePath.replace(/^\//, '') : 'root';

    switch (error.keyword) {
      case 'required':
        return `Missing required field: ${error.params.missingProperty}`;
      case 'type':
        return `Field '${field}' should be ${error.params.type}`;
      case 'enum':
        return `Field '${field}' should be one of: ${error.params.allowedValues.join(', ')}`;
      case 'format':
        return `Field '${field}' has invalid format (expected: ${error.params.format})`;
      default:
        return `${field}: ${error.message}`;
    }
  }

  /**
   * Open document and focus on metadata
   */
  async openMetadata(document) {
    const editor = await vscode.window.showTextDocument(document);

    // Move cursor to start of document (front matter)
    const position = new vscode.Position(0, 0);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.AtTop
    );
  }

  /**
   * Add error diagnostic
   */
  addError(document, line, message) {
    const range = new vscode.Range(line, 0, line, 100);
    const diagnostic = new vscode.Diagnostic(
      range,
      message,
      vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = 'MarkPrint';
    this.diagnosticCollection.set(document.uri, [diagnostic]);
  }

  /**
   * Clear diagnostics for document
   */
  clearDiagnostics(document) {
    this.diagnosticCollection.delete(document.uri);
  }

  /**
   * Clear all diagnostics
   */
  clearAll() {
    this.diagnosticCollection.clear();
  }

  relaxSchema(schema) {
    const relaxed = this.cloneSchema(schema);
    delete relaxed.required;

    if (relaxed.properties) {
      for (const [key, propSchema] of Object.entries(relaxed.properties)) {
        relaxed.properties[key] = this.buildFlexiblePropertySchema(key, propSchema);
      }
    }

    return relaxed;
  }

  buildFlexiblePropertySchema(key, propSchema) {
    const baseSchema = this.cloneSchema(propSchema);

    if (key === 'revision') {
      baseSchema.type = 'string';
      delete baseSchema.pattern;
    }

    const variants = [baseSchema];

    if (!ALWAYS_SCALAR_FIELDS.has(key)) {
      variants.push({
        type: 'array',
        items: this.cloneSchema(baseSchema)
      });
    }

    variants.push({ type: 'null' });

    if (variants.length === 1) {
      return baseSchema;
    }

    return { anyOf: variants };
  }

  cloneSchema(value) {
    return value ? JSON.parse(JSON.stringify(value)) : value;
  }

  /**
   * Dispose
   */
  dispose() {
    this.diagnosticCollection.dispose();
  }
}

module.exports = SchemaValidator;
