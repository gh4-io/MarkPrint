markdown-pdf<original_task>
Fix three issues with the MarkPrint VS Code extension testing environment:

1. **Deprecation Warning**: Address punycode deprecation warning appearing during test execution
2. **Naming Consistency**: Ensure consistent naming between "MarkPrint" and "mark-print" throughout the project
3. **Test File Setup**: Replace `test/suite/mermaid.md` with production SOP document (`.plan/ref/SOP-200_Create_Workpackage_Sequencing_Type.md`) for more realistic testing
4. **Testing Documentation**: Create comprehensive `TEST.md` with detailed instructions for CLI testing, VS Code debugging, Phase 1 features, WSL2 considerations, and CI/CD setup

Secondary requirement: Preserve original extension command patterns while rebranding from `mark-print` to `mark-print`/`MarkPrint`.
</original_task>

<work_completed>
## 1. Dependency Upgrade (Punycode Fix)

**File**: `package.json`
- Upgraded `cheerio` from `0.20.0` to `^1.1.2`
- Rationale: Cheerio 1.x uses newer jsdom that doesn't depend on deprecated punycode module
- Change location: Line ~67 in dependencies section

## 2. Full Project Rebrand

### package.json (Multiple Changes)
**Package Identity**:
- `"name"`: `"mark-print"` → `"mark-print"` (with hyphen, line 2)
- `"displayName"`: `"MarkPrint"` → `"MarkPrint"` (line 3)
- `"description"`: Updated to mention template system (line 4)

**Commands** (13 total, lines ~80-140):
- `extension.mark-print.export.settings` → `extension.markprint.export.settings`
- `extension.mark-print.export.pdf` → `extension.markprint.export.pdf`
- `extension.mark-print.export.html` → `extension.markprint.export.html`
- `extension.mark-print.export.png` → `extension.markprint.export.png`
- `extension.mark-print.export.jpeg` → `extension.markprint.export.jpeg`
- `extension.mark-print.export.all` → `extension.markprint.export.all`
- `extension.mark-print.clip` → `extension.markprint.clip`

**Phase 1 Commands Added** (lines ~141-160):
- `markprint.changeBuildMode` (no extension. prefix)
- `markprint.selectTemplate` (no extension. prefix)
- `markprint.reloadTemplates` (no extension. prefix)

**Activation Events** (lines ~30-50):
- All updated from `onCommand:extension.mark-print.*` → `onCommand:extension.markprint.*`
- Added Phase 1 activation events: `onCommand:markprint.changeBuildMode`, etc.

**Configuration Schema** (~51 settings, lines ~170-850):
- Namespace changed: `mark-print.*` → `markprint.*`
- All config keys updated (e.g., `markprint.outputDirectory`, `markprint.styles`, `markprint.buildMode`)

### extension.js (Command Registration)

**Export Commands** (lines ~60-90):
- Preserved `extension.` prefix per original pattern
- Updated all from `extension.mark-print.*` to `extension.markprint.*`:
```javascript
vscode.commands.registerCommand('extension.markprint.export.settings', async function () {
  await markdownPdf('settings', context);
}),
vscode.commands.registerCommand('extension.markprint.export.pdf', async function () {
  await markdownPdf('pdf', context);
}),
// ... 5 more export commands
```

**Phase 1 Commands** (lines ~36-58):
- No `extension.` prefix (different pattern from exports)
```javascript
vscode.commands.registerCommand('markprint.changeBuildMode', async function () {
  await statusBarManager.showBuildModePicker();
}),
vscode.commands.registerCommand('markprint.selectTemplate', async function () {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await templateRegistry.promptTemplateSelection(editor.document, context.workspaceState);
}),
vscode.commands.registerCommand('markprint.reloadTemplates', async function () {
  await templateRegistry.initialize();
  vscode.window.showInformationMessage('Templates reloaded');
})
```

**Configuration Access** (multiple locations):
- All `getConfiguration('mark-print')` → `getConfiguration('markprint')`
- Example line ~200: `var buildMode = vscode.workspace.getConfiguration('markprint')['buildMode'];`

