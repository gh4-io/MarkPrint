'use strict';
var vscode = require('vscode');
var path = require('path');
var fs = require('fs');
var url = require('url');
var os = require('os');
var INSTALL_CHECK = false;
const debugLogger = require('./src/debugLogger');

// MarkPrint Phase 1: Template Foundations
const TemplateRegistry = require('./src/templateRegistry');
const StatusBarManager = require('./src/statusBar');
const SchemaValidator = require('./src/schemaValidator');

// Global instances
let templateRegistry;
let statusBarManager;
let schemaValidator;

function activate(context) {
  init();

  // Initialize Phase 1 components
  templateRegistry = new TemplateRegistry(context);
  statusBarManager = new StatusBarManager();
  schemaValidator = new SchemaValidator();

  // Initialize template registry
  templateRegistry.initialize().catch(err => {
    console.error('Failed to initialize template registry:', err);
  });

  // Initialize status bar
  statusBarManager.initialize();
  context.subscriptions.push(statusBarManager);

  // Register Phase 1 commands
  context.subscriptions.push(
    vscode.commands.registerCommand('markprint.changeBuildMode', async function () {
      await statusBarManager.showBuildModePicker();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markprint.selectTemplate', async function () {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await templateRegistry.promptTemplateSelection(editor.document, context.workspaceState);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('markprint.reloadTemplates', async function () {
      await templateRegistry.reload();
      vscode.window.showInformationMessage('Templates reloaded');
    })
  );

  // Existing commands
  var commands = [
    vscode.commands.registerCommand('extension.mark-print.settings', async function () { await markdownPdf('settings', context); }),
    vscode.commands.registerCommand('extension.mark-print.pdf', async function () { await markdownPdf('pdf', context); }),
    vscode.commands.registerCommand('extension.mark-print.html', async function () { await markdownPdf('html', context); }),
    vscode.commands.registerCommand('extension.mark-print.png', async function () { await markdownPdf('png', context); }),
    vscode.commands.registerCommand('extension.mark-print.jpeg', async function () { await markdownPdf('jpeg', context); }),
    vscode.commands.registerCommand('extension.mark-print.all', async function () { await markdownPdf('all', context); })
  ];
  commands.forEach(function (command) {
    context.subscriptions.push(command);
  });

  // Handle build modes
  var buildMode = vscode.workspace.getConfiguration('markprint')['buildMode'] || 'manual';
  var isConvertOnSave = vscode.workspace.getConfiguration('mark-print')['convertOnSave'];

  // Legacy convertOnSave or auto mode
  if (isConvertOnSave || buildMode === 'auto') {
    var disposable_onsave = vscode.workspace.onDidSaveTextDocument(function (doc) {
      markdownPdfOnSave(doc, context);
    });
    context.subscriptions.push(disposable_onsave);
  }

  // Hybrid mode: lightweight preview on save
  if (buildMode === 'hybrid') {
    var disposable_hybrid = vscode.workspace.onDidSaveTextDocument(async function (doc) {
      if (doc.languageId === 'markdown') {
        await validateAndPreview(doc, context);
      }
    });
    context.subscriptions.push(disposable_hybrid);
  }

  // Update status bar on active editor change
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async function (editor) {
      if (editor && editor.document.languageId === 'markdown') {
        const template = await templateRegistry.getTemplateForDocument(editor.document, context.workspaceState);
        if (template) {
          statusBarManager.setTemplate(template);
        }
      } else {
        statusBarManager.clearTemplate();
      }
    })
  );

  // Update status bar on config change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('markprint.buildMode')) {
        statusBarManager.updateBuildMode();
      }
    })
  );

  context.subscriptions.push(schemaValidator);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;

// Phase 1: Validate and preview (hybrid mode)
async function validateAndPreview(document, context) {
  try {
    // Get template for document
    const template = await templateRegistry.getTemplateForDocument(document, context.workspaceState);
    if (!template) {
      return; // No template selected, skip validation
    }

    // Validate metadata
    const isValid = await schemaValidator.validateDocument(document, template);
    if (!isValid) {
      // Validation errors reported to Problems panel, don't proceed
      return;
    }

    // Clear any previous validation errors
    schemaValidator.clearDiagnostics(document);

    // Show lightweight HTML preview (future: could generate HTML preview)
    vscode.window.setStatusBarMessage('$(check) Template validation passed', 3000);
  } catch (error) {
    console.error('Validation and preview failed:', error);
  }
}

