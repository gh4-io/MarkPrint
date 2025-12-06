# fast-xml-parser – Technical Research Workup (Dec 2025)

> **Package**: `fast-xml-parser` (FXP)
> **Ecosystem**: npm (Node.js + Browser)
> **Latest version (Dec 2, 2025)**: `5.3.2` ([VulnGuide][1])
> **License**: MIT ([Yarn][2])
> **Homepage**: naturalintelligence.github.io/fast-xml-parser/ ([naturalintelligence.github.io][3])
> **Repo**: github.com/NaturalIntelligence/fast-xml-parser ([GitHub][4])

---

## 1. High-level Overview

`fast-xml-parser` is a pure JavaScript library for:

* **Validating XML**
* **Parsing XML → JS objects / JSON**
* **Building XML ← JS objects**

The project describes itself as: “Validate XML, Parse XML to JS Object, or Build XML from JS Object without C/C++ based libraries and no callback.” ([Yarn][2])

Key characteristics:

* Pure JS implementation (no native bindings)
* Works in **Node.js**, **browsers**, and via **CLI** ([Medium][5])
* Supports **CommonJS** and **ESM** builds ([Yarn][2])
* Focuses on being **faster than other pure JS parsers**; project pages show benchmark graphs comparing to alternatives ([GitHub][6])
* Widely adopted: about **42M+ weekly downloads** and classified as a **“Key ecosystem project”** by Snyk ([VulnGuide][1])

The library has been around for ~8 years with a healthy release cadence; the latest version `5.3.2` was released on Nov 14, 2025. ([VulnGuide][1])

---

## 2. Installation & Basic Usage

### 2.1 Install

```bash
npm install fast-xml-parser
# or
yarn add fast-xml-parser
# or
pnpm add fast-xml-parser
```

Standard npm metadata confirms usual installation via npm/yarn/pnpm. ([npm][7])

### 2.2 Importing

**CommonJS**:

```js
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
```

**ESM / TypeScript**:

```ts
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
```

The package exposes these named exports in both CJS and ESM bundles. ([GitHub][4])

### 2.3 Basic Parsing Example

```js
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser(); // default options
const xmlData = `<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading reminder="true">Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`;

const result = parser.parse(xmlData);
console.log(result);

/*
{
  note: {
    to: 'Tove',
    from: 'Jani',
    heading: 'Reminder',
    body: "Don't forget me this weekend!"
  }
}
*/
```

This pattern follows the “Getting started” examples from the docs and community tutorials. ([GitHub][8])

### 2.4 Basic Building Example (JSON → XML)

```js
import { XMLBuilder } from 'fast-xml-parser';

const builder = new XMLBuilder();
const jsObj = {
  note: {
    to: 'Tove',
    from: 'Jani',
    heading: 'Reminder',
    body: "Don't forget me this weekend!"
  }
};

const xml = builder.build(jsObj);
console.log(xml);
```

### 2.5 XML Validation

```js
import { XMLValidator } from 'fast-xml-parser';

const xmlData = '<root><child>ok</child></root>';
const res = XMLValidator.validate(xmlData);

if (res === true) {
  console.log('Valid XML');
} else {
  console.error('Invalid XML:', res.err);
}
```

Validation is a first-class feature of FXP, and is frequently showcased in docs and blog posts. ([naturalintelligence.github.io][3])

---

## 3. Core API Surface (v5.x)

The main public API consists of:

1. **`XMLParser`** – parse XML → JS object
2. **`XMLBuilder`** – build XML ← JS object
3. **`XMLValidator`** – validate XML syntax

### 3.1 `XMLParser`

```js
const parser = new XMLParser(options?);
const obj = parser.parse(xmlString);
```

Common options (wording adapted from docs and examples): ([naturalintelligence.github.io][3])

* `ignoreAttributes` (boolean; often defaults to `true`)

  * When `false`, attributes are included on objects.
* `attributeNamePrefix` (string, e.g. `"@_"`)

  * Attributes are stored using this prefix on keys (`"@_id"`, `"@_class"`).
* `allowBooleanAttributes` (boolean)

  * Enables handling attributes that have no value (e.g. `<input disabled>`).
* `parseTagValue` / `parseAttributeValue` (boolean)

  * Enable parsing of textual values into numbers/booleans when possible.
* `parseTrueNumberOnly` (boolean)

  * Only parse strings that are clearly numeric into numbers, reducing false positives.
* `trimValues` (boolean)

  * Trim whitespace around text nodes.
* `preserveOrder` (boolean)

  * When true, returns an array of nodes preserving exact order; useful for some XML grammars.
* `ignoreDeclaration`, `ignorePi`

  * Ignore XML declaration (`<?xml...?>`) and processing instructions.
* `ignoreNameSpace` / `removeNSPrefix`

  * Control namespace handling; either drop namespace prefixes from tag/attribute names or preserve them.
* `isArray`

  * Custom rules for when a tag should always be parsed as an array.
