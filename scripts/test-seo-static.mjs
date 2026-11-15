// Read-only checks of the actual export plus an HTTP model of the checked-in
// Apache rules. This is not a substitute for verifying mod_rewrite on Fornex.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { build } from "esbuild";
import { createRequire } from "node:module";
import { publishedNewsRoutes } from "./school-publication-routes.mjs";

const compiled = await build({
  stdin: {
    contents:
      "export * from './src/lib/public-routes';export * from './src/lib/seo';export * from './src/lib/news-public-html';",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  packages: "external",
  define: { "import.meta.env": "{}" },
});
const module = { exports: {} };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(
  createRequire(import.meta.url),
  module,
  module.exports,
);
const { publicRoutes, sitemapXml, canonicalUrl, sanitizePublicNewsHtml } = module.exports;
assert.deepEqual(
  publicRoutes({ schools: [], kindergartens: [], news: [{ slug: "later" }, { slug: "earlier" }] }),
  publicRoutes({ schools: [], kindergartens: [], news: [{ slug: "earlier" }, { slug: "later" }] }),
  "Server/static sitemap must not depend on API ordering",
);
assert.equal(canonicalUrl("/schools?search=test#x"), "https://kara-kulja.kg/schools/");
assert.equal(canonicalUrl("/"), "https://kara-kulja.kg/");
assert.throws(() =>
  publicRoutes({ schools: [{ slug: "../private" }], kindergartens: [], news: [] }),
);
assert.ok(!publicRoutes({ schools: [], kindergartens: [], news: [] }).includes("/map/"));
assert.equal(
  sanitizePublicNewsHtml(
    '<p onclick="x()">Text <strong>bold</strong></p><script>alert(1)</script><img src=x onerror=x><a href="javascript:alert(1)">bad</a>',
  ),
  "<p>Text <strong>bold</strong></p><a>bad</a>",
);
assert.equal(
  sanitizePublicNewsHtml('<a href="https://example.com/">safe</a>'),
  '<a href="https://example.com/">safe</a>',
);
assert.deepEqual(
  await publishedNewsRoutes({
    url: "https://fixture.invalid",
    publicKey: "public",
    fetchImpl: async (url) => {
      assert.equal(url.searchParams.get("is_published"), "eq.true");
      assert.equal(url.searchParams.get("published_at"), "not.is.null");
      return { ok: true, json: async () => [{ slug: "published-story" }] };
    },
  }),
  ["/news/published-story"],
);

const root = path.resolve("dist"),
  xml = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
assert.equal(new Set(urls).size, urls.length);
const canonicalOrigin = "https://kara-kulja.kg";
const routes = urls.map((u) => {
  const url = new URL(u);
  assert.equal(url.origin, canonicalOrigin);
  assert.equal(url.search, "");
  assert.equal(url.hash, "");
  assert.ok(url.pathname.endsWith("/"));
  return url.pathname;
});
const slugRows = (prefix) =>
  routes
    .filter((r) => r.startsWith(prefix) && r !== prefix)
    .map((r) => ({ slug: r.split("/").at(-2) }));
assert.equal(
  xml,
  sitemapXml(
    publicRoutes({
      schools: slugRows("/schools/"),
      kindergartens: slugRows("/kindergartens/"),
      news: slugRows("/news/"),
    }),
  ),
);
assert.equal(slugRows("/schools/").length, 53);
assert.equal(slugRows("/kindergartens/").length, 56);
assert.equal(slugRows("/villages/").length, 54);
assert.equal(slugRows("/territories/").length, 7);
assert.ok(slugRows("/news/").length >= 3);
assert.ok(routes.every((r) => !/^\/(?:admin|school-admin|news-admin|map)(?:\/|$)/.test(r)));

function inspect(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  return {
    title: head.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1],
    description: head.match(/<meta name="description" content="([^"]*)"/)?.[1],
    canonical: [...head.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => m[1]),
    noindex: /<meta name="robots" content="[^"]*noindex/.test(head),
    h1: html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]+>/g, ""),
  };
}
const pageFile = (route) => path.join(root, ...route.split("/").filter(Boolean), "index.html");
const titles = [];
for (const route of routes) {
  const html = fs.readFileSync(pageFile(route), "utf8"),
    seo = inspect(html);
  assert.ok(html.includes('<html lang="ky"'), route + ": language");
  assert.ok(seo.title && seo.description, route + ": metadata");
  assert.deepEqual(seo.canonical, [canonicalOrigin + route], route + ": canonical");
  assert.equal(seo.noindex, false, route + ": noindex");
  assert.ok(seo.h1, route + ": initial H1");
  titles.push(seo.title);
  if (/^\/(schools|kindergartens)\/[^/]+\/$/.test(route)) {
    assert.ok(
      !["Мектептер", "Бала бакчалар"].includes(seo.h1),
      route + ": missing initial institution",
    );
    assert.equal(seo.title, seo.h1 + " | Kara-Kulja", route + ": full institution title");
    assert.ok(!html.includes("source_metadata"), route + ": private provenance");
    assert.ok(!html.includes("review_note"), route + ": private notes");
    assert.ok(!html.includes('"scores":['), route + ": raw ORT");
  }
  if (/^\/news\/[^/]+\/$/.test(route)) {
    assert.ok(html.includes("<article"), route + ": article body");
    assert.notEqual(seo.h1, "KARA-KULJA", route + ": homepage fallback");
    assert.ok(!html.includes('<h1 class="font-display text-4xl">404'), route + ": missing news");
  }
  for (const m of html.matchAll(/href="([^"#]+)"/g)) {
    if (!m[1].startsWith("/") && !m[1].startsWith(canonicalOrigin)) continue;
    const url = new URL(m[1].replaceAll("&amp;", "&"), canonicalOrigin);
    if (
      url.origin !== canonicalOrigin ||
      /\.[a-z0-9]+$/i.test(url.pathname) ||
      url.pathname.startsWith("/assets/")
    )
      continue;
    assert.ok(url.pathname.endsWith("/"), route + ": noncanonical internal link " + m[1]);
  }
}
assert.equal(new Set(titles).size, titles.length, "Public SEO titles must be unique");
for (const route of [
  "/admin/",
  "/admin/login/",
  "/admin/news/",
  "/admin/news/new/",
  "/admin/schools/",
  "/admin/kindergartens/",
  "/school-admin/",
  "/news-admin/",
  "/news-admin/new/",
  "/map/",
]) {
  assert.ok(inspect(fs.readFileSync(pageFile(route), "utf8")).noindex, route);
}
assert.ok(inspect(fs.readFileSync(path.join(root, "404.html"), "utf8")).noindex);
assert.ok(!fs.existsSync(path.join(root, "client")) && !fs.existsSync(path.join(root, "server")));
const robots = fs.readFileSync(path.join(root, "robots.txt"), "utf8");
assert.ok(robots.includes("Allow: /"));
assert.ok(!/^Disallow:\s*\/$/m.test(robots));
assert.ok(robots.includes("Sitemap: https://kara-kulja.kg/sitemap.xml"));

// Read the supported RewriteRule patterns from .htaccess, preserving their order.
const htaccess = fs.readFileSync(path.join(root, ".htaccess"), "utf8");
assert.ok(htaccess.includes("DirectoryIndex index.html"));
assert.ok(htaccess.includes("ErrorDocument 404 /404.html"));
assert.ok(!htaccess.includes("RewriteRule ^ index.html"));
const rules = [...htaccess.matchAll(/^RewriteRule (\S+) (\S+) \[([^\]]+)\]/gm)].map((m) => ({
  pattern: new RegExp(m[1]),
  target: m[2],
  flags: m[3],
}));
assert.equal(rules.length, 3);
function resolve(requestPath) {
  const clean = decodeURIComponent(new URL(requestPath, "http://local").pathname),
    file = path.join(root, clean);
  assert.ok(file.startsWith(root + path.sep) || file === root);
  const exists = fs.existsSync(file),
    directory = exists && fs.statSync(file).isDirectory();
  if (exists) {
    if (directory && !clean.endsWith("/")) return { status: 301, location: clean + "/" };
    return { status: 200, file: directory ? path.join(file, "index.html") : file };
  }
  for (const rule of rules.slice(1)) {
    if (!rule.pattern.test(clean.slice(1))) continue;
    if (rule.flags.includes("R=404")) return { status: 404, file: path.join(root, "404.html") };
    return { status: 200, file: path.join(root, rule.target) };
  }
  throw Error("No HTTP rule matched");
}
const server = http.createServer((req, res) => {
  try {
    const result = resolve(req.url);
    res.writeHead(
      result.status,
      result.location
        ? { Location: result.location }
        : { "Content-Type": "text/html; charset=utf-8" },
    );
    res.end(result.file ? fs.readFileSync(result.file) : "");
  } catch (e) {
    res.writeHead(500);
    res.end(e.message);
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
try {
  const base = "http://127.0.0.1:" + server.address().port;
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.deepEqual(inspect(await response.text()).canonical, [canonicalOrigin + route]);
  }
  for (const route of [
    "/missing-path/",
    "/schools/missing-school/",
    "/kindergartens/missing-garden/",
    "/news/missing-news/",
    "/villages/missing-village/",
    "/territories/missing-territory/",
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404, route);
    assert.ok((await response.text()).includes("noindex"));
  }
  const slash = await fetch(base + "/schools", { redirect: "manual" });
  assert.equal(slash.status, 301);
  assert.equal(slash.headers.get("location"), "/schools/");
  for (const route of [
    "/admin/news/00000000-0000-4000-8000-000000000001/edit/",
    "/news-admin/00000000-0000-4000-8000-000000000001/edit/",
  ]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200);
    assert.ok(inspect(await response.text()).noindex);
  }
  for (const file of ["/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(base + file);
    assert.equal(response.status, 200);
    await response.text();
  }
} finally {
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
console.log(
  JSON.stringify({
    passed: true,
    indexableUrls: urls.length,
    schools: 53,
    kindergartens: 56,
    villages: 54,
    territories: 7,
    news: slugRows("/news/").length,
    initialHtml: true,
    canonicalAndLinks: true,
    privateNoindex: true,
    unknownHttp404: true,
    apacheModelOnly: true,
  }),
);