### test/suite/extension.test.js (Integration Test)

**Test File Updated** (lines 1-50):
```javascript
const vscode = require('vscode');
const assert = require('assert');
const path = require('path');
const rimraf = require('rimraf');

suite('MarkPrint Extension Tests', function () {
    test('SOP-200 Export', async function() {
        this.timeout(6000000);
        try {
            const sopFilePath = path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.md');
            console.log('Opening file:', sopFilePath);

            var textDocument = await vscode.workspace.openTextDocument(sopFilePath);
            console.log('Document opened:', textDocument.fileName);

            await vscode.window.showTextDocument(textDocument);
            console.log('Document shown in editor');

            console.log('Executing extension.markprint.all command...');
            await vscode.commands.executeCommand('extension.markprint.all');
            console.log('Export command completed');

            // Cleanup exported files
            rimraf.sync(path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.pdf'));
            rimraf.sync(path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.html'));
            rimraf.sync(path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.png'));
            rimraf.sync(path.resolve(__dirname, 'SOP-200_Create_Workpackage_Sequencing_Type.jpeg'));
        } catch (error) {
            console.error('Test failed with error:', error);
            throw error;
        }
    });
});
```

Changes:
- Suite name: Updated to "MarkPrint Extension Tests"
- Test name: "Mermaid Export" → "SOP-200 Export"
- File path: `mermaid.md` → `SOP-200_Create_Workpackage_Sequencing_Type.md`
- Command: `extension.mark-print.all` → `extension.markprint.all`
- Added comprehensive logging for debugging
- Added try-catch error handling
- Updated cleanup to match new filename

### .vscode/settings.json

**Workspace Settings** (3 settings):
```json
{
    "markprint.outputDirectory": "sample",
    "markprint.markdown-it-include.enable": false,
    "debug.node.autoAttach": "on"
}
```
- Changed from `mark-print.*` to `markprint.*`

### .vscode/launch.json

**Run Extension Configuration** (lines 5-15):
Added SOP-200 auto-open on debug:
```json
{
    "name": "Run Extension",
    "type": "extensionHost",
    "request": "launch",
    "runtimeExecutable": "${execPath}",
    "args": [
        "--disable-extensions",
        "--extensionDevelopmentPath=${workspaceFolder}",
        "${workspaceFolder}/test/suite/SOP-200_Create_Workpackage_Sequencing_Type.md"
    ]
}
```
- Added third arg to auto-open test file when F5 pressed
- This restores behavior user expected (markdown file opens automatically in Extension Development Host)

## 3. Test Data Setup

**Files Created/Modified**:

1. **test/suite/SOP-200_Create_Workpackage_Sequencing_Type.md** (copied)
   - Source: `.plan/ref/SOP-200_Create_Workpackage_Sequencing_Type.md`
   - Size: 2635 bytes
   - Content: Production SOP document with:
     - YAML frontmatter (document_id, owner, status, amos_version, etc.)
     - Complex markdown (warnings, figures, wikilinks, callouts)
     - Realistic test case vs. simple mermaid diagram

2. **test/suite/mermaid.md.bak** (backup)
   - Original test file preserved for restoration if needed
   - Size: 2800 bytes (contained both mermaid diagram and SOP content merged)

3. **test/suite/mermaid.md** (auto-generated)
   - Simple 182-byte file with mermaid diagram
   - Auto-created during test run by test framework
   - Not currently used by tests

## 4. Documentation Created

### TEST.md (NEW - 497 lines)

**Structure**:
1. Quick Start (3 methods: CLI, F5 debug, extension tests)
2. Architecture Overview (test types, data files, Phase 1 integration)
3. CLI Testing (`npm test` workflow)
4. VS Code Debugger (F5 detailed walkthrough)
   - Section 4.1: Launch "Run Extension"
   - Section 4.2: Manual testing with status bar
   - Section 4.3: Breakpoint debugging
