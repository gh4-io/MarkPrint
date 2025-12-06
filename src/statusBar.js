'use strict';

const vscode = require('vscode');

/**
 * Status Bar Manager
 * Displays current build mode and active template
 */
class StatusBarManager {
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.templateStatusItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      99
    );
    this.currentTemplate = null;
    this.buildMode = 'manual';
    this.templateWarning = null;
  }

  /**
   * Initialize and show status bar
   */
  initialize() {
    this.updateBuildMode();
    this.statusBarItem.show();
    this.templateStatusItem.command = 'markprint.selectTemplate';
    this.templateStatusItem.show();
    this.updateTemplateDisplay();
  }

  /**
   * Update build mode from configuration
   */
  updateBuildMode() {
    const config = vscode.workspace.getConfiguration('markprint');
    this.buildMode = config.get('buildMode', 'manual');
    this.updateDisplay();
  }

  /**
   * Set current template
   */
  setTemplate(template) {
    this.currentTemplate = template;
    this.updateDisplay();
    this.templateWarning = null;
    this.updateTemplateDisplay();
  }

  /**
   * Clear current template
   */
  clearTemplate() {
    this.currentTemplate = null;
    this.updateDisplay();
    this.templateWarning = null;
    this.updateTemplateDisplay();
  }

  /**
   * Update status bar display
   */
  updateDisplay() {
    const modeIcon = this.getModeIcon(this.buildMode);
    const modeText = this.buildMode.toUpperCase();

    let text = `${modeIcon} MarkPrint: ${modeText}`;

    if (this.currentTemplate) {
      text += ` | ${this.currentTemplate.label}`;
    }

    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = this.getTooltip();
    this.statusBarItem.command = 'markprint.changeBuildMode';
  }

  /**
   * Update template status bar display
   */
  updateTemplateDisplay() {
    if (!this.templateStatusItem) {
      return;
    }

    if (this.templateWarning) {
      this.templateStatusItem.text = `$(warning) ${this.templateWarning.label}`;
      this.templateStatusItem.tooltip = this.templateWarning.tooltip;
      return;
    }

    if (this.currentTemplate) {
      this.templateStatusItem.text = `$(file-code) ${this.currentTemplate.label}`;
      this.templateStatusItem.tooltip = `Active pipeline profile\n${this.currentTemplate.label} (v${this.currentTemplate.version})\nClick to change profile`;
      return;
    }

    this.templateStatusItem.text = '$(file-code) Select template';
    this.templateStatusItem.tooltip = 'No pipeline profile selected. Click to choose a template.';
  }

  /**
   * Get icon for build mode
   */
  getModeIcon(mode) {
    switch (mode) {
      case 'auto':
        return '$(sync)';
      case 'manual':
        return '$(gear)';
      case 'hybrid':
        return '$(eye)';
      default:
        return '$(file-pdf)';
    }
  }

  /**
   * Get tooltip text
   */
  getTooltip() {
    let tooltip = `Build Mode: ${this.buildMode}\n`;

    switch (this.buildMode) {
      case 'auto':
        tooltip += 'Full export on save';
        break;
      case 'manual':
        tooltip += 'Export via commands only';
        break;
      case 'hybrid':
        tooltip += 'Lightweight preview on save, full export via commands';
        break;
    }

    if (this.currentTemplate) {
      tooltip += `\n\nActive Template: ${this.currentTemplate.label} (v${this.currentTemplate.version})`;
    }

    tooltip += '\n\nClick to change build mode';

    return tooltip;
  }

  /**
   * Indicate that user action is required to pick a template
   */
  showTemplateWarning(message) {
    this.templateWarning = {
      label: 'Select pipeline profile',
      tooltip: message || 'Pipeline profile required. Click to pick a template.'
    };
    this.updateTemplateDisplay();
  }

  /**
   * Clear template warning indicator
   */
  clearTemplateWarning() {
    this.templateWarning = null;
    this.updateTemplateDisplay();
  }

  /**
   * Show build mode picker
   */
  async showBuildModePicker() {
    const items = [
      {
        label: '$(gear) Manual',
        description: 'Export via commands only',
        mode: 'manual'
      },
      {
        label: '$(sync) Auto',
        description: 'Full export on save',
        mode: 'auto'
      },
      {
        label: '$(eye) Hybrid',
        description: 'Lightweight preview on save, full export via commands',
        mode: 'hybrid'
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select build mode',
      ignoreFocusOut: true
    });

    if (selected) {
      const config = vscode.workspace.getConfiguration('markprint');
      await config.update('buildMode', selected.mode, vscode.ConfigurationTarget.Workspace);
      this.buildMode = selected.mode;
      this.updateDisplay();
      vscode.window.showInformationMessage(`Build mode changed to: ${selected.mode}`);
    }
  }

  /**
   * Dispose status bar item
   */
  dispose() {
    this.statusBarItem.dispose();
    if (this.templateStatusItem) {
      this.templateStatusItem.dispose();
    }
  }
}

module.exports = StatusBarManager;
