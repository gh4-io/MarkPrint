# End-to-End Testing Playbook

This guide captures the exact steps required to validate the MarkPrint extension from clean install through manual export. Follow it linearly whenever you need to prove Phase 1 functionality end to end.

---

## 1. Test Goals
- Verify the Chromium export flow produces PDF/HTML/PNG/PNG outputs from the SOP fixture.
- Exercise the template registry + schema validator in both CLI (`npm test`) and manual (F5) modes.
- Capture logs/artifacts for troubleshooting when Puppeteer or VS Code binaries are missing.

---

## 2. Environment Prerequisites
1. **Host**: Windows 11 with WSL2 Ubuntu 22.04 (or equivalent Linux distro).
2. **Packages**:
   ```bash
   sudo apt update && sudo apt install -y \
     libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
     libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
     libgbm1 libasound2
   ```
3. **Node / npm**: Node 18.x LTS + npm 10.x (`node -v` / `npm -v`).
4. **VS Code**: Stable build with Remote-WSL extension installed.
5. **Repo setup**:
   ```bash
   git clone https://github.com/gh4-io/MarkPrint.git
   cd MarkPrint
   npm install
   ```

---

## 3. Required Downloads & Cache Prep
1. **VS Code integration harness** (only once per machine):
   ```bash
   npm run test:download-vscode
   ```
   - Downloads VS Code 1.106.3 into `.vscode-test/` for the CLI suite.
2. **Test workspace seeding** happens automatically via `npm run pretest`, but you can force it manually:
   ```bash
   node .plan/tools/prepare-test-workspace.js
   ```
   - Mirrors templates, schemas, styles, `.vscode`, and the SOP file into `test/.test-workspace/`.

---

## 4. CLI Test Execution (`npm test`)
1. Ensure the prerequisites above are complete.
2. Run:
   ```bash
   npm test
   ```
3. Expected behavior:
   - VS Code test host launches headlessly, then Mocha runs `test/suite/*.test.js`.
   - Look for “Resolved stylesheet stack” logs to confirm the stylesheet resolver covered document/workspace/extension fallbacks.
4. Common failures:
   | Symptom | Fix |
   | --- | --- |
   | `libnss3.so: cannot open shared object file` | Re-run the apt install command from section 2. |
   | `spawn ... Code.exe ENOENT` | Delete `.vscode-test/` and re-run `npm run test:download-vscode`. |
   | Assets missing inside sandbox | Delete `test/.test-workspace/.manual` (if present) so prep script can overwrite generated files. |
5. Artifacts:
   - Logs: `test/.test-workspace/.markprint/logs/` (if `markprint.debug` is true).
   - Output files (from tests) are cleaned automatically; check the console for rimraf operations.

---

## 5. Manual F5 Validation (Extension Development Host)
1. Open the repo in VS Code (WSL remote).
2. Press `F5` → choose **Run Extension**.
   - The preLaunch task seeds `test/.test-workspace/` and opens the SOP Markdown file automatically.
3. In the Extension Development Host:
   1. Verify the status bar shows build mode + template name.
   2. Run `Ctrl+Shift+P` → `MarkPrint: Export (pdf)` (command ID `extension.markprint.pdf`).
   3. Confirm outputs land alongside the Markdown file (because `markprint.outputDirectory` is empty by default). Files:
      - `SOP-200_Create_Workpackage_Sequencing_Type.pdf`
      - `.html`, `.png`, `.jpeg` if you run the “Export (all)” command.
4. If Chromium fails to launch:
   - Verify `markprint.executablePath` is blank (uses bundled Chromium).
   - Rerun the apt package command above.
   - Toggle `markprint.debug` to `true` (already set in `.vscode/settings.json`) for verbose console logs.
5. After validation, remove generated artifacts:
   ```bash
   rm test/suite/SOP-200_Create_Workpackage_Sequencing_Type.{pdf,html,png,jpeg} 2>/dev/null || true
   ```

---

## 6. Additional Functional Checks
1. **Template reload**: `Ctrl+Shift+P` → `MarkPrint: Reload Templates`; confirm success toast.
2. **Schema validator**: Introduce a deliberate error in the SOP front matter (e.g., remove `document_id`) and verify Problems panel shows AJV errors and export blocks.
3. **Stylesheet resolver**: Add a bogus entry to `markprint.styles` in workspace settings; run export and confirm “Stylesheet not found...” error points to the attempted paths.
4. **Renderer hint logging**: Set a template’s `renderer.engine` to `scribus` inside a copy of `templates/dts-master-report.json`, reload templates, and ensure the Debug Console logs the unsupported engine warning while still exporting via Chromium.

---

## 7. Reporting & Artifacts
- **Test run summary**: capture CLI output (`npm test > .plan/testing/logs/<date>-npm-test.log`).
- **Manual run evidence**: screenshot the exported PDF or include VS Code console logs in the same folder.
- **Issue filing**: log open defects in `TODO.md` with repro steps + log snippet.

---

## 8. Cleanup
1. Remove generated artifacts if they leak into git status:
   ```bash
   git checkout -- test/suite/*.pdf test/suite/*.html test/suite/*.png test/suite/*.jpeg 2>/dev/null || true
   ```
2. Reset temporary template edits (if you customized manifests).
3. Re-run `git status` to verify only intentional files remain staged.

---

**Next update cadence**: Review this playbook after Phase 2 renderer abstraction lands to add Playwright/Vivliostyle coverage and any new automated suites.
