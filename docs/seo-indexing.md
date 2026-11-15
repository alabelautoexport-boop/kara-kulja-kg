# SEO/static hosting preparation

This change prepares the local production build. It does not deploy to Fornex,
modify Cloudflare/DNS, verify search properties, or submit a sitemap.

## Sitemap and canonical URLs

`src/lib/public-routes.ts` is the single sitemap inventory used by both
`src/routes/sitemap[.]xml.ts` and `scripts/static-export.mjs`.

Current published inventory: 186 URLs = 13 sections + 7 territories + 54 villages
+ 53 schools + 56 kindergartens + 3 news articles. `/map/` and all private routes
are excluded. Public snapshots/news are enumerated using the existing public key,
publication filters and pagination. Enumeration failures stop the export.

Canonical HTML URLs use `https://kara-kulja.kg/` and trailing slashes. The router
emits trailing slashes for existing Link targets. Query/hash variants share the
clean self-canonical. Sitemap and robots filenames keep their `.xml` / `.txt` URLs.

## Initial HTML and hydration

Public route loaders await existing published school/kindergarten snapshots and
published news. Loader data supplies React Query initialData and the route head.
No database schema, rows, publication flags, editor accounts, or media were changed.
Only existing full names, addresses, descriptions and news content are rendered.

Article HTML uses pinned `sanitize-html` in the public view for deterministic SSR
and hydration with a restricted tag/attribute/URL allowlist. The existing News
editor/save sanitizer is unchanged.

Initial HTML is Kyrgyz (`lang="ky"`). Existing client language preferences still
work; language switches update `ky` / `ru` / `en` and institution metadata. There
are no new language URLs or hreflang annotations. Metadata distinguishes village
names from territory names and disambiguates the two Sary-Bulak villages with
their existing territory relationship. Visible page headings remain unchanged.

Root head adds noindex,nofollow to every /admin, /school-admin and /news-admin
route, including dynamic edit routes. Guards and authorization are unchanged.

## Fornex deployment and HTTP 404

Previous `.htaccess`: every absent file/directory rewrote to the homepage with
status 200. The replacement preserves real files/directories and DirectoryIndex,
sets a local `ErrorDocument 404 /404.html`, and returns HTTP 404 for unknown paths.
Only the existing /admin/news/:id/edit/ and /news-admin/:id/edit/ shapes retain an
SPA fallback to the private Admin shell (which has noindex).

All known public pages are exported directories containing index.html. No public
detail-page SPA fallback is needed. New/unpublished changes require a new static
build and deployment; removed public directories must not be retained on the host.

Upload the **contents of dist** to the site's DocumentRoot, including `.htaccess`
and `404.html`. Apache must honor mod_rewrite, DirectoryIndex and ErrorDocument
in `.htaccess` (AllowOverride FileInfo/Indexes). Do not upload dist/server or local
environment files. The exporter removes server/client build wrappers.

After deployment, verify actual Fornex HTTP responses for all five unknown-slug
types plus an arbitrary path: status 404, not 200 or a redirect to the homepage.
If Fornex adds a separate global SPA fallback, disable it for this static site.
The local HTTP tests model the checked-in Apache rules; Apache itself is not
installed in this workspace and has not been modified or tested remotely.

## Cloudflare: manual origin normalization (not applied)

Review existing redirect rules first. Use a Single Redirect rule for:

```text
(http.host in {"kara-kulja.kg" "www.kara-kulja.kg"}
 and (http.host eq "www.kara-kulja.kg" or not ssl))
```

Dynamic destination:

```text
concat("https://kara-kulja.kg", http.request.uri.path)
```

Status **301**, **Preserve query string: enabled**. This changes the origin while
preserving the path. Apache DirectorySlash normalizes real exported directories.
Canonical internal links and sitemap already include slashes and do not need this
extra directory redirect. Old http/www URLs without a slash may take two hops.

If a one-hop origin-plus-slash redirect is desired, place a higher-priority rule
with the same condition plus `not ends_with(http.request.uri.path, "/")` and
`not (http.request.uri.path contains ".")`, targeting
`concat("https://kara-kulja.kg", http.request.uri.path, "/")`. Keep query preservation
enabled. The general origin rule follows it. Do not apply this to files/assets.

Confirm the www hostname is covered by the existing Cloudflare DNS/TLS setup;
no DNS changes were made here. After upload, purge stale HTML/sitemap cache as
needed and verify https/non-www/slash canonical URLs, robots and sitemap with GET.

## Validation

```text
npm.cmd run build
npm.cmd run build:static
node scripts/test-seo-static.mjs
node scripts/test-seo-hydration.mjs <path-to-jsdom/lib/api.js>
node scripts/test-schools-public.mjs <path-to-jsdom/lib/api.js>
node scripts/test-institution-public.mjs <path-to-jsdom/lib/api.js>
git diff --check
```

Static tests inspect every indexable HTML page: title/description, exactly one
self-canonical, initial content, ky language, private data exclusion, normalized
internal links, unique titles, sitemap consistency, private noindex, and static
HTTP-model statuses. The export additionally checks actual SSR HTTP 404 for the
six missing paths and actual SSR noindex for both dynamic Admin edit routes.
Hydration tests cover schools, kindergartens and news with KG/RU/EN metadata.

The existing three unrelated TypeScript errors in MapPoiLayers, VillageMapBlock
and the village page are not repaired by this SEO change.

Once deployed and verified, the site can be connected to Search Console/Yandex
Webmaster and its sitemap submitted by the owner. No submissions are performed
by this implementation. Structured data remains a possible later step.
