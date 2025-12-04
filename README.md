# MarkPrint

This extension converts Markdown files to pdf, html, png or jpeg files.

[Japanese README](README.ja.md)

## Table of Contents
<!-- TOC depthFrom:2 depthTo:2 updateOnSave:false -->

- [Specification Changes](#specification-changes)
- [Features](#features)
- [Install](#install)
- [Usage](#usage)
- [Extension Settings](#extension-settings)
- [Options](#options)
- [FAQ](#faq)
- [Known Issues](#known-issues)
- [Release Notes](#release-notes)
- [License](#license)
- [Special thanks](#special-thanks)

<!-- /TOC -->

<div class="page"/>

## Specification Changes

- Default Date Format for PDF Headers and Footers Modified
  - Starting from version 1.5.0, the default date format for headers and footers has been changed to the ISO-based format (YYYY-MM-DD).
  - This change aims to improve the consistency of date displays, as the previous format could vary depending on the environment.
  - If you wish to use the previous format, please refer to [mark-print.headerTemplate](#mark-printheadertemplate).

## Features

Supports the following features
* [Syntax highlighting](https://highlightjs.org/static/demo/)
* [emoji](https://www.webfx.com/tools/emoji-cheat-sheet/)
* [markdown-it-checkbox](https://github.com/mcecot/markdown-it-checkbox)
* [markdown-it-container](https://github.com/markdown-it/markdown-it-container)
* [markdown-it-include](https://github.com/camelaissani/markdown-it-include)
* [PlantUML](https://plantuml.com/)
  * [markdown-it-plantuml](https://github.com/gmunguia/markdown-it-plantuml)
* [mermaid](https://mermaid-js.github.io/mermaid/)

Sample files
 * [pdf](sample/README.pdf)
 * [html](sample/README.html)
 * [png](sample/README.png)
 * [jpeg](sample/README.jpeg)

### markdown-it-container

INPUT
```
::: warning
*here be dragons*
:::
```

OUTPUT
``` html
<div class="warning">
<p><em>here be dragons</em></p>
</div>
```

### markdown-it-plantuml

INPUT
```
@startuml
Bob -[#red]> Alice : hello
Alice -[#0000FF]->Bob : ok
@enduml
```

OUTPUT

![PlantUML](images/PlantUML.png)

### markdown-it-include

Include markdown fragment files: `:[alternate-text](relative-path-to-file.md)`.

```
├── [plugins]
│  └── README.md
├── CHANGELOG.md
└── README.md
```

INPUT
```
README Content

:[Plugins](./plugins/README.md)

:[Changelog](CHANGELOG.md)
```

OUTPUT
```
Content of README.md

Content of plugins/README.md

Content of CHANGELOG.md
```

### mermaid

INPUT
<pre>
```mermaid
stateDiagram
    [*] --> First
    state First {
        [*] --> second
        second --> [*]
    }
```
</pre>

OUTPUT

![mermaid](images/mermaid.png)

## Install

Chromium download starts automatically when MarkPrint is installed and Markdown file is first opened with Visual Studio Code.

However, it is time-consuming depending on the environment because of its large size (~ 170Mb Mac, ~ 282Mb Linux, ~ 280Mb Win).

During downloading, the message `Installing Chromium` is displayed in the status bar.

If you are behind a proxy, set the `http.proxy` option to settings.json and restart Visual Studio Code.

If the download is not successful or you want to avoid downloading every time you upgrade MarkPrint, please specify the installed [Chrome](https://www.google.co.jp/chrome/) or 'Chromium' with [mark-print.executablePath](#mark-printexecutablepath) option.

<div class="page"/>

## Usage

### Command Palette

1. Open the Markdown file
1. Press `F1` or `Ctrl+Shift+P`
1. Type `export` and select below
   * `mark-print: Export (settings.json)`
   * `mark-print: Export (pdf)`
   * `mark-print: Export (html)`
   * `mark-print: Export (png)`
   * `mark-print: Export (jpeg)`
   * `mark-print: Export (all: pdf, html, png, jpeg)`

![usage1](images/usage1.gif)

### Menu

1. Open the Markdown file
1. Right click and select below
   * `mark-print: Export (settings.json)`
   * `mark-print: Export (pdf)`
   * `mark-print: Export (html)`
   * `mark-print: Export (png)`
   * `mark-print: Export (jpeg)`
   * `mark-print: Export (all: pdf, html, png, jpeg)`

![usage2](images/usage2.gif)

### Auto convert

1. Add `"mark-print.convertOnSave": true` option to **settings.json**
1. Restart Visual Studio Code
1. Open the Markdown file
1. Auto convert on save

## Extension Settings

[Visual Studio Code User and Workspace Settings](https://code.visualstudio.com/docs/customization/userandworkspace)

1. Select **File > Preferences > UserSettings or Workspace Settings**
1. Find mark-print settings in the **Default Settings**
1. Copy `mark-print.*` settings
1. Paste to the **settings.json**, and change the value

![demo](images/settings.gif)

## Options

### List

|Category|Option name|[Configuration scope](https://code.visualstudio.com/api/references/contribution-points#Configuration-property-schema)|
|:---|:---|:---|
|[Save options](#save-options)|[mark-print.type](#mark-printtype)| |
||[mark-print.convertOnSave](#mark-printconvertonsave)| |
||[mark-print.convertOnSaveExclude](#mark-printconvertonsaveexclude)| |
||[mark-print.outputDirectory](#mark-printoutputdirectory)| |
||[mark-print.outputDirectoryRelativePathFile](#mark-printoutputdirectoryrelativepathfile)| |
|[Styles options](#styles-options)|[mark-print.styles](#mark-printstyles)| |
||[mark-print.stylesRelativePathFile](#mark-printstylesrelativepathfile)| |
||[mark-print.includeDefaultStyles](#mark-printincludedefaultstyles)| |
|[Syntax highlight options](#syntax-highlight-options)|[mark-print.highlight](#mark-printhighlight)| |
||[mark-print.highlightStyle](#mark-printhighlightstyle)| |
|[Markdown options](#markdown-options)|[mark-print.breaks](#mark-printbreaks)| |
|[Emoji options](#emoji-options)|[mark-print.emoji](#mark-printemoji)| |
|[Configuration options](#configuration-options)|[mark-print.executablePath](#mark-printexecutablepath)| |
|[Common Options](#common-options)|[mark-print.scale](#mark-printscale)| |
|[PDF options](#pdf-options)|[mark-print.displayHeaderFooter](#mark-printdisplayheaderfooter)|resource|
||[mark-print.headerTemplate](#mark-printheadertemplate)|resource|
||[mark-print.footerTemplate](#mark-printfootertemplate)|resource|
||[mark-print.printBackground](#mark-printprintbackground)|resource|
||[mark-print.orientation](#mark-printorientation)|resource|
||[mark-print.pageRanges](#mark-printpageranges)|resource|
||[mark-print.format](#mark-printformat)|resource|
||[mark-print.width](#mark-printwidth)|resource|
||[mark-print.height](#mark-printheight)|resource|
||[mark-print.margin.top](#mark-printmargintop)|resource|
||[mark-print.margin.bottom](#mark-printmarginbottom)|resource|
||[mark-print.margin.right](#mark-printmarginright)|resource|
||[mark-print.margin.left](#mark-printmarginleft)|resource|
|[PNG JPEG options](#png-jpeg-options)|[mark-print.quality](#mark-printquality)| |
||[mark-print.clip.x](#mark-printclipx)| |
||[mark-print.clip.y](#mark-printclipy)| |
||[mark-print.clip.width](#mark-printclipwidth)| |
||[mark-print.clip.height](#mark-printclipheight)| |
||[mark-print.omitBackground](#mark-printomitbackground)| |
|[PlantUML options](#plantuml-options)|[mark-print.plantumlOpenMarker](#mark-printplantumlopenmarker)| |
||[mark-print.plantumlCloseMarker](#mark-printplantumlclosemarker)| |
||[mark-print.plantumlServer](#mark-printplantumlserver)| |
|[markdown-it-include options](#markdown-it-include-options)|[mark-print.markdown-it-include.enable](#mark-printmarkdown-it-includeenable)| |
|[mermaid options](#mermaid-options)|[mark-print.mermaidServer](#mark-printmermaidserver)| |

### Save options

#### `mark-print.type`
  - Output format: pdf, html, png, jpeg
  - Multiple output formats support
  - Default: pdf

```javascript
"mark-print.type": [
  "pdf",
  "html",
  "png",
  "jpeg"
],
```

#### `mark-print.convertOnSave`
  - Enable Auto convert on save
  - boolean. Default: false
  - To apply the settings, you need to restart Visual Studio Code

#### `mark-print.convertOnSaveExclude`
  - Excluded file name of convertOnSave option

```javascript
"mark-print.convertOnSaveExclude": [
  "^work",
  "work.md$",
  "work|test",
  "[0-9][0-9][0-9][0-9]-work",
  "work\\test"  // All '\' need to be written as '\\' (Windows)
],
```

#### `mark-print.outputDirectory`
  - Output Directory
  - All `\` need to be written as `\\` (Windows)

```javascript
"mark-print.outputDirectory": "C:\\work\\output",
```

  - Relative path
    - If you open the `Markdown file`, it will be interpreted as a relative path from the file
    - If you open a `folder`, it will be interpreted as a relative path from the root folder
    - If you open the `workspace`, it will be interpreted as a relative path from the each root folder
      - See [Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces)

```javascript
"mark-print.outputDirectory": "output",
```

  - Relative path (home directory)
    - If path starts with  `~`, it will be interpreted as a relative path from the home directory

```javascript
"mark-print.outputDirectory": "~/output",
```

  - If you set a directory with a `relative path`, it will be created if the directory does not exist
  - If you set a directory with an `absolute path`, an error occurs if the directory does not exist

#### `mark-print.outputDirectoryRelativePathFile`
  - If `mark-print.outputDirectoryRelativePathFile` option is set to `true`, the relative path set with [mark-print.outputDirectory](#mark-printoutputDirectory) is interpreted as relative from the file
  - It can be used to avoid relative paths from folders and workspaces
  - boolean. Default: false

### Styles options

#### `mark-print.styles`
  - A list of local paths to the stylesheets to use from the mark-print
  - If the file does not exist, it will be skipped
  - All `\` need to be written as `\\` (Windows)

```javascript
"mark-print.styles": [
  "C:\\Users\\<USERNAME>\\Documents\\mark-print.css",
  "/home/<USERNAME>/settings/mark-print.css",
],
```

  - Relative path
    - If you open the `Markdown file`, it will be interpreted as a relative path from the file
    - If you open a `folder`, it will be interpreted as a relative path from the root folder
    - If you open the `workspace`, it will be interpreted as a relative path from the each root folder
      - See [Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces)

```javascript
"mark-print.styles": [
  "mark-print.css",
],
```

  - Relative path (home directory)
    - If path starts with `~`, it will be interpreted as a relative path from the home directory

```javascript
"mark-print.styles": [
  "~/.config/Code/User/mark-print.css"
],
```

  - Online CSS (https://xxx/xxx.css) is applied correctly for JPG and PNG, but problems occur with PDF [#67](https://github.com/gh4-io/MarkPrint/issues/67)

```javascript
"mark-print.styles": [
  "https://xxx/mark-print.css"
],
```

#### `mark-print.stylesRelativePathFile`

  - If `mark-print.stylesRelativePathFile` option is set to `true`, the relative path set with [mark-print.styles](#mark-printstyles) is interpreted as relative from the file
  - It can be used to avoid relative paths from folders and workspaces
  - boolean. Default: false

#### `mark-print.includeDefaultStyles`
  - Enable the inclusion of default Markdown styles (VSCode, mark-print)
  - boolean. Default: true

### Syntax highlight options

#### `mark-print.highlight`
  - Enable Syntax highlighting
  - boolean. Default: true

#### `mark-print.highlightStyle`
  - Set the style file name. for example: github.css, monokai.css ...
  - [file name list](https://github.com/isagalaev/highlight.js/tree/master/src/styles)
  - demo site : https://highlightjs.org/static/demo/

```javascript
"mark-print.highlightStyle": "github.css",
```

### Markdown options

#### `mark-print.breaks`
  - Enable line breaks
  - boolean. Default: false

### Emoji options

#### `mark-print.emoji`
  - Enable emoji. [EMOJI CHEAT SHEET](https://www.webpagefx.com/tools/emoji-cheat-sheet/)
  - boolean. Default: true

### Configuration options

#### `mark-print.executablePath`
  - Path to a Chromium or Chrome executable to run instead of the bundled Chromium
  - All `\` need to be written as `\\` (Windows)
  - To apply the settings, you need to restart Visual Studio Code

```javascript
"mark-print.executablePath": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
```

### Common Options

#### `mark-print.scale`
  - Scale of the page rendering
  - number. default: 1

```javascript
"mark-print.scale": 1
```

### PDF options

  - pdf only. [puppeteer page.pdf options](https://github.com/puppeteer/puppeteer/blob/main/docs/api/puppeteer.pdfoptions.md)

#### `mark-print.displayHeaderFooter`
  - Enables header and footer display
  - boolean. Default: true
  - Activating this option will display both the header and footer
  - If you wish to display only one of them, remove the value for the other
  - To hide the header
    ```javascript
    "mark-print.headerTemplate": "",
    ```
  - To hide the footer
    ```javascript
    "mark-print.footerTemplate": "",
    ```

#### `mark-print.headerTemplate`
  - Specifies the HTML template for outputting the header
  - To use this option, you must set `mark-print.displayHeaderFooter` to `true`
  - `<span class='date'></span>` : formatted print date. The format depends on the environment
  - `<span class='title'></span>` : markdown file name
  - `<span class='url'></span>` : markdown full path name
  - `<span class='pageNumber'></span>` : current page number
  - `<span class='totalPages'></span>` : total pages in the document
  - `%%ISO-DATETIME%%` : current date and time in ISO-based format (`YYYY-MM-DD hh:mm:ss`)
  - `%%ISO-DATE%%` : current date in ISO-based format (`YYYY-MM-DD`)
  - `%%ISO-TIME%%` : current time in ISO-based format (`hh:mm:ss`)
  - Default (version 1.5.0 and later): Displays the Markdown file name and the date using `%%ISO-DATE%%`
    ```javascript
    "mark-print.headerTemplate": "<div style=\"font-size: 9px; margin-left: 1cm;\"> <span class='title'></span></div> <div style=\"font-size: 9px; margin-left: auto; margin-right: 1cm; \">%%ISO-DATE%%</div>",
    ```
  - Default (version 1.4.4 and earlier): Displays the Markdown file name and the date using `<span class='date'></span>`
    ```javascript
    "mark-print.headerTemplate": "<div style=\"font-size: 9px; margin-left: 1cm;\"> <span class='title'></span></div> <div style=\"font-size: 9px; margin-left: auto; margin-right: 1cm; \"> <span class='date'></span></div>",
    ```

#### `mark-print.footerTemplate`
  - Specifies the HTML template for outputting the footer
  - For more details, refer to [mark-print.headerTemplate](#mark-printheadertemplate)
  - Default: Displays the {current page number} / {total pages in the document}
    ```javascript
    "mark-print.footerTemplate": "<div style=\"font-size: 9px; margin: 0 auto;\"> <span class='pageNumber'></span> / <span class='totalPages'></span></div>",
    ```

#### `mark-print.printBackground`
  - Print background graphics
  - boolean. Default: true

#### `mark-print.orientation`
  - Paper orientation
  - portrait or landscape
  - Default: portrait

#### `mark-print.pageRanges`
  - Paper ranges to print, e.g., '1-5, 8, 11-13'
  - Default: all pages

```javascript
"mark-print.pageRanges": "1,4-",
```

#### `mark-print.format`
  - Paper format
  - Letter, Legal, Tabloid, Ledger, A0, A1, A2, A3, A4, A5, A6
  - Default: A4

```javascript
"mark-print.format": "A4",
```

#### `mark-print.width`
#### `mark-print.height`
  - Paper width / height, accepts values labeled with units(mm, cm, in, px)
  - If it is set, it overrides the mark-print.format option

```javascript
"mark-print.width": "10cm",
"mark-print.height": "20cm",
```

#### `mark-print.margin.top`
#### `mark-print.margin.bottom`
#### `mark-print.margin.right`
#### `mark-print.margin.left`
  - Paper margins.units(mm, cm, in, px)

```javascript
"mark-print.margin.top": "1.5cm",
"mark-print.margin.bottom": "1cm",
"mark-print.margin.right": "1cm",
"mark-print.margin.left": "1cm",
```

### PNG, JPEG options

  - png and jpeg only. [puppeteer page.screenshot options](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#pagescreenshotoptions)

#### `mark-print.quality`
  - jpeg only. The quality of the image, between 0-100. Not applicable to png images

```javascript
"mark-print.quality": 100,
```

#### `mark-print.clip.x`
#### `mark-print.clip.y`
#### `mark-print.clip.width`
#### `mark-print.clip.height`
  - An object which specifies clipping region of the page
  - number

```javascript
//  x-coordinate of top-left corner of clip area
"mark-print.clip.x": 0,

// y-coordinate of top-left corner of clip area
"mark-print.clip.y": 0,

// width of clipping area
"mark-print.clip.width": 1000,

// height of clipping area
"mark-print.clip.height": 1000,
```

#### `mark-print.omitBackground`
  - Hides default white background and allows capturing screenshots with transparency
  - boolean. Default: false

### PlantUML options

#### `mark-print.plantumlOpenMarker`
  - Oppening delimiter used for the plantuml parser.
  - Default: @startuml

#### `mark-print.plantumlCloseMarker`
  - Closing delimiter used for the plantuml parser.
  - Default: @enduml

#### `mark-print.plantumlServer`
  - Plantuml server. e.g. http://localhost:8080
  - Default: http://www.plantuml.com/plantuml
  - For example, to run Plantuml Server locally [#139](https://github.com/gh4-io/MarkPrint/issues/139) :
    ```
    docker run -d -p 8080:8080 plantuml/plantuml-server:jetty
    ```
    [plantuml/plantuml-server - Docker Hub](https://hub.docker.com/r/plantuml/plantuml-server/)

### markdown-it-include options

#### `mark-print.markdown-it-include.enable`
  - Enable markdown-it-include.
  - boolean. Default: true

### mermaid options

#### `mark-print.mermaidServer`
  - mermaid server
  - Default: https://unpkg.com/mermaid/dist/mermaid.min.js

<div class="page"/>

## FAQ

### How can I change emoji size ?

1. Add the following to your stylesheet which was specified in the mark-print.styles

```css
.emoji {
  height: 2em;
}
```

### Auto guess encoding of files

Using `files.autoGuessEncoding` option of the Visual Studio Code is useful because it automatically guesses the character code. See [files.autoGuessEncoding](https://code.visualstudio.com/updates/v1_11#_auto-guess-encoding-of-files)

```javascript
"files.autoGuessEncoding": true,
```

### Output directory

If you always want to output to the relative path directory from the Markdown file.

For example, to output to the "output" directory in the same directory as the Markdown file, set it as follows.

```javascript
"mark-print.outputDirectory" : "output",
"mark-print.outputDirectoryRelativePathFile": true,
```

### Page Break

Please use the following to insert a page break.

``` html
<div class="page"/>
```

<div class="page"/>

## Known Issues

### `mark-print.styles` option
* Online CSS (https://xxx/xxx.css) is applied correctly for JPG and PNG, but problems occur with PDF. [#67](https://github.com/gh4-io/MarkPrint/issues/67)


## [Release Notes](CHANGELOG.md)

### 1.5.0 (2023/09/08)
* Improve: The default date format for headers and footers has been changed to the ISO-based format (YYYY-MM-DD).
  * Support different date formats in templates [#197](https://github.com/gh4-io/MarkPrint/pull/197)
* Improve: Avoid TimeoutError: Navigation timeout of 30000 ms exceeded and TimeoutError: waiting for Page.printToPDF failed: timeout 30000ms exceeded [#266](https://github.com/gh4-io/MarkPrint/pull/266)
* Fix: Fix description of outputDirectoryRelativePathFile [#238](https://github.com/gh4-io/MarkPrint/pull/238)
* README
  * Add: Specification Changes
  * Fix: Broken link

## License

MIT


## Special thanks
* [GoogleChrome/puppeteer](https://github.com/GoogleChrome/puppeteer)
* [markdown-it/markdown-it](https://github.com/markdown-it/markdown-it)
* [mcecot/markdown-it-checkbox](https://github.com/mcecot/markdown-it-checkbox)
* [leff/markdown-it-named-headers](https://github.com/leff/markdown-it-named-headers)
* [markdown-it/markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji)
* [HenrikJoreteg/emoji-images](https://github.com/HenrikJoreteg/emoji-images)
* [isagalaev/highlight.js](https://github.com/isagalaev/highlight.js)
* [cheeriojs/cheerio](https://github.com/cheeriojs/cheerio)
* [janl/mustache.js](https://github.com/janl/mustache.js)
* [markdown-it/markdown-it-container](https://github.com/markdown-it/markdown-it-container)
* [gmunguia/markdown-it-plantuml](https://github.com/gmunguia/markdown-it-plantuml)
* [camelaissani/markdown-it-include](https://github.com/camelaissani/markdown-it-include)
* [mermaid-js/mermaid](https://github.com/mermaid-js/mermaid)
* [jonschlinkert/gray-matter](https://github.com/jonschlinkert/gray-matter)

and

* [cakebake/markdown-themeable-pdf](https://github.com/cakebake/markdown-themeable-pdf)
