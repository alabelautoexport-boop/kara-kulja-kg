import fs from "node:fs";
import path from "node:path";
import { parseEnv } from "node:util";
import { build } from "esbuild";
import {
  publishedSchoolRoutes,
  publishedKindergartenRoutes,
  publishedNewsRoutes,
} from "./school-publication-routes.mjs";

const projectRoot = process.cwd();
const server = (await import("../dist/server/index.js")).default;
const env = {
  ...(fs.existsSync(".env") ? parseEnv(fs.readFileSync(".env", "utf8")) : {}),
  ...process.env,
};
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_PUBLISHABLE_KEY)
  throw new Error("Public snapshot configuration is required for a complete export");
const bundle = await build({
  stdin: {
    contents:
      "export { publicRoutes, sitemapXml } from './src/lib/public-routes'; export { SITE_ORIGIN } from './src/lib/seo';",
    resolveDir: process.cwd(),
    loader: "ts",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  define: { "import.meta.env": "{}" },
});
const { publicRoutes, sitemapXml, SITE_ORIGIN } = await import(
  "data:text/javascript;base64," + Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const options = { url: env.VITE_SUPABASE_URL, publicKey: env.VITE_SUPABASE_PUBLISHABLE_KEY };
// Failure is fatal: never publish an accidentally incomplete sitemap.
const [schoolPaths, gardenPaths, newsPaths] = await Promise.all([
  publishedSchoolRoutes(options),
  publishedKindergartenRoutes(options),
  publishedNewsRoutes(options),
]);
const rows = (paths) => paths.map((p) => ({ slug: p.split("/").at(-1) }));
const indexable = publicRoutes({
  schools: rows(schoolPaths),
  kindergartens: rows(gardenPaths),
  news: rows(newsPaths),
});
const privateRoutes = [
  "/admin/",
  "/admin/login/",
  "/admin/news/",
  "/admin/news/new/",
  "/admin/schools/",
  "/admin/kindergartens/",
  "/school-admin/",
  "/news-admin/",
  "/news-admin/new/",
];
const routes = [...indexable, "/map/", ...privateRoutes];

// The live endpoint and static file must use the identical sitemap inventory.
const sitemapResponse = await server.fetch(new Request(SITE_ORIGIN + "/sitemap.xml"), {}, {});
if (sitemapResponse.status !== 200 || (await sitemapResponse.text()) !== sitemapXml(indexable))
  throw new Error("Server and static sitemap differ");

function outputPath(route) {
  return path.join("dist", "client", ...route.split("/").filter(Boolean), "index.html");
}
for (const route of routes) {
  const response = await server.fetch(new Request(SITE_ORIGIN + route), {}, {});
  if (response.status !== 200) throw new Error(`Failed to render ${route}: ${response.status}`);
  const html = await response.text();
  const output = outputPath(route);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, "utf8");
  console.log(`✓ ${route} → ${output}`);
}
// Use the existing router's not-found UI. Apache ErrorDocument preserves HTTP 404.
for (const route of [
  "/admin/news/00000000-0000-4000-8000-000000000001/edit/",
  "/news-admin/00000000-0000-4000-8000-000000000001/edit/",
]) {
  const response = await server.fetch(new Request(SITE_ORIGIN + route), {}, {});
  if (
    response.status !== 200 ||
    !/<meta name="robots" content="noindex,nofollow"/.test(await response.text())
  )
    throw new Error(`Missing private robots tag: ${route}`);
}
for (const prefix of ["/schools", "/kindergartens", "/news", "/villages", "/territories"]) {
  const missing = await server.fetch(
    new Request(SITE_ORIGIN + prefix + "/static-export-missing-slug/"),
    {},
    {},
  );
  if (missing.status !== 404)
    throw new Error(`Expected 404 for missing ${prefix} slug, got ${missing.status}`);
  await missing.text();
}
const notFoundResponse = await server.fetch(
  new Request(SITE_ORIGIN + "/static-export-missing-page/"),
  {},
  {},
);
if (notFoundResponse.status !== 404) throw new Error("SSR not-found response must be 404");
let notFoundHtml = await notFoundResponse.text();
notFoundHtml = notFoundHtml.replace(
  "</head>",
  '<meta name="robots" content="noindex,nofollow"/></head>',
);
fs.writeFileSync(path.join("dist", "client", "404.html"), notFoundHtml, "utf8");
fs.writeFileSync(path.join("dist", "client", "sitemap.xml"), sitemapXml(indexable), "utf8");
console.log(
  JSON.stringify({
    sitemapUrls: indexable.length,
    schools: schoolPaths.length,
    kindergartens: gardenPaths.length,
    villages: indexable.filter((p) => p.startsWith("/villages/") && p !== "/villages/").length,
    territories: indexable.filter((p) => p.startsWith("/territories/") && p !== "/territories/")
      .length,
    news: newsPaths.length,
  }),
);

const serverDir = path.resolve("dist/server");
if (serverDir !== path.join(projectRoot, "dist", "server"))
  throw new Error("Unexpected server output path");
fs.rmSync(serverDir, { recursive: true, force: true });
const clientDir = path.resolve("dist/client"),
  distDir = path.resolve("dist");
for (const entry of fs.readdirSync(clientDir)) {
  const dest = path.join(distDir, entry);
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(path.join(clientDir, entry), dest);
}
fs.rmdirSync(clientDir);
fs.rmSync(path.join(distDir, ".assetsignore"), { force: true });
console.log("✓ Static export complete. Deploy the dist/ folder to your static host.");