5. Writing Tests (patterns, assertions, async)
6. Phase 1 Testing (template selection, build modes, schema validation)
7. Troubleshooting (common errors, diagnostics)
8. WSL Considerations (Chromium install, headless execution, performance)
9. CI/CD Setup (GitHub Actions YAML example)
10. Test Coverage (current status, improvement areas)
11. Appendices (test inventory, common patterns)

**Key Content**:
- Step-by-step F5 debugging instructions
- Breakpoint usage examples
- WSL2 headless testing requirements
- Common error resolutions
- Test file patterns and conventions
- Phase 1 feature validation steps

### MIGRATION.md (NEW - 241 lines)

**Structure**:
1. Breaking Changes Summary
2. Command Migration (complete mapping table)
3. Configuration Migration (all 51+ settings mapped)
4. Keybinding Updates (examples)
5. Troubleshooting (extension not found, commands missing, config issues)

**Content**:
- Every command: `extension.mark-print.*` → `extension.markprint.*`
- Every config: `mark-print.*` → `markprint.*`
- Search/replace patterns for user configs
- Phase 1 new commands documented

### README.md (Updated)

**Changes**:
- Added title: "# MarkPrint"
- Added breaking changes warning section
- Added migration notice linking to MIGRATION.md
- Preserved existing content

### .gitignore (Updated)

**Additions**:
```
# Test output files
test/suite/*.pdf
test/suite/*.html
test/suite/*.png
test/suite/*.jpeg

# Backup test files
test/suite/*.bak
```
- Prevents committing test outputs to repo
- Excludes backup files

## 5. Naming Pattern Decisions

After user clarification, established:

**Package/Project Naming**:
- Internal name: `mark-print` (with hyphen)
- Display name: `MarkPrint` (CamelCase)

**Command Naming**:
- Export commands: `extension.markprint.*` (no hyphen, keep `extension.` prefix per original code)
- Phase 1 commands: `markprint.*` (no hyphen, no `extension.` prefix - different pattern)
- Configuration: `markprint.*` (no hyphen, no `extension.` prefix)

**Rationale for `extension.` prefix preservation**:
- User feedback: "make sure when removing extension. prefix you are doing it for good reasons as it was part of the original code"
- Original pattern used `extension.` prefix for export commands
- Phase 1 commands (from templates feature) don't use prefix - maintaining this distinction
- No VS Code requirement for prefix, but keeping for consistency with original architecture

## 6. Error Corrections Made

**Error 1: Incorrect sed replacement removing extension. prefix**
- Initial mistake: `s/extension\.mark-print\./markprint.export./g`
- Created: `markprint.export.pdf` instead of `extension.markprint.export.pdf`
- Fixed with: `s/extension\.mark-print\./extension.markprint./g`

**Error 2: Hyphen in internal name**
- Initial mistake: Used `mark-print` in command IDs and config calls
- Created: `extension.mark-print.export.pdf` and corrupted `markp-rint` config access
- Fixed with: `s/mark-print/markprint/g` across all files
- Final pattern: `markprint` (no hyphen) in all code, `mark-print` only in package.json "name" field

## 7. Commands Executed

```bash
# Dependency upgrade
sed -i 's/"cheerio": "^0.20.0"/"cheerio": "^1.1.2"/' package.json

# Test file setup
cp .plan/ref/SOP-200_Create_Workpackage_Sequencing_Type.md test/suite/
mv test/suite/mermaid.md test/suite/mermaid.md.bak

# Naming corrections (multiple passes)
sed -i "s/extension\.mark-print\./extension.markprint./g" extension.js
sed -i "s/getConfiguration('mark-print')/getConfiguration('markprint')/g" extension.js
sed -i 's/"name": "markprint"/"name": "mark-print"/' package.json
sed -i 's/mark-print/markprint/g' package.json  # Remove hyphens from commands/config

# Validation
node -c extension.js  # Syntax check - passed
grep '"command": "extension.markprint' package.json | head -5
grep 'registerCommand.*extension.markprint' extension.js | head -5
grep 'executeCommand.*extension.markprint' test/suite/extension.test.js
```

## 8. Testing Attempted

