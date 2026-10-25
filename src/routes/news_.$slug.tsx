import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { NewsLightbox } from "@/components/site/NewsLightbox";
import { useI18n } from "@/lib/i18n";
import {
  NEWS_COPY,
  formatNewsDate,
  localizedNewsField,
  sanitizeNewsHtml,
} from "@/lib/news-content";
import { getPublishedNewsBySlug } from "@/lib/news-data";

export const Route = createFileRoute("/news_/$slug")({
  head: () => ({
    meta: [
      { title: "Жаңылык - Kara-Kulja" },
      { name: "description", content: "Кара-Кулжа районунун жаңылыгы." },
    ],
  }),
  component: NewsArticlePage,
});

function NewsArticlePage() {
  const { slug } = Route.useParams();
  const { lang, t } = useI18n();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const galleryTrigger = useRef<HTMLButtonElement | null>(null);
  const copy = NEWS_COPY[lang];
  const query = useQuery({
    queryKey: ["news", "slug", slug],
    queryFn: () => getPublishedNewsBySlug(slug),
    retry: false,
  });
  const title = query.data ? localizedNewsField(query.data, "title", lang) : null;
  const excerpt = query.data ? localizedNewsField(query.data, "excerpt", lang) : null;
  const body = query.data ? sanitizeNewsHtml(localizedNewsField(query.data, "body", lang)) : "";
  const gallery = query.data?.gallery_images ?? [];

  useEffect(() => {
    if (!title) return;
    document.title = `${title} - Kara-Kulja`;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description && excerpt) description.content = excerpt;
  }, [title, excerpt]);

  return (
    <SiteLayout>
      <section className="border-b hairline pt-32">
        <div className="mx-auto max-w-[920px] px-6 pb-14 lg:px-10 lg:pb-20">
          <Link
            to="/news"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {copy.back}
          </Link>
          {query.isLoading ? (
            <p className="mt-12 text-sm text-muted-foreground">...</p>
          ) : !query.data ? (
            <div className="mt-12">
              <h1 className="font-display text-4xl">404</h1>
              <p className="mt-3 text-muted-foreground">{copy.empty}</p>
            </div>
          ) : (
            <>
              <time className="mt-12 block text-xs tracking-widest text-muted-foreground">
                {formatNewsDate(query.data.published_at, lang)}
              </time>
              <h1
                className={`mt-5 max-w-4xl font-display text-5xl leading-[1.05] text-balance md:text-7xl ${query.data.is_featured ? "font-bold" : ""}`}
              >
                {title}
              </h1>
              {excerpt && (
                <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground">{excerpt}</p>
              )}
            </>
          )}
        </div>
      </section>
      {query.data && (
        <article className="py-14 lg:py-20">
          <div className="mx-auto max-w-[920px] px-6 lg:px-10">
            {query.data.cover_image && (
              <img
                src={query.data.cover_image}
                alt=""
                className="mb-12 aspect-[16/9] w-full object-cover"
              />
            )}
            {body && <div className="news-article" dangerouslySetInnerHTML={{ __html: body }} />}
            {gallery.length > 0 && (
              <section className="mt-14 border-t hairline pt-10">
                <h2 className="font-display text-3xl">{t("gallery.title")}</h2>
                <div className="mt-6 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
                  {gallery.map((image, index) => (
                    <button
                      key={image.key}
                      type="button"
                      onClick={(event) => {
                        galleryTrigger.current = event.currentTarget;
                        setSelectedIndex(index);
                      }}
                      className="group aspect-[4/3] overflow-hidden border hairline bg-muted/20"
                      aria-label={`${t("gallery.title")} ${index + 1}`}
                    >
                      <img
                        src={image.url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
            <Link
              to="/news"
              className="mt-14 inline-flex items-center gap-2 border-b hairline pb-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {copy.back}
            </Link>
          </div>
        </article>
      )}
      <NewsLightbox
        key={slug}
        images={gallery}
        index={selectedIndex}
        onIndexChange={setSelectedIndex}
        onClose={() => setSelectedIndex(null)}
        returnFocus={() => galleryTrigger.current?.focus()}
      />
    </SiteLayout>
  );
}
