import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { publicRoutes, sitemapXml } from "@/lib/public-routes";
import { getPublishedSchools } from "@/lib/schools-data";
import { getPublishedKindergartens } from "@/lib/kindergartens-data";
import { getPublishedNews } from "@/lib/news-data";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const [schools, kindergartens, news] = await Promise.all([
          getPublishedSchools(),
          getPublishedKindergartens(),
          getPublishedNews(),
        ]);
        return new Response(sitemapXml(publicRoutes({ schools, kindergartens, news })), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