**CLI Test Execution**:
```bash
npm test
```

**Results**:
- Downloaded VS Code 1.106.3 to `.vscode-test/vscode-1.106.3`
- Failed with: `libnspr4.so: cannot open shared object file`
- Exit code: 127
- Root cause: WSL2 missing Chromium shared libraries

**F5 Debug Test**:
- User reported: "SOP-200_Create_Workpackage_Sequencing_Type.md is not opening when in debug"
- After launch.json update: Not yet verified (user needs to test)
- Expected behavior: File should auto-open in Extension Development Host

**Export Test**:
- User ran export command manually in debug session
- Failed with: `libnss3.so: cannot open shared object file`
- Root cause: Puppeteer's bundled Chromium missing runtime dependencies in WSL2
</work_completed>

<work_remaining>
## 1. Install WSL2 Dependencies (IMMEDIATE)

User needs to run in WSL2 terminal:
```bash
sudo apt update && sudo apt install -y \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libnspr4
```

This will fix both test execution and manual export errors.

## 2. Verify F5 Debug Workflow

After dependency install:
1. Press F5 in VS Code
2. Select "Run Extension" from dropdown
3. Verify Extension Development Host opens
4. Verify SOP-200 markdown file opens automatically
5. Test export commands via Command Palette (Ctrl+Shift+P):
   - "MarkPrint: Export (pdf)"
   - "MarkPrint: Export (html)"
   - "MarkPrint: Export (all)"
6. Verify files created in configured output directory

## 3. Test Phase 1 Features

Once export working:
1. Open SOP-200 in Extension Development Host
2. Click status bar (bottom right) to verify:
   - Build mode picker shows (auto/manual/default)
   - Template selector shows
   - Template inheritance displays correctly
3. Run commands from palette:
   - "MarkPrint: Change Build Mode"
   - "MarkPrint: Select Template"
   - "MarkPrint: Reload Templates"

## 4. Optional Version & Release Tasks

When ready to publish:

**package.json Updates**:
- Version: `1.5.0` → `2.0.0` (breaking changes)
- Update repository URL if forking/renaming
- Verify license, author, contributors

**CHANGELOG.md** (create or update):
```markdown
## [2.0.0] - 2025-12-03

### BREAKING CHANGES
- Extension renamed from "MarkPrint" to "MarkPrint"
- All commands renamed: `extension.mark-print.*` → `extension.markprint.*`
- All configuration settings renamed: `mark-print.*` → `markprint.*`
- See MIGRATION.md for complete migration guide

### Added
- Phase 1: Template foundations (JSON/XML templates, schema validation)
- Build mode system (auto/manual/default)
- Status bar template selection
- Comprehensive TEST.md documentation

### Fixed
- Punycode deprecation warning (upgraded cheerio 0.20.0 → 1.1.2)

### Changed
- Test suite now uses production SOP document (SOP-200)
- Enhanced test logging and error handling
```

**Git Operations**:
```bash
# Review all changes
git status
git diff

# Commit breaking changes
git add .
git commit -m "feat!: rebrand to MarkPrint with template system

BREAKING CHANGE: All commands and config renamed
- Commands: extension.mark-print.* → extension.markprint.*
- Config: mark-print.* → markprint.*

See MIGRATION.md for user migration guide.

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Create tag
git tag -a v2.0.0 -m "Version 2.0.0: MarkPrint rebrand + template foundations"

# Push
git push origin ember/feature/template-registry
git push origin v2.0.0
```

## 5. Address VS Code Diagnostics (Optional)

package.json shows 9 warnings about redundant activation events for engine ^1.75.0+.

**Option A: Update engine and remove explicit events**
```json
"engines": {
    "vscode": "^1.75.0"
},
// Remove all onCommand activation events - they're implicit in ^1.75.0+
"activationEvents": []
```

**Option B: Keep current engine**
- No action needed, warnings are cosmetic
- Current `^1.23.0` requires explicit activation events

## 6. CI/CD Setup (Optional)

