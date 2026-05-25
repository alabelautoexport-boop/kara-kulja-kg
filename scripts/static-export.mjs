import fs from "node:fs";
import path from "node:path";

const server = (await import("../dist/server/index.js")).default;

const BASE_URL = "http://localhost:3000";

const routes = [
  "/",
  "/about",
  "/villages",
  "/villages/kara-kulja",
  "/villages/zhiyde",
  "/villages/oy-tal",
  "/tourism",
  "/invest",
  "/people",
  "/history",
  "/gallery",
  "/news",
  "/contact",
];

async function renderRoute(routePath) {
  const url = `${BASE_URL}${routePath}`;
  const request = new Request(url);
  const response = await server.fetch(request, {}, {});

  if (!response.ok) {
    throw new Error(`Failed to render ${routePath}: ${response.status}`);
  }

  return await response.text();
}

function getOutputPath(routePath) {
  const cleanPath = routePath.replace(/^\//, "");
  if (!cleanPath) {
    return path.join("dist", "client", "index.html");
  }
  return path.join("dist", "client", cleanPath, "index.html");
}

// Render all routes
for (const route of routes) {
  try {
    const html = await renderRoute(route);
    const outputPath = getOutputPath(route);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html, "utf-8");
    console.log(`✓ ${route} → ${outputPath}`);
  } catch (err) {
    console.error(`✗ ${route}: ${err.message}`);
    process.exitCode = 1;
  }
}

// Generate static sitemap.xml
let sitemapXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
sitemapXml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const r of routes) {
  const priority = r === "/" ? "1.0" : "0.7";
  sitemapXml += `  <url><loc>${BASE_URL}${r}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>\n`;
}
sitemapXml += "</urlset>\n";
fs.writeFileSync(path.join("dist", "client", "sitemap.xml"), sitemapXml, "utf-8");
console.log(`✓ /sitemap.xml → dist/client/sitemap.xml`);

// Remove server build — not needed for static hosting
const serverDir = path.join("dist", "server");
if (fs.existsSync(serverDir)) {
  fs.rmSync(serverDir, { recursive: true, force: true });
  console.log("✓ Removed dist/server/");
}

// Move dist/client/* up to dist/ for clean deployment
const clientDir = path.join("dist", "client");
const distDir = path.join("dist");

function moveUp(srcDir, destDir) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(srcDir, entry.name);
    const dest = path.join(destDir, entry.name);
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
  }
}

moveUp(clientDir, distDir);
fs.rmdirSync(clientDir);
console.log("✓ Moved dist/client/* → dist/");

// Remove Vite internal files not needed for deployment
const assetsIgnore = path.join("dist", ".assetsignore");
if (fs.existsSync(assetsIgnore)) {
  fs.rmSync(assetsIgnore, { force: true });
  console.log("✓ Cleaned up .assetsignore");
}

console.log("\n✓ Static export complete. Deploy the 'dist/' folder to your static host.");
