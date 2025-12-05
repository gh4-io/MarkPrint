'use strict';

const os = require('os');
const path = require('path');
const vscode = require('vscode');

function resolveSettingPath(value, resource) {
  if (!value || typeof value !== 'string') {
    return value;
  }
  let resolved = value;
  const workspaceFolders = vscode.workspace.workspaceFolders || [];
  const folderForResource = resource ? vscode.workspace.getWorkspaceFolder(resource) : null;
  const defaultFolder = folderForResource || (workspaceFolders.length > 0 ? workspaceFolders[0] : null);

  resolved = resolved.replace(/\$\{workspaceFolder(?::([^}]+))?\}/g, function (match, folderName) {
    let target = defaultFolder;
    if (folderName && workspaceFolders.length > 0) {
      target = workspaceFolders.find(f => f.name === folderName) || target;
    }
    return target ? target.uri.fsPath : '';
  });

  resolved = resolved.replace(/\$\{workspaceFolderBasename(?::([^}]+))?\}/g, function (match, folderName) {
    let target = defaultFolder;
    if (folderName && workspaceFolders.length > 0) {
      target = workspaceFolders.find(f => f.name === folderName) || target;
    }
    return target ? path.basename(target.uri.fsPath) : '';
  });

  const extensionPath = process.env.MARKPRINT_EXTENSION_PATH || path.join(__dirname, '..');

  resolved = resolved.replace(/\$\{extensionPath\}/g, extensionPath);
  resolved = resolved.replace(/\$\{home\}/gi, os.homedir());

  resolved = resolved.replace(/\$\{env:([^}]+)\}/g, function (match, envName) {
    return process.env[envName] || '';
  });

  if (resolved.indexOf('~') === 0) {
    resolved = resolved.replace(/^~/, os.homedir());
  }

  return resolved;
}

module.exports = {
  resolveSettingPath
};
