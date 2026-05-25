import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { ArrowRight } from "lucide-react";
import villageImg from "@/assets/village.jpg";
import valleyImg from "@/assets/valley.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import agricultureImg from "@/assets/agriculture.jpg";
import elderImg from "@/assets/elder.jpg";

export const Route = createFileRoute("/villages")({
  head: () => ({
    meta: [
      { title: "Villages — Kara-Kulja" },
      { name: "description", content: "Discover the villages of Kara-Kulja district." },
      { property: "og:title", content: "Villages of Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "/villages" }],
  }),
  component: VillagesPage,
});

const VILLAGES = [
  { name: "Кара-Кулжа", taglineKey: "village.tagline.kara-kulja", img: villageImg, slug: "kara-kulja" },
  { name: "Жийде", taglineKey: "village.tagline.zhiyde", img: valleyImg, slug: "zhiyde" },
  { name: "Ой-Тал", taglineKey: "village.tagline.oy-tal", img: horsemanImg, slug: "oy-tal" },
  { name: "Алайкуу", taglineKey: "village.tagline.alai-kuu", img: valleyImg, slug: null },
  { name: "Капчыгай", taglineKey: "village.tagline.kapchygai", img: waterfallImg, slug: null },
  { name: "Кенеш", taglineKey: "village.tagline.kenesh", img: horsemanImg, slug: null },
  { name: "Карагуз", taglineKey: "village.tagline.karaguz", img: agricultureImg, slug: null },
  { name: "Кара-Кочкор", taglineKey: "village.tagline.kara-kochkor", img: elderImg, slug: null },
  { name: "Кызыл-Жар", taglineKey: "village.tagline.kyzyl-zhar", img: valleyImg, slug: null },
  { name: "Ылай-Талаа", taglineKey: "village.tagline.ylai-talaa", img: agricultureImg, slug: null },
  { name: "Сары-Булак", taglineKey: "village.tagline.sary-bulak", img: waterfallImg, slug: null },
  { name: "Чалма", taglineKey: "village.tagline.chalma", img: horsemanImg, slug: null },
  { name: "Кашка-Жол", taglineKey: "village.tagline.kashka-zhol", img: elderImg, slug: null },
] as const;

function VillagesPage() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("villages.eyebrow")}
        title={t("villages.title")}
        image={villageImg}
      />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VILLAGES.map((v, i) => {
              const inner = (
                <>
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={v.img} alt={v.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute left-4 top-4 bg-background/70 px-2 py-1 text-[10px] tracking-widest text-foreground backdrop-blur-md">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {!v.slug && (
                      <div className="absolute right-4 top-4 bg-background/70 px-2 py-1 text-[10px] tracking-widest text-muted-foreground backdrop-blur-md">
                        {t("common.soon")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end justify-between gap-3 p-6">
                    <div>
                      <div className="font-display text-2xl">{v.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{t(v.taglineKey)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                </>
              );
              return v.slug ? (
                <Link key={v.name} to="/villages/$slug" params={{ slug: v.slug }} className="group block border hairline">
                  {inner}
                </Link>
              ) : (
                <div key={v.name} className="group block border hairline opacity-70">
                  {inner}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