async function markdownPdf(option_type, context) {

  try {

    // check active window
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active Editor!');
      return;
    }

    // check markdown mode
    var mode = editor.document.languageId;
    if (mode != 'markdown') {
      vscode.window.showWarningMessage('It is not a markdown mode!');
      return;
    }

    var uri = editor.document.uri;
    var mdfilename = uri.fsPath;
    var ext = path.extname(mdfilename);
    if (!isExistsPath(mdfilename)) {
      if (editor.document.isUntitled) {
        vscode.window.showWarningMessage('Please save the file!');
        return;
      }
      vscode.window.showWarningMessage('File name does not get!');
      return;
    }

    // Phase 1: Validate template if available
    if (context && templateRegistry && schemaValidator) {
      const template = await templateRegistry.getTemplateForDocument(editor.document, context.workspaceState);
      if (template) {
        const isValid = await schemaValidator.validateDocument(editor.document, template);
        if (!isValid) {
          vscode.window.showErrorMessage('Export blocked: template validation failed. Check Problems panel.');
          return;
        }
        schemaValidator.clearDiagnostics(editor.document);
      }
    }

    var types_format = ['html', 'pdf', 'png', 'jpeg'];
    var filename = '';
    var types = [];
    if (types_format.indexOf(option_type) >= 0) {
      types[0] = option_type;
    } else if (option_type === 'settings') {
      var types_tmp = vscode.workspace.getConfiguration('mark-print')['type'] || 'pdf';
      if (types_tmp && !Array.isArray(types_tmp)) {
          types[0] = types_tmp;
      } else {
        types = vscode.workspace.getConfiguration('mark-print')['type'] || 'pdf';
      }
    } else if (option_type === 'all') {
      types = types_format;
    } else {
      showErrorMessage('markdownPdf().1 Supported formats: html, pdf, png, jpeg.');
      return;
    }

    // convert and export markdown to pdf, html, png, jpeg
    if (types && Array.isArray(types) && types.length > 0) {
      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        if (types_format.indexOf(type) >= 0) {
          filename = mdfilename.replace(ext, '.' + type);
          var text = editor.document.getText();
          var content = convertMarkdownToHtml(mdfilename, type, text);
          var html = makeHtml(content, uri);
          await exportPdf(html, filename, type, uri);
        } else {
          showErrorMessage('markdownPdf().2 Supported formats: html, pdf, png, jpeg.');
          return;
        }
      }
    } else {
      showErrorMessage('markdownPdf().3 Supported formats: html, pdf, png, jpeg.');
      return;
    }
  } catch (error) {
    showErrorMessage('markdownPdf()', error);
  }
}

function markdownPdfOnSave(doc, context) {
  try {
    var editor = vscode.window.activeTextEditor;
    var mode = editor.document.languageId;
    if (mode != 'markdown') {
      return;
    }
    if (!isMarkdownPdfOnSaveExclude()) {
      markdownPdf('settings', context);
    }
  } catch (error) {
    showErrorMessage('markdownPdfOnSave()', error);
  }
}