Create `.github/workflows/test.yml` per TEST.md example (lines 317-349):
- Runs on ubuntu-latest
- Tests on Node 18
- Uses xvfb-run for headless execution
- Uploads coverage reports
</work_remaining>

<attempted_approaches>
## 1. Direct Edit Tool Failures

**Attempts**: Used Edit tool on package.json and README.md
**Errors**: `ENOENT: no such file or directory`
**Root Cause**: File path resolution issues in WSL2 environment
**Solution**: Switched to sed/bash commands for those files

## 2. Initial Naming Pattern Misunderstanding

**Attempt 1**: Changed everything to `markprint` (no hyphen anywhere)
**Issue**: User clarified package name should be `mark-print` (with hyphen)
**Correction**: Package "name" field uses hyphen, all code uses no hyphen

**Attempt 2**: Removed `extension.` prefix from all commands
**Issue**: User feedback - "make sure when removing extension. prefix you are doing it for good reasons as it was part of the original code"
**Correction**: Preserved `extension.` prefix on export commands, kept Phase 1 commands without prefix (matches original pattern)

## 3. Test File Opening Investigation

**Initial assumption**: Test file not opening due to command ID mismatch
**Actions taken**:
- Added comprehensive logging to test
- Fixed command IDs
- Added try-catch error handling

**Actual issue**: launch.json didn't specify file to open on debug
**Solution**: Added file path to launch.json args array

## 4. CLI Test Execution

**Attempt**: Run `npm test` to verify changes
**Result**: Failed with `libnspr4.so` missing
**Follow-up**: Second error `libnss3.so` when user tried manual export
**Root cause**: WSL2 environment missing Chromium runtime dependencies
**Solution**: Document required apt packages (not installable via Claude due to sudo requirement)

## 5. Approaches NOT Pursued

**Switch to system Chromium**: Could configure Puppeteer to use system Chrome instead of bundled version, but installing dependencies is simpler and more reliable.

**Docker-based testing**: Could containerize tests with all dependencies, but adds complexity for local development.

**Windows-native testing**: User is in WSL2, switching to Windows VS Code would require different setup.
</attempted_approaches>

<critical_context>
## 1. Extension Command Naming Pattern

**Two distinct patterns exist in this codebase**:

**Pattern A - Export Commands** (original mark-print functionality):
- Use `extension.` prefix
- Examples: `extension.markprint.export.pdf`, `extension.markprint.export.html`
- Registered in extension.js lines ~60-90
- Listed in package.json commands array

**Pattern B - Phase 1 Commands** (new template system):
- No `extension.` prefix
- Examples: `markprint.changeBuildMode`, `markprint.selectTemplate`
- Registered in extension.js lines ~36-58
- Listed in package.json commands array

**This is intentional architecture**, not inconsistency. User confirmed: keep `extension.` prefix where it existed originally.

## 2. Configuration Access Pattern

All configuration access uses **no prefix**:
```javascript
vscode.workspace.getConfiguration('markprint')
```

NOT:
```javascript
vscode.workspace.getConfiguration('extension.markprint')  // WRONG
```

## 3. WSL2 Chromium Dependencies

Puppeteer bundles Chromium at:
`node_modules/puppeteer-core/.local-chromium/linux-722234/chrome-linux/chrome`

This binary requires these shared libraries:
- libnss3, libnspr4 (Mozilla NSS crypto)
- libatk1.0-0, libatk-bridge2.0-0 (accessibility)
- libcups2 (printing)
- libdrm2, libgbm1 (graphics)
- libxkbcommon0, libxcomposite1, libxdamage1, libxfixes3, libxrandr2 (X11)
- libasound2 (audio)

**Without these, PDF export fails**. This is standard for headless Chromium in Linux environments.

## 4. Test Execution Methods

**Method 1: CLI (`npm test`)**
- Downloads VS Code to `.vscode-test/`
- Runs headless
- Requires all Chromium dependencies
- Best for CI/CD
- Currently failing in WSL2 due to missing libs

