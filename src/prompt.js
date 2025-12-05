'use strict';

const vscode = require('vscode');

async function confirmContinueCancel(message, detail, options = {}) {
  const proceedLabel = options.proceedLabel || 'Continue';
  const cancelLabel = options.cancelLabel || 'Cancel';
  const modal = options.modal !== undefined ? options.modal : true;
  const result = await vscode.window.showWarningMessage(
    message,
    { modal, detail },
    proceedLabel,
    cancelLabel
  );
  return result === proceedLabel;
}

module.exports = {
  confirmContinueCancel
};
