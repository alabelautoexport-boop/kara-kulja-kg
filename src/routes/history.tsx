import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import villageImg from "@/assets/village.jpg";
import elderImg from "@/assets/elder.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import valleyImg from "@/assets/valley.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import agricultureImg from "@/assets/agriculture.jpg";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History & Archive — Kara-Kulja" },
      { name: "description", content: "Historical archive: old photos, Soviet era, oral history." },
      { property: "og:title", content: "History of Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/history" }],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { t } = useI18n();
  const items = [
    { yearKey: "history.item.1.year", titleKey: "history.item.1.title", img: horsemanImg },
    { yearKey: "history.item.2.year", titleKey: "history.item.2.title", img: villageImg },
    { yearKey: "history.item.3.year", titleKey: "history.item.3.title", img: elderImg },
    { yearKey: "history.item.4.year", titleKey: "history.item.4.title", img: agricultureImg },
    { yearKey: "history.item.5.year", titleKey: "history.item.5.title", img: valleyImg },
    { yearKey: "history.item.6.year", titleKey: "history.item.6.title", img: waterfallImg },
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("nav.history")}
        title={t("history.hero.title")}
        subtitle={t("history.hero.subtitle")}
        image={elderImg}
      />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1100px] px-6 lg:px-10">
          <div className="space-y-12">
            {items.map((it) => (
              <div key={it.titleKey} className="grid items-center gap-8 border-b hairline pb-12 md:grid-cols-12">
                <div className="md:col-span-2">
                  <div className="kbd-eyebrow text-[var(--ember)]">{t(it.yearKey)}</div>
                </div>
                <h3 className="font-display text-2xl md:col-span-5 md:text-3xl">{t(it.titleKey)}</h3>
                <div className="relative aspect-[4/3] overflow-hidden border hairline md:col-span-5">
                  <img src={it.img} alt={t(it.titleKey)} loading="lazy" className="absolute inset-0 h-full w-full object-cover grayscale" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