* `stopNodes`

  * XPath-like patterns where parsing should stop and leave raw content (e.g., embedded HTML).

#### Namespace + attributes example

Stack Overflow examples show typical config for preserving both attributes and namespaces: ([Stack Overflow][9])

```js
import { XMLParser } from 'fast-xml-parser';

const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  ignoreNameSpace: false,
};

const parser = new XMLParser(options);

const xml = `<ns:root myAttr="value">
  <ns:item id="1">A</ns:item>
</ns:root>`;

const result = parser.parse(xml);
/*
{
  "ns:root": {
    "@_myAttr": "value",
    "ns:item": [
      {
        "@_id": "1",
        "#text": "A"
      }
    ]
  }
}
*/
```

### 3.2 `XMLBuilder`

```js
const builder = new XMLBuilder(options?);
const xml = builder.build(jsObj);
```

Builder options broadly mirror the parser’s, to enable round-tripping: ([GitHub][8])

* `ignoreAttributes`, `attributeNamePrefix` – must match parsing options
* `suppressEmptyNode` – use `<tag/>` vs `<tag></tag>`
* `format`, `indentBy` – pretty printing
* `cdataPropName` – key used to represent CDATA in objects

### 3.3 `XMLValidator`

```js
const res = XMLValidator.validate(xmlString, validatorOptions?);
```

* Returns `true` for valid XML
* Otherwise returns an object, typically `{ err: { code, msg, line, col } }`

Docs and examples recommend using it as a separate first step before parsing untrusted XML. ([naturalintelligence.github.io][3])

---

## 4. Configuration Patterns & Gotchas

### 4.1 Preserving attributes and namespaces

From Q&A and docs, typical recipe: ([Stack Overflow][9])

```js
const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreNameSpace: false,
  attributeNamePrefix: '@_',
});
```

Then to access:

```js
const attrValue = obj['ns:root']['@_myAttr'];
```

If you change `attributeNamePrefix` between parse and build, you’ll break round-trip fidelity.

### 4.2 Arrays vs single objects

FXP sometimes returns a single object, sometimes an array, depending on repetition and `isArray` settings. For schema-less data, you often need a helper:

```js
const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);
```

For schema-aware systems, prefer configuring `isArray` at construction so the shape is deterministic.

### 4.3 Numeric & boolean coercion

`parseTagValue`, `parseAttributeValue`, and `parseTrueNumberOnly` control automatic casting such as:

* `"123"` → `123`
* `"true"` → `true`

Good practice in security-sensitive code:

* Disable coercion and perform parsing yourself **or**
* Only enable coercion for trusted feeds you fully control.

### 4.4 Large documents & streaming

FXP’s core API consumes a full **string** and returns a full **JS object**; it does **not** offer a streaming interface. Community tools occasionally wrap it but internally it’s in-memory. ([Reddit][10])

For very large XML (hundreds of MB / GB):

* Consider reading and parsing manageable chunks or splitting by business boundaries (if XML structure allows).
* For true streaming workloads, use `sax`, `node-expat`, or other event-based parsers and then transform events into objects.

---

## 5. Performance Characteristics

### 5.1 Benchmarks

The project’s GitHub README and site show benchmark charts where `fast-xml-parser` outperforms `xml2js`, `xml-js`, and others in requests per second for both parsing and building across several XML sizes. ([GitHub][6])

