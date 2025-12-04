## TODO

### CSS Injection Order Review
- The HTML/PDF renderer still injects styles in multiple passes (`styles/markdown.css`, `markdown.styles`, highlight theme, `styles/mark-print.css`, then entries from `markprint.styles`). Even with `markprint.styles` defined, earlier files can override rules if they share selectors or load later in the stack.
- Inspect `readStyles()` in `extension.js` (around lines 810-880). Confirm the exact order in which stylesheets are concatenated and how `markprint.includeDefaultStyles`, `markdown.styles`, `markprint.styles`, and default files interact.
- Decide whether `styles/mark-print.css` should remain in the pipeline when custom styles are provided. If not, gate it behind a setting or ensure custom files always load last.
- Consider adding specificity (e.g., `article blockquote`) or `!important` in `markprint-magazine.css` if load order alone isn't sufficient.
- Document the expected behavior for users so they know how to ensure their custom styles override the defaults.


### Path Review
- all file paths need to be reviewed. for each file path described, evaluate if absolut or relitive or both would be appropriate. then logic will have to be made to accomadate in all events.