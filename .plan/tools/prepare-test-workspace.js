'use strict';

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const testWorkspace = path.join(repoRoot, 'test', '.test-workspace');
const sopSrc = path.join(repoRoot, '.plan', 'ref', 'SOP-200_Create_Workackage_Sequencing_Type.md');
const stylesSrc = path.join(repoRoot, 'styles');
const vscodeConfigSrc = path.join(repoRoot, '.vscode');
const sopDest = path.join(testWorkspace, path.basename(sopSrc));
const stylesDest = path.join(testWorkspace, 'styles');
const vscodeConfigDest = path.join(testWorkspace, '.vscode');
const GENERATED_EXTENSIONS = new Set(['.html', '.pdf', '.png', '.jpeg', '.jpg']);

function removePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

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

function copyDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    return;
  }

  ensureDir(destDir);
  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    const destPath = path.join(destDir, entry);
    const stats = fs.statSync(srcPath);

    if (stats.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      ensureDir(path.dirname(destPath));
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanGeneratedFiles(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  for (const entry of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      cleanGeneratedFiles(fullPath);
      continue;
    }

    const ext = path.extname(entry).toLowerCase();
    if (GENERATED_EXTENSIONS.has(ext)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (error) {
        console.warn('Failed to remove generated file:', fullPath, error.message);
      }
    }
  }
}

function main() {
  const skipPrep =
    process.env.MARKPRINT_SKIP_TEST_WORKSPACE_PREP === '1' ||
    process.env.MARKPRINT_SKIP_TEST_WORKSPACE_PREP === 'true' ||
    fs.existsSync(path.join(testWorkspace, '.manual'));

  if (skipPrep) {
    console.log('Skipping test workspace preparation (manual override detected).');
    return;
  }

  ensureDir(testWorkspace);
  cleanGeneratedFiles(testWorkspace);
  console.log('[prepare-test-workspace] Removing workspace template overrides');
  removePath(path.join(testWorkspace, '.markprint', 'templates'));
  copyFile(sopSrc, sopDest);
  //console.log('[prepare-test-workspace] Mirroring styles directory');
  //copyDirectory(stylesSrc, stylesDest);
  console.log('[prepare-test-workspace] Mirroring .vscode directory');
  copyDirectory(vscodeConfigSrc, vscodeConfigDest);

  console.log('Test workspace prepared at', testWorkspace);
}

try {
  main();
} catch (error) {
  console.error('Failed to prepare test workspace:', error.message);
  process.exit(1);
}