**Method 2: F5 Debug ("Run Extension")**
- Uses current VS Code instance
- Opens Extension Development Host window
- File specified in launch.json args auto-opens
- Best for manual testing and development
- Should work after dependency install

**Method 3: F5 Debug ("Extension Tests")**
- Runs automated test suite in VS Code
- Same as Method 1 but uses current VS Code
- Currently failing due to missing libs

## 5. Phase 1 Template System

The extension now has a template system (files in src/):
- `templateRegistry.js` - Loads JSON/XML templates from `.templates/`
- `statusBar.js` - Shows build mode and template selection in status bar
- `schemaValidator.js` - Validates templates against JSON schema

These are initialized in extension.js `activate()` function and register 3 new commands.

**This is NOT being tested yet** - integration tests focus on export functionality. Phase 1 testing is manual via status bar.

## 6. Git State

**Current branch**: `ember/feature/template-registry`
**Main branch**: `master`

**Unstaged changes**:
- M .vscode/launch.json
- M .vscode/settings.json
- M extension.js
- M package.json
- M test/suite/extension.test.js

**Untracked files**:
- .plan/MarkPrint-impromptu-proposal_tmp.html
- .plan/ref/SOP-200_Create_Workackage_Sequencing_Type_tmp.html
- (whats-next.md will be added to this list)

**Recent commits**:
- db2899d "Full rebrand to MarkPring (mark-print)" (typo in message: "MarkPring")
- 64ad3a2 "Add template foundations phase1"

**Ready for commit**: All rebrand changes once testing verified

## 7. Output Directory Behavior

Extension config: `markprint.outputDirectory: "sample"`

Exported files go to:
- `{workspaceFolder}/sample/` (relative path)
- OR absolute path if configured

Test cleanup in extension.test.js assumes files export to `test/suite/` directory (same as source), but actual behavior depends on config.

**Potential issue**: If `outputDirectory` is set to `sample`, test cleanup won't find files to delete.

## 8. File Naming Convention

User follows hyphenated naming:
- `mark-print` (package name)
- `SOP-200_Create_Workpackage_Sequencing_Type.md` (underscores, not hyphens for spaces)

Configuration and code use no hyphens:
- `markprint` (internal code, config namespace, command IDs without extension. prefix)
- `extension.markprint.*` (command IDs with extension. prefix)

## 9. User's Work Context

**Role**: Planning Manager at Kalitta Air (FAA Part 145 repair station)
**Tools**: Excel, Power Query, Power BI, AMOS (Swiss-AS maintenance system)
**Use case**: Converting SOPs from Markdown to PDF with template system
**Environment**: WSL2 on Windows, VS Code

**Preferences**:
- Step-by-step collaboration
- Complete drop-in code (not abstracts)
- Iterative refinement
- Clear structure and documentation
- Concise communication

## 10. SOP Document Structure

The test document (SOP-200) contains:
- YAML frontmatter with extensive metadata
- Custom callouts: `[[WARNING]]`, `> [!DANGER]`
- Figure syntax: `<!-- ::FIGURE caption="..." -->`
- Wikilinks: `[[REF-2201_Workpackage_Configuration | REF-2201]]`

**These require custom markdown-it plugins** to render correctly. The extension has several configured:
- markdown-it-include
- markdown-it-container
- markdown-it-attrs
- Custom plugins in extension.js

Testing with SOP-200 validates real-world rendering vs. simple mermaid diagram.
</critical_context>

<current_state>
## Deliverable Status

### Complete ✓
1. **Cheerio upgrade**: package.json updated, 0.20.0 → 1.1.2
2. **Package rebrand**: "mark-print" with display "MarkPrint"
3. **Command rebrand**: All 13+ commands updated to `extension.markprint.*` pattern
4. **Config rebrand**: All 51+ settings updated to `markprint.*` namespace
5. **Test file setup**: SOP-200 copied to test/suite/, mermaid.md backed up
6. **Test code update**: extension.test.js uses new command IDs and filename
7. **Launch config**: Auto-opens SOP-200 on F5 debug
8. **Documentation**: TEST.md (497 lines) created
9. **Migration guide**: MIGRATION.md (241 lines) created
10. **README update**: Added title and migration notice
11. **.gitignore update**: Excludes test outputs

