import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import { Mountain, Droplet, Trees, Footprints, Compass, MapPin } from "lucide-react";
import horsemanImg from "@/assets/horseman.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import valleyImg from "@/assets/valley.jpg";

export const Route = createFileRoute("/tourism")({
  head: () => ({
    meta: [
      { title: "Tourism — Kara-Kulja" },
      { name: "description", content: "Mountain tourism, horse routes, ecotourism in Kara-Kulja." },
      { property: "og:title", content: "Tourism in Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "/tourism" }],
  }),
  component: TourismPage,
});

function TourismPage() {
  const { t } = useI18n();
  const cards = [
    { icon: Mountain, titleKey: "tourism.item.mountains", descKey: "tourism.item.mountains.desc", img: valleyImg },
    { icon: Droplet, titleKey: "tourism.item.rivers", descKey: "tourism.item.rivers.desc", img: waterfallImg },
    { icon: Compass, titleKey: "tourism.item.horse", descKey: "tourism.item.horse.desc", img: horsemanImg },
    { icon: Footprints, titleKey: "tourism.item.hiking", descKey: "tourism.item.hiking.desc", img: valleyImg },
    { icon: Trees, titleKey: "tourism.item.eco", descKey: "tourism.item.eco.desc", img: waterfallImg },
    { icon: MapPin, titleKey: "tourism.item.places", descKey: "tourism.item.places.desc", img: horsemanImg },
  ];
  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("tourism.eyebrow")}
        title={t("tourism.title")}
        subtitle={t("tourism.desc")}
        image={horsemanImg}
      />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map(({ icon: Icon, titleKey, descKey, img }) => (
              <article key={titleKey} className="group border hairline">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img src={img} alt={t(titleKey)} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  <Icon className="absolute bottom-4 left-4 h-6 w-6 text-[var(--beige)]" />
                </div>
                <div className="p-6">
                  <div className="font-display text-2xl">{t(titleKey)}</div>
                  <p className="mt-2 text-sm text-muted-foreground">{t(descKey)}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
