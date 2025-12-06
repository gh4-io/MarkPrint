'use strict';

const vscode = require('vscode');

function isEnabled() {
  try {
    return Boolean(vscode.workspace.getConfiguration('markprint')['debug']);
  } catch (error) {
    return false;
  }
}

function log(category, message, details) {
  if (!isEnabled()) {
    return;
  }

  if (details !== undefined) {
    console.log(`[MarkPrint][${category}] ${message}`, details);
  } else {
    console.log(`[MarkPrint][${category}] ${message}`);
  }
}

function describeSetting(section, key) {
  try {
    const config = vscode.workspace.getConfiguration(section);
    const inspected = config.inspect(key);
    const value = config.get(key);

    if (!inspected) {
      return { key, section, value, source: 'unknown' };
    }

    if (inspected.workspaceFolderValue !== undefined) {
      return { key, section, value: inspected.workspaceFolderValue, source: 'workspaceFolder' };
    }
    if (inspected.workspaceValue !== undefined) {
      return { key, section, value: inspected.workspaceValue, source: 'workspace' };
    }
    if (inspected.globalValue !== undefined) {
      return { key, section, value: inspected.globalValue, source: 'user' };
    }

    return { key, section, value: inspected.defaultValue, source: 'default' };
  } catch (error) {
    return { key, section, value: undefined, source: 'error', error: error.message };
  }
}

module.exports = {
  isEnabled,
  log,
  describeSetting
};