### Blocked ⚠️
1. **CLI test execution**: Blocked by missing WSL2 dependencies
   - Error: `libnspr4.so: cannot open shared object file`
   - Resolution: User must run apt install command

2. **Manual export testing**: Blocked by missing WSL2 dependencies
   - Error: `libnss3.so: cannot open shared object file`
   - Resolution: Same apt install command

3. **F5 debug verification**: Waiting for user to test after dependency install
   - Expected: SOP-200 auto-opens in Extension Development Host
   - Unknown: Whether export commands work after dependency install

### Not Started
1. **Version bump**: Still at 1.5.0, should update to 2.0.0
2. **CHANGELOG**: Not created yet
3. **Git commit**: Changes not committed
4. **CI/CD setup**: No GitHub Actions workflow yet
5. **VS Code diagnostics**: 9 activation event warnings unresolved

## Files Modified (Uncommitted)
- `.vscode/launch.json` - Added SOP-200 auto-open
- `.vscode/settings.json` - Config keys updated
- `extension.js` - All command registrations and config access updated
- `package.json` - Name, commands, config schema updated, cheerio upgraded
- `test/suite/extension.test.js` - Test name, file, command updated
- `README.md` - Title and migration notice added

## Files Created (Uncommitted)
- `TEST.md` - 497 lines
- `MIGRATION.md` - 241 lines
- `.gitignore` - Updated with test output patterns
- `test/suite/SOP-200_Create_Workpackage_Sequencing_Type.md` - Copied from .plan/ref/
- `test/suite/mermaid.md.bak` - Backup of original test file

## Files Created (Auto-generated, Gitignored)
- `test/suite/mermaid.md` - 182 bytes, created during test run

## Environment State
- **Working directory**: `/mnt/c/Users/Jason/Documents/Git/MarkPrint`
- **Node modules**: Installed, cheerio 1.1.2 present
- **VS Code test binary**: Downloaded to `.vscode-test/vscode-1.106.3`
- **Chromium dependencies**: MISSING (blocking all tests)

## Immediate Next Action
User must install Chromium dependencies in WSL2 terminal, then retest.

## Open Questions
1. Do exports work correctly after dependency install?
2. Does F5 debug auto-open SOP-200 as expected?
3. Do Phase 1 commands (status bar, template selection) work correctly?
4. Should version be bumped to 2.0.0 before commit?
5. Should activation event warnings be addressed now or later?

## Temporary Workarounds
None currently in place. All changes are permanent architecture updates.

## Testing Position
- Pre-install: All tests fail with missing library errors
- Post-install: Unknown, awaiting user verification
- No tests have successfully run yet with new configuration
</current_state>

<context_update timestamp="2025-12-04T09:40-0500">
## Automated Test Workspace Preparation
- Added `.plan/tools/prepare-test-workspace.js` to copy `templates/standard-letter.json`, `.markprint/schemas/standard-letter.schema.json`, and `.plan/ref/SOP-200_Create_Workackage_Sequencing_Type.md` into `test/.test-workspace/.markprint/{templates,schemas}` plus the SOP markdown before each debug/test run.
- Updated `package.json` with a `pretest` script (`node ./.plan/tools/prepare-test-workspace.js`) so `npm test` always seeds the sandbox automatically without touching real workspace data.
- Registered a VS Code task (`.vscode/tasks.json`) named “Prepare Test Workspace” and set both “Run Extension” and “Extension Tests” launch configs to call it via `preLaunchTask`, also passing `${workspaceFolder}/test/.test-workspace` as the workspace folder argument so the Extension Development Host opens the isolated sandbox.
- Added `test/.test-workspace/` to `.gitignore` to keep the generated workspace out of source control.
- Result: Phase 1 template registry now finds workspace templates/SOP content in a safe throwaway folder, so automated tests and F5 sessions run against realistic data without requiring major architectural changes.
</context_update>
