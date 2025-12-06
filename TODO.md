## TODO

### Models
- Create a Dev version that contains full debug and trace capabilities
- Create a Prod version that is light weight.

### CSS Flow Setting change
- need to change the css flow
  - setting should be dropdown menu for pre-installed defaults (default, dark, tomorrow,markprint, etc)
  - setting should also have a toggle to enable file override, if true file will always override.

[markdown document] 
   │
   ▼
extension.js: makeHtml() – orchestrator that builds the HTML template.
   │        It asks readStyles() for CSS, sets title/content/mermaid script,
   │        and renders template/template.html with Mustache.
   │
   ▼
extension.js: readStyles(uri)
   │
   ├─(A) Built-in defaults (always inline via makeCss):
   │     • styles/markdown.css – Microsoft’s base Markdown preview theme (fonts,
   │       layout primitives, blockquote baseline)
   │     • node_modules/highlight.js styles – syntax highlighting palette
   │     • styles/markprint.css – legacy MarkPrint tweaks (pre formatting, blockquotes, etc.)
   │
   ├─(B) VS Code markdown.styles (if markprint.includeDefaultStyles=true)
   │     • Each entry is resolved with resolveSettingPath() and fixHref()
   │     • Injected as `<link rel="stylesheet" ...>` so VS Code preview styles can piggyback
   │
   └─(C) markprint.styles (your custom stack)
         • `${workspaceFolder}/styles/markprint-magazine.css` now expands to the real
           path under the active workspace, so the browser can fetch it
         • Still linked rather than inlined, so the original file stays separate