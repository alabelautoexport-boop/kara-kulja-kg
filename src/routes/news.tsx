import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import { NEWS_COPY, formatNewsDate, localizedNewsField } from "@/lib/news-content";
import { getPublishedNews } from "@/lib/news-data";
import valleyImg from "@/assets/valley.jpg";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "Жаңылыктар - Kara-Kulja" },
      { name: "description", content: "Кара-Кулжа районундагы акыркы жаңылыктар жана окуялар." },
      { property: "og:title", content: "Жаңылыктар - Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/news" }],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { t, lang } = useI18n();
  const copy = NEWS_COPY[lang];
  const query = useQuery({
    queryKey: ["news", "published"],
    queryFn: getPublishedNews,
    retry: false,
  });

  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("news.eyebrow")}
        title={copy.title}
        subtitle={copy.description}
        image={valleyImg}
      />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">...</p>
          ) : query.error || !query.data?.length ? (
            <p className="border-y hairline py-8 text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <div className="grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {query.data.map((news) => {
                const title = localizedNewsField(news, "title", lang);
                const excerpt = localizedNewsField(news, "excerpt", lang);
                return (
                  <article key={news.id} className="min-w-0">
                    {news.cover_image && (
                      <Link
                        to="/news/$slug"
                        params={{ slug: news.slug }}
                        className="block aspect-[16/10] overflow-hidden border hairline"
                      >
                        <img
                          src={news.cover_image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                        />
                      </Link>
                    )}
                    <div className={news.cover_image ? "mt-5" : "border-t hairline pt-5"}>
                      <time className="text-xs tracking-widest text-muted-foreground">
                        {formatNewsDate(news.published_at, lang)}
                      </time>
                      <h2
                        className={`mt-3 font-display text-2xl leading-tight ${news.is_featured ? "font-bold" : ""}`}
                      >
                        <Link
                          to="/news/$slug"
                          params={{ slug: news.slug }}
                          className="hover:text-[var(--beige)]"
                        >
                          {title}
                        </Link>
                      </h2>
                      {excerpt && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {excerpt}
                        </p>
                      )}
                      <Link
                        to="/news/$slug"
                        params={{ slug: news.slug }}
                        className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {copy.read} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
