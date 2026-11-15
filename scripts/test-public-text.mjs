// Public punctuation only: source records, identifiers, URLs and HTML attributes stay intact.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { build } from "esbuild";
import { createRequire } from "node:module";

const compiled = await build({
  stdin: {
    resolveDir: process.cwd(),
    loader: "ts",
    contents: `
    export * from './src/lib/public-text';
    export {sanitizePublicNewsHtml} from './src/lib/news-public-html';
    export {localizedNewsField} from './src/lib/news-content';
    export {pageHead,canonicalUrl} from './src/lib/seo';
    export {bindFeatureTooltip,featureName,normalizeName} from './src/lib/kara-kulja-map';
    export {formatPopulation} from './src/lib/territories-data';
  `,
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
  define: { "import.meta.env": "{}" },
  plugins: [
    {
      name: "no-map-dom",
      setup(b) {
        b.onResolve({ filter: /^leaflet$/ }, () => ({ path: "leaflet", namespace: "map-stub" }));
        b.onLoad({ filter: /.*/, namespace: "map-stub" }, () => ({
          contents: "export default {};",
          loader: "js",
        }));
      },
    },
  ],
});
const mod = { exports: {} };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(
  createRequire(import.meta.url),
  mod,
  mod.exports,
);
const {
  formatPublicText,
  sanitizePublicNewsHtml,
  localizedNewsField,
  pageHead,
  canonicalUrl,
  bindFeatureTooltip,
  featureName,
  normalizeName,
  formatPopulation,
} = mod.exports;
const em = "\u2014",
  en = "\u2013";
for (const text of ["Кара-Кулжа", "Кара-Кульджа", "Kara-Kulja"]) {
  assert.equal(formatPublicText(`${text} ${em} 2020${en}2025`), `${text} - 2020-2025`);
}
assert.equal(formatPublicText("already - correct"), "already - correct");
const url = `https://example.test/a${em}b?q=x${en}y`;
assert.equal(formatPublicText(`URL ${url} ${em} text`), `URL ${url} - text`);
assert.equal(canonicalUrl(`/unchanged${em}slug`), `https://kara-kulja.kg/unchanged${em}slug/`);

const raw = `<p>2020${en}2025 ${em} <strong>text</strong> &mdash; &ndash; <a href="${url}" rel="value${em}unchanged" target="_blank">link ${em} label</a></p>`;
const rendered = sanitizePublicNewsHtml(raw);
assert.equal(
  rendered,
  `<p>2020-2025 - <strong>text</strong> - - <a href="${url}" rel="value${em}unchanged" target="_blank">link - label</a></p>`,
);
const record = {
  id: `id${em}keep`,
  slug: `slug${en}keep`,
  source_metadata: { original: `source${em}keep` },
  title_kg: `Кабар ${em} аталыш`,
  title_ru: `Новость ${em} заголовок`,
  title_en: `News ${em} title`,
  excerpt_kg: `Мезгил 2020${en}2025`,
  body_kg: raw,
};
const before = structuredClone(record);
for (const lang of ["kg", "ru", "en"])
  assert.ok(!localizedNewsField(record, "title", lang).includes(em));
assert.equal(localizedNewsField(record, "excerpt", "kg"), "Мезгил 2020-2025");
assert.equal(localizedNewsField(record, "body", "kg"), raw);
assert.deepEqual(record, before);
assert.equal(
  pageHead(`Title ${em} text`, `Period 2020${en}2025`).meta[0].title,
  "Title - text | Kara-Kulja",
);
assert.equal(formatPopulation(null), "-");
const feature = {
  type: "Feature",
  geometry: null,
  properties: { "@id": `way/id${em}keep`, name: `Ылай-Талаа ${en} Гүлчө`, website: url },
};
const featureBefore = structuredClone(feature);
let label;
bindFeatureTooltip(
  {
    bindTooltip: (text) => {
      label = text;
    },
  },
  feature,
  "road",
);
assert.equal(label, "Ылай-Талаа - Гүлчө");
assert.equal(featureName(feature), featureBefore.properties.name);
assert.deepEqual(feature, featureBefore);
assert.equal(normalizeName(`NAME ${em} NAME`), "name - name");

function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
for (const file of walk("src").filter(
  (f) =>
    /\.tsx?$/.test(f) &&
    !f.endsWith("people-data_GITHUB_BACKUP.ts") &&
    !f.endsWith("routeTree.gen.ts"),
)) {
  const source = fs.readFileSync(file, "utf8"),
    sf = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
  function inspect(node) {
    if (
      (ts.isStringLiteralLike(node) || ts.isJsxText(node)) &&
      /[\u2013\u2014]/.test(source.slice(node.getStart(sf), node.end))
    )
      throw Error(
        `Remaining literal public punctuation: ${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`,
      );
    ts.forEachChild(node, inspect);
  }
  inspect(sf);
}
console.log(
  "Public text tests passed: KG/RU/EN, year ranges, public metadata/news/map labels, HTML text nodes/entities, unchanged records/URLs/attributes, no remaining visible source literals",
);
