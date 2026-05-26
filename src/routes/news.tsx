import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import valleyImg from "@/assets/valley.jpg";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — Kara-Kulja" },
      { name: "description", content: "Latest news from Kara-Kulja district." },
      { property: "og:title", content: "News — Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/news" }],
  }),
  component: NewsPage,
});

function NewsPage() {
  const { t } = useI18n();
  const NEWS = [
    { date: "12 May 2026", catKey: "news.cat.tourism", titleKey: "news.item.1" },
    { date: "04 May 2026", catKey: "news.cat.invest", titleKey: "news.item.2" },
    { date: "21 Apr 2026", catKey: "news.cat.culture", titleKey: "news.item.3" },
    { date: "08 Apr 2026", catKey: "news.cat.agri", titleKey: "news.item.4" },
    { date: "27 Mar 2026", catKey: "news.cat.edu", titleKey: "news.item.5" },
  ];
  return (
    <SiteLayout>
      <PageHero eyebrow={t("news.eyebrow")} title={t("news.title")} image={valleyImg} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <ul className="divide-y hairline border-y hairline">
            {NEWS.map((n) => (
              <li key={n.titleKey}>
                <a href="#" className="group grid grid-cols-12 items-center gap-4 py-8">
                  <span className="col-span-12 text-xs tracking-widest text-muted-foreground md:col-span-2">{n.date}</span>
                  <span className="col-span-2 hidden text-xs tracking-widest text-[var(--ember)] md:block">{t(n.catKey)}</span>
                  <h3 className="col-span-11 font-display text-2xl text-foreground transition-colors group-hover:text-[var(--beige)] md:col-span-7 md:text-3xl">
                    {t(n.titleKey)}
                  </h3>
                  <ArrowRight className="col-span-1 h-4 w-4 justify-self-end text-muted-foreground transition-transform group-hover:translate-x-1" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
