'use strict';

const fs = require('fs');
const path = require('path');
const vscode = require('vscode');

function resolveStylesheetHref(originalValue, expandedValue, resource) {
  if (!expandedValue) {
    throw new Error(`Stylesheet entry "${originalValue}" resolved to an empty path.`);
  }

  const tried = [];
  const markprintConfig = vscode.workspace.getConfiguration('markprint');
  const stylesRelativePathFile = markprintConfig ? markprintConfig['stylesRelativePathFile'] : true;
  const workspaceFolder = resource
    ? vscode.workspace.getWorkspaceFolder(resource)
    : (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
        ? vscode.workspace.workspaceFolders[0]
        : null);
  const documentDir = resource && resource.fsPath ? path.dirname(resource.fsPath) : null;
  const extensionRoot = process.env.MARKPRINT_EXTENSION_PATH || path.join(__dirname, '..');

  const addCandidate = (label, candidatePath) => {
    if (!candidatePath) {
      return null;
    }
    const normalized = path.normalize(candidatePath);
    tried.push(`${label}:${normalized}`);
    if (fs.existsSync(normalized)) {
      return {
        href: vscode.Uri.file(normalized).toString(),
        resolvedPath: normalized,
        origin: label,
        tried: tried.slice()
      };
    }
    return null;
  };

  const urlMatch = expandedValue.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/);
  if (!path.isAbsolute(expandedValue) && urlMatch && !expandedValue.startsWith('file:')) {
    const parsed = vscode.Uri.parse(expandedValue);
    return {
      href: parsed.toString(),
      resolvedPath: null,
      origin: parsed.scheme || 'url',
      tried: tried.slice()
    };
  }

  if (expandedValue.startsWith('file:')) {
    const parsed = vscode.Uri.parse(expandedValue);
    const fsPath = parsed.fsPath;
    if (!fs.existsSync(fsPath)) {
      tried.push(`file:${fsPath}`);
      throw new Error(
        `Stylesheet not found for "${originalValue}". File URI resolved to "${fsPath}" but it does not exist.`
      );
    }
    return {
      href: parsed.toString(),
      resolvedPath: fsPath,
      origin: 'file-uri',
      tried: tried.slice()
    };
  }

  if (path.isAbsolute(expandedValue)) {
    const match = addCandidate('absolute', expandedValue);
    if (match) {
      return match;
    }
  } else {
    if (stylesRelativePathFile !== false && documentDir) {
      const docMatch = addCandidate('document', path.join(documentDir, expandedValue));
      if (docMatch) {
        return docMatch;
      }
    }
    if (workspaceFolder) {
      const workspaceMatch = addCandidate('workspace', path.join(workspaceFolder.uri.fsPath, expandedValue));
      if (workspaceMatch) {
        return workspaceMatch;
      }
    }
    if (stylesRelativePathFile === false && documentDir) {
      const docFallback = addCandidate('document', path.join(documentDir, expandedValue));
      if (docFallback) {
        return docFallback;
      }
    }
  }

  const extensionMatch = addCandidate('extension', path.join(extensionRoot, expandedValue));
  if (extensionMatch) {
    return extensionMatch;
  }

  throw new Error(
    `Stylesheet not found for markprint.styles entry "${originalValue}". ` +
    `Resolved value "${expandedValue}" (${path.isAbsolute(expandedValue) ? 'absolute' : 'relative'}). ` +
    `Checked: ${tried.join('; ')}`
  );
}

module.exports = {
  resolveStylesheetHref
};
