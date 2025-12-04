'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const testWorkspace = path.join(repoRoot, 'test', '.test-workspace');
const templateSrc = path.join(repoRoot, 'templates', 'standard-letter.json');
const schemaSrc = path.join(repoRoot, '.markprint', 'schemas', 'standard-letter.schema.json');
const sopSrc = path.join(repoRoot, '.plan', 'ref', 'SOP-200_Create_Workackage_Sequencing_Type.md');

const templateDest = path.join(testWorkspace, '.markprint', 'templates', path.basename(templateSrc));
const schemaDest = path.join(testWorkspace, '.markprint', 'schemas', path.basename(schemaSrc));
const sopDest = path.join(testWorkspace, path.basename(sopSrc));

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    throw new Error(`Source not found: ${src}`);
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function main() {
  ensureDir(testWorkspace);
  copyFile(templateSrc, templateDest);
  copyFile(schemaSrc, schemaDest);
  copyFile(sopSrc, sopDest);

  console.log('Test workspace prepared at', testWorkspace);
}

try {
  main();
} catch (error) {
  console.error('Failed to prepare test workspace:', error.message);
  process.exit(1);
}