function isMarkdownPdfOnSaveExclude() {
  try{
    var editor = vscode.window.activeTextEditor;
    var filename = path.basename(editor.document.fileName);
    var patterns = vscode.workspace.getConfiguration('mark-print')['convertOnSaveExclude'] || '';
    var pattern;
    var i;
    if (patterns && Array.isArray(patterns) && patterns.length > 0) {
      for (i = 0; i < patterns.length; i++) {
        pattern = patterns[i];
        var re = new RegExp(pattern);
        if (re.test(filename)) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    showErrorMessage('isMarkdownPdfOnSaveExclude()', error);
  }
}

/*
 * convert markdown to html (markdown-it)
 */
function convertMarkdownToHtml(filename, type, text) {
  var grayMatter = require("gray-matter");
  var matterParts = grayMatter(text);

  try {
    try {
      var statusbarmessage = vscode.window.setStatusBarMessage('$(markdown) Converting (convertMarkdownToHtml) ...');
      var hljs = require('highlight.js');
      var breaks = setBooleanValue(matterParts.data.breaks, vscode.workspace.getConfiguration('mark-print')['breaks']);
      var md = require('markdown-it')({
        html: true,
        breaks: breaks,
        highlight: function (str, lang) {

          if (lang && lang.match(/\bmermaid\b/i)) {
            return `<div class="mermaid">${str}</div>`;
          }

          if (lang && hljs.getLanguage(lang)) {
            try {
              str = hljs.highlight(lang, str, true).value;
            } catch (error) {
              str = md.utils.escapeHtml(str);

              showErrorMessage('markdown-it:highlight', error);
            }
          } else {
            str = md.utils.escapeHtml(str);
          }
          return '<pre class="hljs"><code><div>' + str + '</div></code></pre>';
        }
      });
    } catch (error) {
      statusbarmessage.dispose();
      showErrorMessage('require(\'markdown-it\')', error);
    }

  // convert the img src of the markdown
  var cheerio = require('cheerio');
  var defaultRender = md.renderer.rules.image;
  md.renderer.rules.image = function (tokens, idx, options, env, self) {
    var token = tokens[idx];
    var href = token.attrs[token.attrIndex('src')][1];
    // console.log("original href: " + href);
    if (type === 'html') {
      href = decodeURIComponent(href).replace(/("|')/g, '');
    } else {
      href = convertImgPath(href, filename);
    }
    // console.log("converted href: " + href);
    token.attrs[token.attrIndex('src')][1] = href;
    // // pass token to default renderer.
    return defaultRender(tokens, idx, options, env, self);
  };

  if (type !== 'html') {
    // convert the img src of the html
    md.renderer.rules.html_block = function (tokens, idx) {
      var html = tokens[idx].content;
      var $ = cheerio.load(html);
      $('img').each(function () {
        var src = $(this).attr('src');
        var href = convertImgPath(src, filename);
        $(this).attr('src', href);
      });
      return $.html();
    };
  }

  // checkbox
  md.use(require('markdown-it-checkbox'));

  // emoji
  var emoji_f = setBooleanValue(matterParts.data.emoji, vscode.workspace.getConfiguration('mark-print')['emoji']);
  if (emoji_f) {
    var emojies_defs = require(path.join(__dirname, 'data', 'emoji.json'));
    try {
      var options = {
        defs: emojies_defs
      };
    } catch (error) {
      statusbarmessage.dispose();
      showErrorMessage('markdown-it-emoji:options', error);
    }
    md.use(require('markdown-it-emoji'), options);
    md.renderer.rules.emoji = function (token, idx) {
      var emoji = token[idx].markup;
      var emojipath = path.join(__dirname, 'node_modules', 'emoji-images', 'pngs', emoji + '.png');
      var emojidata = readFile(emojipath, null).toString('base64');
      if (emojidata) {
        return '<img class="emoji" alt="' + emoji + '" src="data:image/png;base64,' + emojidata + '" />';
      } else {
        return ':' + emoji + ':';
      }
    };
  }

  // toc
  // https://github.com/leff/markdown-it-named-headers
  var options = {
    slugify: Slug
  }
  md.use(require('markdown-it-named-headers'), options);

  // markdown-it-container
  // https://github.com/markdown-it/markdown-it-container
  md.use(require('markdown-it-container'), '', {
    validate: function (name) {
      return name.trim().length;
    },
    render: function (tokens, idx) {
      if (tokens[idx].info.trim() !== '') {
        return `<div class="${tokens[idx].info.trim()}">\n`;
      } else {
        return `</div>\n`;
      }
    }
  });

  // PlantUML
  // https://github.com/gmunguia/markdown-it-plantuml
  var plantumlOptions = {
    openMarker: matterParts.data.plantumlOpenMarker || vscode.workspace.getConfiguration('mark-print')['plantumlOpenMarker'] || '@startuml',
    closeMarker: matterParts.data.plantumlCloseMarker || vscode.workspace.getConfiguration('mark-print')['plantumlCloseMarker'] || '@enduml',
    server: vscode.workspace.getConfiguration('mark-print')['plantumlServer'] || ''
  }
  md.use(require('markdown-it-plantuml'), plantumlOptions);

  // markdown-it-include
  // https://github.com/camelaissani/markdown-it-include
  // the syntax is :[alt-text](relative-path-to-file.md)
  // https://talk.commonmark.org/t/transclusion-or-including-sub-documents-for-reuse/270/13
  if (vscode.workspace.getConfiguration('mark-print')['markdown-it-include']['enable']) {
    md.use(require("markdown-it-include"), {
      root: path.dirname(filename),
      includeRe: /:\[.+\]\((.+\..+)\)/i
    });
  }

  statusbarmessage.dispose();
  return md.render(matterParts.content);

  } catch (error) {
    statusbarmessage.dispose();
    showErrorMessage('convertMarkdownToHtml()', error);
  }
}

/*
 * https://github.com/microsoft/vscode/blob/ca4ceeb87d4ff935c52a7af0671ed9779657e7bd/extensions/markdown-language-features/src/slugify.ts#L26
 */
function Slug(string) {
  try {
    var stg = encodeURI(
      string.trim()
            .toLowerCase()
            .replace(/\s+/g, '-') // Replace whitespace with -
            .replace(/[\]\[\!\'\#\$\%\&\(\)\*\+\,\.\/\:\;\<\=\>\?\@\\\^\_\{\|\}\~\`。，、；：？！…—·ˉ¨‘’“”々～‖∶＂＇｀｜〃〔〕〈〉《》「」『』．〖〗【】（）［］｛｝]/g, '') // Remove known punctuators
            .replace(/^\-+/, '') // Remove leading -
            .replace(/\-+$/, '') // Remove trailing -
    );
    return stg;
  } catch (error) {
    showErrorMessage('Slug()', error);
  }
}

/*
 * make html
 */
function makeHtml(data, uri) {
  try {
    // read styles
    var style = '';
    style += readStyles(uri);

    // get title
    var title = path.basename(uri.fsPath);

    // read template
    var filename = path.join(__dirname, 'template', 'template.html');
    var template = readFile(filename);

    // read mermaid javascripts
    var mermaidServer = vscode.workspace.getConfiguration('mark-print')['mermaidServer'] || '';
    var mermaid = '<script src=\"' + mermaidServer + '\"></script>';

    // compile template
    var mustache = require('mustache');

    var view = {
      title: title,
      style: style,
      content: data,
      mermaid: mermaid
    };
    return mustache.render(template, view);
  } catch (error) {
    showErrorMessage('makeHtml()', error);
  }
}

/*
 * export a html to a html file
 */
function exportHtml(data, filename) {
  fs.writeFile(filename, data, 'utf-8', function (error) {
    if (error) {
      showErrorMessage('exportHtml()', error);
      return;
    }
  });
}

/*
 * export a html to a pdf file (html-pdf)
 */
function exportPdf(data, filename, type, uri) {

  if (!INSTALL_CHECK) {
    return;
  }
  if (!checkPuppeteerBinary()) {
    showErrorMessage('Chromium or Chrome does not exist! \
      See https://github.com/gh4-io/MarkPrint#install');
    return;
  }

  var StatusbarMessageTimeout = vscode.workspace.getConfiguration('mark-print')['StatusbarMessageTimeout'];
  vscode.window.setStatusBarMessage('');
  var exportFilename = getOutputDir(filename, uri);

  return vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '[]: Exporting (' + type + ') ...'
    }, async () => {
      try {
        // export html
        if (type == 'html') {
          exportHtml(data, exportFilename);
          vscode.window.setStatusBarMessage('$(markdown) ' + exportFilename, StatusbarMessageTimeout);
          return;
        }

        const puppeteer = require('puppeteer-core');
        // create temporary file
        var f = path.parse(filename);
        var tmpfilename = path.join(f.dir, f.name + '_tmp.html');
        exportHtml(data, tmpfilename);
        var options = {
          executablePath: vscode.workspace.getConfiguration('mark-print')['executablePath'] || puppeteer.executablePath(),
          args: ['--lang='+vscode.env.language, '--no-sandbox', '--disable-setuid-sandbox']
          // Setting Up Chrome Linux Sandbox
          // https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
      };
        const browser = await puppeteer.launch(options);
        const page = await browser.newPage();
        await page.setDefaultTimeout(0);
        await page.goto(vscode.Uri.file(tmpfilename).toString(), { waitUntil: 'networkidle0' });
        // generate pdf
        // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagepdfoptions
        if (type == 'pdf') {
          // If width or height option is set, it overrides the format option.
          // In order to set the default value of page size to A4, we changed it from the specification of puppeteer.
          var width_option = vscode.workspace.getConfiguration('mark-print', uri)['width'] || '';
          var height_option = vscode.workspace.getConfiguration('mark-print', uri)['height'] || '';
          var format_option = '';
          if (!width_option && !height_option) {
            format_option = vscode.workspace.getConfiguration('mark-print', uri)['format'] || 'A4';
          }
          var landscape_option;
          if (vscode.workspace.getConfiguration('mark-print', uri)['orientation'] == 'landscape') {
            landscape_option = true;
          } else {
            landscape_option = false;
          }
          var options = {
            path: exportFilename,
            scale: vscode.workspace.getConfiguration('mark-print', uri)['scale'],
            displayHeaderFooter: vscode.workspace.getConfiguration('mark-print', uri)['displayHeaderFooter'],
            headerTemplate: transformTemplate(vscode.workspace.getConfiguration('mark-print', uri)['headerTemplate'] || ''),
            footerTemplate: transformTemplate(vscode.workspace.getConfiguration('mark-print', uri)['footerTemplate'] || ''),
            printBackground: vscode.workspace.getConfiguration('mark-print', uri)['printBackground'],
            landscape: landscape_option,
            pageRanges: vscode.workspace.getConfiguration('mark-print', uri)['pageRanges'] || '',
            format: format_option,
            width: vscode.workspace.getConfiguration('mark-print', uri)['width'] || '',
            height: vscode.workspace.getConfiguration('mark-print', uri)['height'] || '',
            margin: {
              top: vscode.workspace.getConfiguration('mark-print', uri)['margin']['top'] || '',
              right: vscode.workspace.getConfiguration('mark-print', uri)['margin']['right'] || '',
              bottom: vscode.workspace.getConfiguration('mark-print', uri)['margin']['bottom'] || '',
              left: vscode.workspace.getConfiguration('mark-print', uri)['margin']['left'] || ''
            },
            timeout: 0
          };
          await page.pdf(options);
        }

        // generate png and jpeg
        // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions
        if (type == 'png' || type == 'jpeg') {
          // Quality options do not apply to PNG images.
          var quality_option;
          if (type == 'png') {
            quality_option = undefined;
          }
          if (type == 'jpeg') {
            quality_option = vscode.workspace.getConfiguration('mark-print')['quality'] || 100;
          }

          // screenshot size
          var clip_x_option = vscode.workspace.getConfiguration('mark-print')['clip']['x'] || null;
          var clip_y_option = vscode.workspace.getConfiguration('mark-print')['clip']['y'] || null;
          var clip_width_option = vscode.workspace.getConfiguration('mark-print')['clip']['width'] || null;
          var clip_height_option = vscode.workspace.getConfiguration('mark-print')['clip']['height'] || null;
          var options;
          if (clip_x_option !== null && clip_y_option !== null && clip_width_option !== null && clip_height_option !== null) {
            options = {
              path: exportFilename,
              quality: quality_option,
              fullPage: false,
              clip: {
                x: clip_x_option,
                y: clip_y_option,
                width: clip_width_option,
                height: clip_height_option,
              },
              omitBackground: vscode.workspace.getConfiguration('mark-print')['omitBackground'],
            }
          } else {
            options = {
              path: exportFilename,
              quality: quality_option,
              fullPage: true,
              omitBackground: vscode.workspace.getConfiguration('mark-print')['omitBackground'],
            }
          }
          await page.screenshot(options);
        }

        await browser.close();

        // delete temporary file
        var debug = vscode.workspace.getConfiguration('mark-print')['debug'] || false;
        if (!debug) {
          if (isExistsPath(tmpfilename)) {
            deleteFile(tmpfilename);
          }
        }

        vscode.window.setStatusBarMessage('$(markdown) ' + exportFilename, StatusbarMessageTimeout);
      } catch (error) {
        showErrorMessage('exportPdf()', error);
      }
    } // async
  ); // vscode.window.withProgress
}

/**
 * Transform the text of the header or footer template, replacing the following supported placeholders:
 *
 * - `%%ISO-DATETIME%%` – For an ISO-based date and time format: `YYYY-MM-DD hh:mm:ss`
 * - `%%ISO-DATE%%` – For an ISO-based date format: `YYYY-MM-DD`
 * - `%%ISO-TIME%%` – For an ISO-based time format: `hh:mm:ss`
 */
function transformTemplate(templateText) {
  if (templateText.indexOf('%%ISO-DATETIME%%') !== -1) {
    templateText = templateText.replace('%%ISO-DATETIME%%', new Date().toISOString().substr(0, 19).replace('T', ' '));
  }
  if (templateText.indexOf('%%ISO-DATE%%') !== -1) {
    templateText = templateText.replace('%%ISO-DATE%%', new Date().toISOString().substr(0, 10));
  }
  if (templateText.indexOf('%%ISO-TIME%%') !== -1) {
    templateText = templateText.replace('%%ISO-TIME%%', new Date().toISOString().substr(11, 8));
  }

  return templateText;
}

function isExistsPath(path) {
  if (path.length === 0) {
    return false;
  }
  try {
    fs.accessSync(path);
    return true;
  } catch (error) {
    console.warn(error.message);
    return false;
  }
}

function isExistsDir(dirname) {
  if (dirname.length === 0) {
    return false;
  }
  try {
    if (fs.statSync(dirname).isDirectory()) {
      return true;
    } else {
      console.warn('Directory does not exist!') ;
      return false;
    }
  } catch (error) {
    console.warn(error.message);
    return false;
  }
}

function deleteFile (path) {
  var rimraf = require('rimraf')
  rimraf.sync(path);
}

function getOutputDir(filename, resource) {
  try {
    var outputDir;
    if (resource === undefined) {
      return filename;
    }
    var outputDirectory = vscode.workspace.getConfiguration('mark-print')['outputDirectory'] || '';
    if (outputDirectory.length === 0) {
      return filename;
    }

    // Use a home directory relative path If it starts with ~.
    if (outputDirectory.indexOf('~') === 0) {
      outputDir = outputDirectory.replace(/^~/, os.homedir());
      mkdir(outputDir);
      return path.join(outputDir, path.basename(filename));
    }

    // Use path if it is absolute
    if (path.isAbsolute(outputDirectory)) {
      if (!isExistsDir(outputDirectory)) {
        showErrorMessage(`The output directory specified by the mark-print.outputDirectory option does not exist.\
          Check the mark-print.outputDirectory option. ` + outputDirectory);
        return;
      }
      return path.join(outputDirectory, path.basename(filename));
    }

    // Use a workspace relative path if there is a workspace and mark-print.outputDirectoryRootPath = workspace
    var outputDirectoryRelativePathFile = vscode.workspace.getConfiguration('mark-print')['outputDirectoryRelativePathFile'];
    let root = vscode.workspace.getWorkspaceFolder(resource);
    if (outputDirectoryRelativePathFile === false && root) {
      outputDir = path.join(root.uri.fsPath, outputDirectory);
      mkdir(outputDir);
      return path.join(outputDir, path.basename(filename));
    }

    // Otherwise look relative to the markdown file
    outputDir = path.join(path.dirname(resource.fsPath), outputDirectory);
    mkdir(outputDir);
    return path.join(outputDir, path.basename(filename));
  } catch (error) {
    showErrorMessage('getOutputDir()', error);
  }
}

function mkdir(path) {
  if (isExistsDir(path)) {
    return;
  }
  var mkdirp = require('mkdirp');
  return mkdirp.sync(path);
}

function readFile(filename, encode) {
  if (filename.length === 0) {
    return '';
  }
  if (!encode && encode !== null) {
    encode = 'utf-8';
  }
  if (filename.indexOf('file://') === 0) {
    if (process.platform === 'win32') {
      filename = filename.replace(/^file:\/\/\//, '')
                 .replace(/^file:\/\//, '');
    } else {
      filename = filename.replace(/^file:\/\//, '');
    }
  }
  if (isExistsPath(filename)) {
    return fs.readFileSync(filename, encode);
  } else {
    return '';
  }
}

function convertImgPath(src, filename) {
  try {
    var href = decodeURIComponent(src);
    href = href.replace(/("|')/g, '')
          .replace(/\\/g, '/')
          .replace(/#/g, '%23');
    var protocol = url.parse(href).protocol;
    if (protocol === 'file:' && href.indexOf('file:///') !==0) {
      return href.replace(/^file:\/\//, 'file:///');
    } else if (protocol === 'file:') {
      return href;
    } else if (!protocol || path.isAbsolute(href)) {
      href = path.resolve(path.dirname(filename), href).replace(/\\/g, '/')
                                                      .replace(/#/g, '%23');
      if (href.indexOf('//') === 0) {
        return 'file:' + href;
      } else if (href.indexOf('/') === 0) {
        return 'file://' + href;
      } else {
        return 'file:///' + href;
      }
    } else {
      return src;
    }
  } catch (error) {
    showErrorMessage('convertImgPath()', error);
  }
}

function makeCss(filename) {
  try {
    var css = readFile(filename);
    if (css) {
      return '\n<style>\n' + css + '\n</style>\n';
    } else {
      return '';
    }
  } catch (error) {
    showErrorMessage('makeCss()', error);
  }
}

function readStyles(uri) {
  try {
    var style = '';
    var styles = '';
    var filename = '';
    var i;
    var appliedStyles = [];

    const includeDefaultInfo = debugLogger.describeSetting('mark-print', 'includeDefaultStyles');
    const includeDefaultStyles = includeDefaultInfo.value;

    // 1. read the style of the vscode.
    if (includeDefaultStyles) {
      filename = path.join(__dirname, 'styles', 'markdown.css');
      style += makeCss(filename);
      appliedStyles.push({ type: 'vscode.markdown.css', path: filename, source: includeDefaultInfo.source });
    }

    // 2. read the style of the markdown.styles setting.
    if (includeDefaultStyles) {
      styles = vscode.workspace.getConfiguration('markdown')['styles'];
      if (styles && Array.isArray(styles) && styles.length > 0) {
        for (i = 0; i < styles.length; i++) {
          var href = fixHref(uri, styles[i]);
          style += '<link rel=\"stylesheet\" href=\"' + href + '\" type=\"text/css\">';
          appliedStyles.push({ type: 'markdown.styles', original: styles[i], resolved: href });
        }
      }
    }

    // 3. read the style of the highlight.js.
    var highlightSettingInfo = debugLogger.describeSetting('mark-print', 'highlight');
    var highlightStyleSettingInfo = debugLogger.describeSetting('mark-print', 'highlightStyle');
    var highlightStyle = highlightStyleSettingInfo.value || '';
    var ishighlight = highlightSettingInfo.value;
    if (ishighlight) {
      if (highlightStyle) {
        var css = highlightStyle;
        filename = path.join(__dirname, 'node_modules', 'highlight.js', 'styles', css);
        style += makeCss(filename);
        appliedStyles.push({ type: 'highlight.js', path: filename, source: highlightStyleSettingInfo.source });
      } else {
        filename = path.join(__dirname, 'styles', 'tomorrow.css');
        style += makeCss(filename);
        appliedStyles.push({ type: 'highlight.js', path: filename, source: 'default' });
      }
    }

    // 4. read the style of the mark-print.
    if (includeDefaultStyles) {
      filename = path.join(__dirname, 'styles', 'mark-print.css');
      style += makeCss(filename);
      appliedStyles.push({ type: 'markprint.default', path: filename, source: includeDefaultInfo.source });
    }

    // 5. read the style of the mark-print.styles settings.
    styles = vscode.workspace.getConfiguration('mark-print')['styles'] || '';
    if (styles && Array.isArray(styles) && styles.length > 0) {
      for (i = 0; i < styles.length; i++) {
        var href = fixHref(uri, styles[i]);
        style += '<link rel=\"stylesheet\" href=\"' + href + '\" type=\"text/css\">';
        appliedStyles.push({ type: 'markprint.styles', original: styles[i], resolved: href });
      }
    }

    debugLogger.log('styles', 'Resolved stylesheet stack', {
      document: uri ? uri.fsPath : 'unknown',
      includeDefaultStyles: includeDefaultInfo,
      markdownStyles: debugLogger.describeSetting('markdown', 'styles'),
      highlight: highlightSettingInfo,
      highlightStyle: highlightStyleSettingInfo,
      markprintStyles: debugLogger.describeSetting('mark-print', 'styles'),
      appliedStyles
    });

    return style;
  } catch (error) {
    showErrorMessage('readStyles()', error);
  }
}

/*
 * vscode/extensions/markdown-language-features/src/features/previewContentProvider.ts fixHref()
 * https://github.com/Microsoft/vscode/blob/0c47c04e85bc604288a288422f0a7db69302a323/extensions/markdown-language-features/src/features/previewContentProvider.ts#L95
 *
 * Extension Authoring: Adopting Multi Root Workspace APIs ?E Microsoft/vscode Wiki
 * https://github.com/Microsoft/vscode/wiki/Extension-Authoring:-Adopting-Multi-Root-Workspace-APIs
 */
function fixHref(resource, href) {
  try {
    if (!href) {
      return href;
    }

    // Use href if it is already an URL
    const hrefUri = vscode.Uri.parse(href);
    if (['http', 'https'].indexOf(hrefUri.scheme) >= 0) {
      return hrefUri.toString();
    }

    // Use a home directory relative path If it starts with ^.
    if (href.indexOf('~') === 0) {
      return vscode.Uri.file(href.replace(/^~/, os.homedir())).toString();
    }

    // Use href as file URI if it is absolute
    if (path.isAbsolute(href)) {
      return vscode.Uri.file(href).toString();
    }

    // Use a workspace relative path if there is a workspace and mark-print.stylesRelativePathFile is false
    var stylesRelativePathFile = vscode.workspace.getConfiguration('mark-print')['stylesRelativePathFile'];
    let root = vscode.workspace.getWorkspaceFolder(resource);
    if (stylesRelativePathFile === false && root) {
      return vscode.Uri.file(path.join(root.uri.fsPath, href)).toString();
    }

    // Otherwise look relative to the markdown file
    return vscode.Uri.file(path.join(path.dirname(resource.fsPath), href)).toString();
  } catch (error) {
    showErrorMessage('fixHref()', error);
  }
}

function checkPuppeteerBinary() {
  try {
    // settings.json
    var executablePath = vscode.workspace.getConfiguration('mark-print')['executablePath'] || ''
    if (isExistsPath(executablePath)) {
      INSTALL_CHECK = true;
      return true;
    }

    // bundled Chromium
    const puppeteer = require('puppeteer-core');
    executablePath = puppeteer.executablePath();
    if (isExistsPath(executablePath)) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    showErrorMessage('checkPuppeteerBinary()', error);
  }
}

/*
 * puppeteer install.js
 * https://github.com/GoogleChrome/puppeteer/blob/master/install.js
 */
function installChromium() {
  try {
    vscode.window.showInformationMessage('[] Installing Chromium ...');
    var statusbarmessage = vscode.window.setStatusBarMessage('$(markdown) Installing Chromium ...');

    // proxy setting
    setProxy();

    var StatusbarMessageTimeout = vscode.workspace.getConfiguration('mark-print')['StatusbarMessageTimeout'];
    const puppeteer = require('puppeteer-core');
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revision = require(path.join(__dirname, 'node_modules', 'puppeteer-core', 'package.json')).puppeteer.chromium_revision;
    const revisionInfo = browserFetcher.revisionInfo(revision);

    // download Chromium
    browserFetcher.download(revisionInfo.revision, onProgress)
      .then(() => browserFetcher.localRevisions())
      .then(onSuccess)
      .catch(onError);

    function onSuccess(localRevisions) {
      console.log('Chromium downloaded to ' + revisionInfo.folderPath);
      localRevisions = localRevisions.filter(revision => revision !== revisionInfo.revision);
      // Remove previous chromium revisions.
      const cleanupOldVersions = localRevisions.map(revision => browserFetcher.remove(revision));

      if (checkPuppeteerBinary()) {
        INSTALL_CHECK = true;
        statusbarmessage.dispose();
        vscode.window.setStatusBarMessage('$(markdown) Chromium installation succeeded!', StatusbarMessageTimeout);
        vscode.window.showInformationMessage('[] Chromium installation succeeded.');
        return Promise.all(cleanupOldVersions);
      }
    }

    function onError(error) {
      statusbarmessage.dispose();
      vscode.window.setStatusBarMessage('$(markdown) ERROR: Failed to download Chromium!', StatusbarMessageTimeout);
      showErrorMessage('Failed to download Chromium! \
        If you are behind a proxy, set the http.proxy option to settings.json and restart Visual Studio Code. \
        See https://github.com/gh4-io/MarkPrint#install', error);
    }

    function onProgress(downloadedBytes, totalBytes) {
      var progress = parseInt(downloadedBytes / totalBytes * 100);
      vscode.window.setStatusBarMessage('$(markdown) Installing Chromium ' + progress + '%' , StatusbarMessageTimeout);
    }
  } catch (error) {
    showErrorMessage('installChromium()', error);
  }
}

function showErrorMessage(msg, error) {
  vscode.window.showErrorMessage('ERROR: ' + msg);
  console.log('ERROR: ' + msg);
  if (error) {
    vscode.window.showErrorMessage(error.toString());
    console.log(error);
  }
}

function setProxy() {
  var https_proxy = vscode.workspace.getConfiguration('http')['proxy'] || '';
  if (https_proxy) {
    process.env.HTTPS_PROXY = https_proxy;
    process.env.HTTP_PROXY = https_proxy;
  }
}

function setBooleanValue(a, b) {
  if (a === false) {
    return false
  } else {
    return a || b
  }
}

function init() {
  try {
    if (checkPuppeteerBinary()) {
      INSTALL_CHECK = true;
    } else {
      installChromium();
    }
  } catch (error) {
    showErrorMessage('init()', error);
  }
}