Independent blog posts and tutorials also highlight its speed and ability to handle XML files in the 100MB–800MB range in realistic scenarios. ([Geshan's Blog][11])

### 5.2 Performance tips

* Avoid `preserveOrder: true` unless you require an ordered representation; it’s slower and more memory heavy.
* If you don’t use attributes, leave `ignoreAttributes: true` (the default) for a simpler object and faster parsing.
* Turn off numeric/boolean coercion if not needed; extra parsing work can cost CPU.
* Use `stopNodes` to bypass heavy subtrees that you intend to treat as raw XML/HTML.

---

## 6. Security Posture

### 6.1 Current status (v5.3.2)

Security dashboards (Snyk, etc.) list the latest version `5.3.2` as **having no known security issues**, with a healthy maintenance score and only one runtime dependency (`strnum`). ([VulnGuide][1])

### 6.2 Historical vulnerabilities

There *have* been notable issues in older versions:

1. **Prototype Pollution (pre-4.1.2)**

   * Snyk documents prototype pollution vulnerabilities around unsafe handling of attribute names (e.g. keys like `__proto__`) in 3.x / early 4.x; recommendation was upgrading to ≥4.1.2. ([VulnGuide][12])

2. **Regular Expression Denial of Service (ReDoS) in 4.x**

   * CVE-2023-34104: entity name handling allowed special characters unsafely; entity names were used to build regexes, enabling DoS. ([NVD][13])
   * CVE-2024-41818 (GHSA-mpg4-rc92-vx8v): ReDoS in currency parsing logic; fixed in `4.4.1`. ([CVE Details][14])

3. **Impact on dependents**

   * The vulnerability series triggered high-severity alerts in big downstream consumers like AWS SDK v3, which relied on FXP. Discussions clarified which versions were actually affected and which SDK versions were safe. ([GitHub][15])

As of late 2025, security pages show **0 vulnerabilities** affecting the latest version, with four total past vulnerabilities all fixed in newer releases. ([VulnGuide][1])

### 6.3 Secure usage guidelines

* **Version hygiene**

  * Use `5.x` or, if constrained to `4.x`, at least `≥4.4.1` to avoid known ReDoS issues. ([CVE Details][14])
* **Constrain input**

  * Enforce request size limits and timeouts at the HTTP and application layers for any untrusted XML.
* **Minimal features**

  * Disable numeric/boolean coercion, entity expansions, and unnecessary options for untrusted input.
* **Monitoring**

  * Keep `npm audit`, Snyk, or similar tools enabled to catch future CVEs.
* **Report responsibly**

  * The repo has a documented security policy using Tidelift’s coordinated disclosure process. ([GitHub][16])

---

## 7. Ecosystem Health & Maintenance

From Snyk’s package health and npm stats: ([VulnGuide][1])

* **Age**: ~8 years on npm
* **Latest version**: `5.3.2` (Nov 14, 2025)
* **Releases in 2025**: multiple 5.2.x and 5.3.x versions, indicating active development
* **Downloads**: ~42.8M per week
* **Stars / forks**: ~3k stars and ~339 forks on GitHub ([GitHub][4])
* **Maintenance**: Marked “HEALTHY” with ongoing commits and issues/PRs activity ([VulnGuide][1])

Overall, ecosystem signals point to a **stable, actively maintained** project that many other packages depend on.

---

## 8. Comparison with Alternatives

### 8.1 `xml2js`

* **Style**: Callback / Promise-based, object-oriented parser.
* **Pros**:

  * Very mature and widely known.
  * Stable API, lots of blog posts and Stack Overflow answers.
* **Cons**:

  * Benchmarks often show it slower than `fast-xml-parser` on large data sets. ([Stack Overflow][17])

### 8.2 `xml-js`

* Converts XML directly to a JSON representation with a different structural model.
* Benchmarks suggest it’s generally slower and more memory-intense than FXP for many workloads. ([Npm Compare][18])

### 8.3 `tXml`

* A tiny (~1.5kb gzipped) zero-dependency parser with claims of being 2-3x faster than FXP and 5-10x faster than `xml2js` in its benchmarks. ([GitHub][19])
* More minimal API and fewer configuration knobs than FXP.
* Good when you care about tiny bundle size and extreme speed more than feature richness.

### 8.4 Streaming parsers (`sax`, `node-expat`, etc.)

* Event-based streaming suitable for huge XML streams.
* More complex to use, but avoid building the entire document in memory.
* FXP is easier to use for “normal” XML sizes where in-memory operation is acceptable.

### 8.5 Positioning summary

* Choose **`fast-xml-parser`** for general-purpose XML ↔ JS/JSON with good performance, configurability, and browser+Node support.
* Choose **streaming/event parsers** for very large / streaming workloads.
* Choose **tiny, minimal libraries** like `tXml` if you need ultra-small bundles and can live with reduced features.

---

## 9. Typical Use Cases

1. **Cloud & service SDKs**

   * Used internally by tools (like iterations of AWS SDK v3) to parse XML-based AWS protocols. ([GitHub][15])
2. **Config / import pipelines**

   * Ingesting XML from legacy systems (ERP/CRM exports, etc.) and turning them into JSON for modern apps. ([Geshan's Blog][11])
3. **Browser applications**

   * Handling map formats (e.g., GPX, KML), RSS/Atom feeds, or XML-based APIs directly in the browser. ([naturalintelligence.github.io][3])
4. **CLI tools & scripts**

   * Simple XML↔JSON converters and validators.

### Example: transforming an XML feed to JSON

```js
import fs from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  parseAttributeValue: true,
});

async function main() {
  const xml = await fs.readFile('feed.xml', 'utf8');
  const data = parser.parse(xml);

  const rawItems = data.feed.item;
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const jsonItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    publishedAt: item['@_pubDate'],
  }));

  await fs.writeFile('feed.json', JSON.stringify(jsonItems, null, 2));
}

main().catch((err) => {
  console.error('Failed to process feed:', err);
  process.exit(1);
});
```

---

## 10. Best Practices & Design Recommendations

### 10.1 Schema-aware parsing

* If you have an XSD or clear contract, tune `isArray`, namespace options, and attribute prefixes upfront.
* Don’t expose raw FXP output types deep into your app; instead, map them to domain objects in a single place.

### 10.2 Robust error handling

* Always validate with `XMLValidator` or wrap `parse` in try/catch for untrusted input.
* Avoid logging complete untrusted XML in production logs (risk of log flooding and sensitive-data leakage).
* For user-facing APIs, return generic “invalid XML” messages and log the details server-side only.

### 10.3 Version pinning & updates

* Pin a specific major version (`^5.3.2` or similar) and keep an eye on release notes and security advisories.
* Use `npm audit`, Snyk, GitHub Dependabot, etc. to track new vulnerabilities. ([VulnGuide][1])

### 10.4 Tests & fixtures

* Maintain canonical XML fixtures plus expected parsed objects in your test suite.
* Add round-trip tests (XML → JS → XML) where exact formatting matters.
* If you rely on particular option defaults (e.g., `ignoreAttributes`), assert those explicitly in tests to guard against future default changes.

---

## 11. Summary & Recommendation

As of **December 2, 2025**:

* `fast-xml-parser` is a **mature, widely adopted, and actively maintained** XML parser for Node.js and browsers. ([VulnGuide][1])
* The latest release `5.3.2` has **no known security vulnerabilities** according to major security databases. ([VulnGuide][1])
* It offers strong performance compared to other pure JS parsers and a rich set of configuration options for XML ↔ JS/JSON mapping. ([GitHub][6])
* Historical vulnerabilities (prototype pollution, ReDoS) have been addressed in newer releases; staying up to date is important. ([NVD][13])

**Practical recommendation:**

* For most Node.js / browser apps that need to parse and build XML and can work in memory, **`fast-xml-parser` is an excellent default choice**.
* For extremely large or streaming XML workloads, consider pairing it with streaming tools or using an event-based parser instead.

---

## Downloadable Markdown Report

I’ve also saved this research workup as a Markdown file you can download:

👉 **[Download the Markdown report](sandbox:/mnt/data/fast-xml-parser-workup.md)**

[1]: https://security.snyk.io/package/npm/fast-xml-parser "fast-xml-parser vulnerabilities | Snyk"
[2]: https://classic.yarnpkg.com/en/package/fast-xml-parser?utm_source=chatgpt.com "fast-xml-parser"
[3]: https://naturalintelligence.github.io/fast-xml-parser/?utm_source=chatgpt.com "Fast XML Parser"
[4]: https://github.com/NaturalIntelligence/fast-xml-parser "GitHub - NaturalIntelligence/fast-xml-parser: Validate XML, Parse XML and Build XML rapidly without C/C++ based libraries and no callback."
[5]: https://amitgupta-gwl.medium.com/fast-xml-parser-2634e614d104?utm_source=chatgpt.com "Fast XML Parser - Amit Kumar Gupta"
[6]: https://github.com/NaturalIntelligence/fast-xml-parser?utm_source=chatgpt.com "NaturalIntelligence/fast-xml-parser"
[7]: https://www.npmjs.com/package/fast-xml-parser?utm_source=chatgpt.com "fast-xml-parser"
[8]: https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/1.GettingStarted.md?utm_source=chatgpt.com "fast-xml-parser/docs/v4/1.GettingStarted.md at master"
[9]: https://stackoverflow.com/questions/53417925/what-fast-xml-parser-options-preserve-namespace-and-attributes-when-parsing-and?utm_source=chatgpt.com "What fast-xml-parser options preserve namespace and ..."
[10]: https://www.reddit.com/r/node/comments/lf8asu/delightful_data_parsing_first_opensource_project/?utm_source=chatgpt.com "Delightful data parsing. First open-source project! Looking ..."
[11]: https://geshan.com.np/blog/2022/11/nodejs-xml-parser/?utm_source=chatgpt.com "A beginner's guide to parse and create XML with Node.js"
[12]: https://security.snyk.io/package/npm/fast-xml-parser/3.21.1?utm_source=chatgpt.com "fast-xml-parser 3.21.1 vulnerabilities"
[13]: https://nvd.nist.gov/vuln/detail/cve-2023-34104?utm_source=chatgpt.com "CVE-2023-34104 Detail - NVD"
[14]: https://www.cvedetails.com/cve/CVE-2024-41818/?utm_source=chatgpt.com "CVE-2024-41818 - Fast-xml-parser"
[15]: https://github.com/aws/aws-sdk-js-v3/issues/6331?utm_source=chatgpt.com "Recent fast-xml-parser vulnerability now shows dozens of ..."
[16]: https://github.com/NaturalIntelligence/fast-xml-parser/security?utm_source=chatgpt.com "Security - NaturalIntelligence/fast-xml-parser"
[17]: https://stackoverflow.com/questions/5138086/fastest-way-to-parse-this-xml-in-js?utm_source=chatgpt.com "Fastest Way to Parse this XML in JS"
[18]: https://npm-compare.com/fast-xml-parser%2Cxml-js%2Cxml-parser%2Cxml2js?utm_source=chatgpt.com "fast-xml-parser vs xml2js vs xml-js vs xml-parser"
[19]: https://github.com/TobiasNickel/tXml?utm_source=chatgpt.com "TobiasNickel/tXml: :zap:very small and fast xml-parser in ..."
# fast-xml-parser – Technical Research Workup (Dec 2025)

> **Package**: `fast-xml-parser` (FXP)
> **Ecosystem**: npm (Node.js + Browser)
> **Latest version (Dec 2, 2025)**: `5.3.2` ([VulnGuide][1])
> **License**: MIT ([Yarn][2])
> **Homepage**: naturalintelligence.github.io/fast-xml-parser/ ([naturalintelligence.github.io][3])
> **Repo**: github.com/NaturalIntelligence/fast-xml-parser ([GitHub][4])

---

## 1. High-level Overview

`fast-xml-parser` is a pure JavaScript library for:

* **Validating XML**
* **Parsing XML → JS objects / JSON**
* **Building XML ← JS objects**

The project describes itself as: “Validate XML, Parse XML to JS Object, or Build XML from JS Object without C/C++ based libraries and no callback.” ([Yarn][2])

Key characteristics:

* Pure JS implementation (no native bindings)
* Works in **Node.js**, **browsers**, and via **CLI** ([Medium][5])
* Supports **CommonJS** and **ESM** builds ([Yarn][2])
* Focuses on being **faster than other pure JS parsers**; project pages show benchmark graphs comparing to alternatives ([GitHub][6])
* Widely adopted: about **42M+ weekly downloads** and classified as a **“Key ecosystem project”** by Snyk ([VulnGuide][1])

The library has been around for ~8 years with a healthy release cadence; the latest version `5.3.2` was released on Nov 14, 2025. ([VulnGuide][1])

---

## 2. Installation & Basic Usage

### 2.1 Install

```bash
npm install fast-xml-parser
# or
yarn add fast-xml-parser
# or
pnpm add fast-xml-parser
```

Standard npm metadata confirms usual installation via npm/yarn/pnpm. ([npm][7])

### 2.2 Importing

**CommonJS**:

```js
const { XMLParser, XMLBuilder, XMLValidator } = require('fast-xml-parser');
```

**ESM / TypeScript**:

```ts
import { XMLParser, XMLBuilder, XMLValidator } from 'fast-xml-parser';
```

The package exposes these named exports in both CJS and ESM bundles. ([GitHub][4])

### 2.3 Basic Parsing Example

```js
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser(); // default options
const xmlData = `<note>
  <to>Tove</to>
  <from>Jani</from>
  <heading reminder="true">Reminder</heading>
  <body>Don't forget me this weekend!</body>
</note>`;

const result = parser.parse(xmlData);
console.log(result);

/*
{
  note: {
    to: 'Tove',
    from: 'Jani',
    heading: 'Reminder',
    body: "Don't forget me this weekend!"
  }
}
*/
```

This pattern follows the “Getting started” examples from the docs and community tutorials. ([GitHub][8])

### 2.4 Basic Building Example (JSON → XML)

```js
import { XMLBuilder } from 'fast-xml-parser';

const builder = new XMLBuilder();
const jsObj = {
  note: {
    to: 'Tove',
    from: 'Jani',
    heading: 'Reminder',
    body: "Don't forget me this weekend!"
  }
};

const xml = builder.build(jsObj);
console.log(xml);
```

### 2.5 XML Validation

```js
import { XMLValidator } from 'fast-xml-parser';

const xmlData = '<root><child>ok</child></root>';
const res = XMLValidator.validate(xmlData);

if (res === true) {
  console.log('Valid XML');
} else {
  console.error('Invalid XML:', res.err);
}
```

Validation is a first-class feature of FXP, and is frequently showcased in docs and blog posts. ([naturalintelligence.github.io][3])

---

## 3. Core API Surface (v5.x)

The main public API consists of:

1. **`XMLParser`** – parse XML → JS object
2. **`XMLBuilder`** – build XML ← JS object
3. **`XMLValidator`** – validate XML syntax

### 3.1 `XMLParser`

```js
const parser = new XMLParser(options?);
const obj = parser.parse(xmlString);
```

Common options (wording adapted from docs and examples): ([naturalintelligence.github.io][3])

* `ignoreAttributes` (boolean; often defaults to `true`)

  * When `false`, attributes are included on objects.
* `attributeNamePrefix` (string, e.g. `"@_"`)

  * Attributes are stored using this prefix on keys (`"@_id"`, `"@_class"`).
* `allowBooleanAttributes` (boolean)

  * Enables handling attributes that have no value (e.g. `<input disabled>`).
* `parseTagValue` / `parseAttributeValue` (boolean)

  * Enable parsing of textual values into numbers/booleans when possible.
* `parseTrueNumberOnly` (boolean)

  * Only parse strings that are clearly numeric into numbers, reducing false positives.
* `trimValues` (boolean)

  * Trim whitespace around text nodes.
* `preserveOrder` (boolean)

  * When true, returns an array of nodes preserving exact order; useful for some XML grammars.
* `ignoreDeclaration`, `ignorePi`

  * Ignore XML declaration (`<?xml...?>`) and processing instructions.
* `ignoreNameSpace` / `removeNSPrefix`

  * Control namespace handling; either drop namespace prefixes from tag/attribute names or preserve them.
* `isArray`

  * Custom rules for when a tag should always be parsed as an array.
* `stopNodes`

  * XPath-like patterns where parsing should stop and leave raw content (e.g., embedded HTML).

#### Namespace + attributes example

Stack Overflow examples show typical config for preserving both attributes and namespaces: ([Stack Overflow][9])

```js
import { XMLParser } from 'fast-xml-parser';

const options = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  ignoreNameSpace: false,
};

const parser = new XMLParser(options);

const xml = `<ns:root myAttr="value">
  <ns:item id="1">A</ns:item>
</ns:root>`;

const result = parser.parse(xml);
/*
{
  "ns:root": {
    "@_myAttr": "value",
    "ns:item": [
      {
        "@_id": "1",
        "#text": "A"
      }
    ]
  }
}
*/
```

### 3.2 `XMLBuilder`

```js
const builder = new XMLBuilder(options?);
const xml = builder.build(jsObj);
```

Builder options broadly mirror the parser’s, to enable round-tripping: ([GitHub][8])

* `ignoreAttributes`, `attributeNamePrefix` – must match parsing options
* `suppressEmptyNode` – use `<tag/>` vs `<tag></tag>`
* `format`, `indentBy` – pretty printing
* `cdataPropName` – key used to represent CDATA in objects

### 3.3 `XMLValidator`

```js
const res = XMLValidator.validate(xmlString, validatorOptions?);
```

* Returns `true` for valid XML
* Otherwise returns an object, typically `{ err: { code, msg, line, col } }`

Docs and examples recommend using it as a separate first step before parsing untrusted XML. ([naturalintelligence.github.io][3])

---

## 4. Configuration Patterns & Gotchas

### 4.1 Preserving attributes and namespaces

From Q&A and docs, typical recipe: ([Stack Overflow][9])

```js
const parser = new XMLParser({
  ignoreAttributes: false,
  ignoreNameSpace: false,
  attributeNamePrefix: '@_',
});
```

Then to access:

```js
const attrValue = obj['ns:root']['@_myAttr'];
```

If you change `attributeNamePrefix` between parse and build, you’ll break round-trip fidelity.

### 4.2 Arrays vs single objects

FXP sometimes returns a single object, sometimes an array, depending on repetition and `isArray` settings. For schema-less data, you often need a helper:

```js
const toArray = (v) => (Array.isArray(v) ? v : v !== undefined ? [v] : []);
```

For schema-aware systems, prefer configuring `isArray` at construction so the shape is deterministic.

### 4.3 Numeric & boolean coercion

`parseTagValue`, `parseAttributeValue`, and `parseTrueNumberOnly` control automatic casting such as:

* `"123"` → `123`
* `"true"` → `true`

Good practice in security-sensitive code:

* Disable coercion and perform parsing yourself **or**
* Only enable coercion for trusted feeds you fully control.

### 4.4 Large documents & streaming

FXP’s core API consumes a full **string** and returns a full **JS object**; it does **not** offer a streaming interface. Community tools occasionally wrap it but internally it’s in-memory. ([Reddit][10])

For very large XML (hundreds of MB / GB):

* Consider reading and parsing manageable chunks or splitting by business boundaries (if XML structure allows).
* For true streaming workloads, use `sax`, `node-expat`, or other event-based parsers and then transform events into objects.

---

## 5. Performance Characteristics

### 5.1 Benchmarks

The project’s GitHub README and site show benchmark charts where `fast-xml-parser` outperforms `xml2js`, `xml-js`, and others in requests per second for both parsing and building across several XML sizes. ([GitHub][6])

Independent blog posts and tutorials also highlight its speed and ability to handle XML files in the 100MB–800MB range in realistic scenarios. ([Geshan's Blog][11])

### 5.2 Performance tips

* Avoid `preserveOrder: true` unless you require an ordered representation; it’s slower and more memory heavy.
* If you don’t use attributes, leave `ignoreAttributes: true` (the default) for a simpler object and faster parsing.
* Turn off numeric/boolean coercion if not needed; extra parsing work can cost CPU.
* Use `stopNodes` to bypass heavy subtrees that you intend to treat as raw XML/HTML.

---

## 6. Security Posture

### 6.1 Current status (v5.3.2)

Security dashboards (Snyk, etc.) list the latest version `5.3.2` as **having no known security issues**, with a healthy maintenance score and only one runtime dependency (`strnum`). ([VulnGuide][1])

### 6.2 Historical vulnerabilities

There *have* been notable issues in older versions:

1. **Prototype Pollution (pre-4.1.2)**

   * Snyk documents prototype pollution vulnerabilities around unsafe handling of attribute names (e.g. keys like `__proto__`) in 3.x / early 4.x; recommendation was upgrading to ≥4.1.2. ([VulnGuide][12])

2. **Regular Expression Denial of Service (ReDoS) in 4.x**

   * CVE-2023-34104: entity name handling allowed special characters unsafely; entity names were used to build regexes, enabling DoS. ([NVD][13])
   * CVE-2024-41818 (GHSA-mpg4-rc92-vx8v): ReDoS in currency parsing logic; fixed in `4.4.1`. ([CVE Details][14])

3. **Impact on dependents**

   * The vulnerability series triggered high-severity alerts in big downstream consumers like AWS SDK v3, which relied on FXP. Discussions clarified which versions were actually affected and which SDK versions were safe. ([GitHub][15])

As of late 2025, security pages show **0 vulnerabilities** affecting the latest version, with four total past vulnerabilities all fixed in newer releases. ([VulnGuide][1])

### 6.3 Secure usage guidelines

* **Version hygiene**

  * Use `5.x` or, if constrained to `4.x`, at least `≥4.4.1` to avoid known ReDoS issues. ([CVE Details][14])
* **Constrain input**

  * Enforce request size limits and timeouts at the HTTP and application layers for any untrusted XML.
* **Minimal features**

  * Disable numeric/boolean coercion, entity expansions, and unnecessary options for untrusted input.
* **Monitoring**

  * Keep `npm audit`, Snyk, or similar tools enabled to catch future CVEs.
* **Report responsibly**

  * The repo has a documented security policy using Tidelift’s coordinated disclosure process. ([GitHub][16])

---

## 7. Ecosystem Health & Maintenance

From Snyk’s package health and npm stats: ([VulnGuide][1])

* **Age**: ~8 years on npm
* **Latest version**: `5.3.2` (Nov 14, 2025)
* **Releases in 2025**: multiple 5.2.x and 5.3.x versions, indicating active development
* **Downloads**: ~42.8M per week
* **Stars / forks**: ~3k stars and ~339 forks on GitHub ([GitHub][4])
* **Maintenance**: Marked “HEALTHY” with ongoing commits and issues/PRs activity ([VulnGuide][1])

Overall, ecosystem signals point to a **stable, actively maintained** project that many other packages depend on.

---

## 8. Comparison with Alternatives

### 8.1 `xml2js`

* **Style**: Callback / Promise-based, object-oriented parser.
* **Pros**:

  * Very mature and widely known.
  * Stable API, lots of blog posts and Stack Overflow answers.
* **Cons**:

  * Benchmarks often show it slower than `fast-xml-parser` on large data sets. ([Stack Overflow][17])

### 8.2 `xml-js`

* Converts XML directly to a JSON representation with a different structural model.
* Benchmarks suggest it’s generally slower and more memory-intense than FXP for many workloads. ([Npm Compare][18])

### 8.3 `tXml`

* A tiny (~1.5kb gzipped) zero-dependency parser with claims of being 2-3x faster than FXP and 5-10x faster than `xml2js` in its benchmarks. ([GitHub][19])
* More minimal API and fewer configuration knobs than FXP.
* Good when you care about tiny bundle size and extreme speed more than feature richness.

### 8.4 Streaming parsers (`sax`, `node-expat`, etc.)

* Event-based streaming suitable for huge XML streams.
* More complex to use, but avoid building the entire document in memory.
* FXP is easier to use for “normal” XML sizes where in-memory operation is acceptable.

### 8.5 Positioning summary

* Choose **`fast-xml-parser`** for general-purpose XML ↔ JS/JSON with good performance, configurability, and browser+Node support.
* Choose **streaming/event parsers** for very large / streaming workloads.
* Choose **tiny, minimal libraries** like `tXml` if you need ultra-small bundles and can live with reduced features.

---

## 9. Typical Use Cases

1. **Cloud & service SDKs**

   * Used internally by tools (like iterations of AWS SDK v3) to parse XML-based AWS protocols. ([GitHub][15])
2. **Config / import pipelines**

   * Ingesting XML from legacy systems (ERP/CRM exports, etc.) and turning them into JSON for modern apps. ([Geshan's Blog][11])
3. **Browser applications**

   * Handling map formats (e.g., GPX, KML), RSS/Atom feeds, or XML-based APIs directly in the browser. ([naturalintelligence.github.io][3])
4. **CLI tools & scripts**

   * Simple XML↔JSON converters and validators.

### Example: transforming an XML feed to JSON

```js
import fs from 'node:fs/promises';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: true,
  parseAttributeValue: true,
});

async function main() {
  const xml = await fs.readFile('feed.xml', 'utf8');
  const data = parser.parse(xml);

  const rawItems = data.feed.item;
  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  const jsonItems = items.map((item) => ({
    id: item.id,
    title: item.title,
    publishedAt: item['@_pubDate'],
  }));

  await fs.writeFile('feed.json', JSON.stringify(jsonItems, null, 2));
}

main().catch((err) => {
  console.error('Failed to process feed:', err);
  process.exit(1);
});
```

---

## 10. Best Practices & Design Recommendations

### 10.1 Schema-aware parsing

* If you have an XSD or clear contract, tune `isArray`, namespace options, and attribute prefixes upfront.
* Don’t expose raw FXP output types deep into your app; instead, map them to domain objects in a single place.

### 10.2 Robust error handling

* Always validate with `XMLValidator` or wrap `parse` in try/catch for untrusted input.
* Avoid logging complete untrusted XML in production logs (risk of log flooding and sensitive-data leakage).
* For user-facing APIs, return generic “invalid XML” messages and log the details server-side only.

### 10.3 Version pinning & updates

* Pin a specific major version (`^5.3.2` or similar) and keep an eye on release notes and security advisories.
* Use `npm audit`, Snyk, GitHub Dependabot, etc. to track new vulnerabilities. ([VulnGuide][1])

### 10.4 Tests & fixtures

* Maintain canonical XML fixtures plus expected parsed objects in your test suite.
* Add round-trip tests (XML → JS → XML) where exact formatting matters.
* If you rely on particular option defaults (e.g., `ignoreAttributes`), assert those explicitly in tests to guard against future default changes.

---

## 11. Summary & Recommendation

As of **December 2, 2025**:

* `fast-xml-parser` is a **mature, widely adopted, and actively maintained** XML parser for Node.js and browsers. ([VulnGuide][1])
* The latest release `5.3.2` has **no known security vulnerabilities** according to major security databases. ([VulnGuide][1])
* It offers strong performance compared to other pure JS parsers and a rich set of configuration options for XML ↔ JS/JSON mapping. ([GitHub][6])
* Historical vulnerabilities (prototype pollution, ReDoS) have been addressed in newer releases; staying up to date is important. ([NVD][13])

**Practical recommendation:**

* For most Node.js / browser apps that need to parse and build XML and can work in memory, **`fast-xml-parser` is an excellent default choice**.
* For extremely large or streaming XML workloads, consider pairing it with streaming tools or using an event-based parser instead.

---

[1]: https://security.snyk.io/package/npm/fast-xml-parser "fast-xml-parser vulnerabilities | Snyk"
[2]: https://classic.yarnpkg.com/en/package/fast-xml-parser?utm_source=chatgpt.com "fast-xml-parser"
[3]: https://naturalintelligence.github.io/fast-xml-parser/?utm_source=chatgpt.com "Fast XML Parser"
[4]: https://github.com/NaturalIntelligence/fast-xml-parser "GitHub - NaturalIntelligence/fast-xml-parser: Validate XML, Parse XML and Build XML rapidly without C/C++ based libraries and no callback."
[5]: https://amitgupta-gwl.medium.com/fast-xml-parser-2634e614d104?utm_source=chatgpt.com "Fast XML Parser - Amit Kumar Gupta"
[6]: https://github.com/NaturalIntelligence/fast-xml-parser?utm_source=chatgpt.com "NaturalIntelligence/fast-xml-parser"
[7]: https://www.npmjs.com/package/fast-xml-parser?utm_source=chatgpt.com "fast-xml-parser"
[8]: https://github.com/NaturalIntelligence/fast-xml-parser/blob/master/docs/v4/1.GettingStarted.md?utm_source=chatgpt.com "fast-xml-parser/docs/v4/1.GettingStarted.md at master"
[9]: https://stackoverflow.com/questions/53417925/what-fast-xml-parser-options-preserve-namespace-and-attributes-when-parsing-and?utm_source=chatgpt.com "What fast-xml-parser options preserve namespace and ..."
[10]: https://www.reddit.com/r/node/comments/lf8asu/delightful_data_parsing_first_opensource_project/?utm_source=chatgpt.com "Delightful data parsing. First open-source project! Looking ..."
[11]: https://geshan.com.np/blog/2022/11/nodejs-xml-parser/?utm_source=chatgpt.com "A beginner's guide to parse and create XML with Node.js"
[12]: https://security.snyk.io/package/npm/fast-xml-parser/3.21.1?utm_source=chatgpt.com "fast-xml-parser 3.21.1 vulnerabilities"
[13]: https://nvd.nist.gov/vuln/detail/cve-2023-34104?utm_source=chatgpt.com "CVE-2023-34104 Detail - NVD"
[14]: https://www.cvedetails.com/cve/CVE-2024-41818/?utm_source=chatgpt.com "CVE-2024-41818 - Fast-xml-parser"
[15]: https://github.com/aws/aws-sdk-js-v3/issues/6331?utm_source=chatgpt.com "Recent fast-xml-parser vulnerability now shows dozens of ..."
[16]: https://github.com/NaturalIntelligence/fast-xml-parser/security?utm_source=chatgpt.com "Security - NaturalIntelligence/fast-xml-parser"
[17]: https://stackoverflow.com/questions/5138086/fastest-way-to-parse-this-xml-in-js?utm_source=chatgpt.com "Fastest Way to Parse this XML in JS"
[18]: https://npm-compare.com/fast-xml-parser%2Cxml-js%2Cxml-parser%2Cxml2js?utm_source=chatgpt.com "fast-xml-parser vs xml2js vs xml-js vs xml-parser"
[19]: https://github.com/TobiasNickel/tXml?utm_source=chatgpt.com "TobiasNickel/tXml: :zap:very small and fast xml-parser in ..."