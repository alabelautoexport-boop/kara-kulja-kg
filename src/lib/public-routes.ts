import { TERRITORIES } from "./territories-data";
import { canonicalPath, canonicalUrl } from "./seo";

export const PUBLIC_SECTIONS = [
  "/",
  "/about",
  "/villages",
  "/territories",
  "/tourism",
  "/invest",
  "/people",
  "/history",
  "/gallery",
  "/news",
  "/schools",
  "/kindergartens",
  "/contact",
];

// The only sitemap inventory. Both the server endpoint and static export use it.
// /map is intentionally excluded while that route has noindex.
export function publicRoutes(published: {
  schools: { slug: string }[];
  kindergartens: { slug: string }[];
  news: { slug: string }[];
}) {
  const details = (prefix: string, rows: { slug: string }[]) =>
    rows
      .map(({ slug }) => {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
          throw new Error(`Invalid public slug for ${prefix}`);
        return `${prefix}/${slug}`;
      })
      .sort();
  return [
    ...new Set(
      [
        ...PUBLIC_SECTIONS,
        ...TERRITORIES.map((t) => `/territories/${t.slug}`),
        ...TERRITORIES.flatMap((t) => t.villages.map((v) => `/villages/${v.slug}`)),
        ...details("/schools", published.schools),
        ...details("/kindergartens", published.kindergartens),
        ...details("/news", published.news),
      ].map(canonicalPath),
    ),
  ];
}

export function sitemapXml(routes: string[]) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    routes.map((p) => `  <url><loc>${canonicalUrl(p)}</loc></url>`).join("\n") +
    "\n</urlset>\n"
  );
}
