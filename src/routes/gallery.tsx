import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, PageHero } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";
import villageImg from "@/assets/village.jpg";
import elderImg from "@/assets/elder.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import valleyImg from "@/assets/valley.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import agricultureImg from "@/assets/agriculture.jpg";
import heroImg from "@/assets/hero-mountains.jpg";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Kara-Kulja" },
      { name: "description", content: "Visual archive of Kara-Kulja: mountains, villages, people and culture." },
      { property: "og:title", content: "Gallery — Kara-Kulja" },
    ],
    links: [{ rel: "canonical", href: "https://kara-kulja.kg/gallery" }],
  }),
  component: GalleryPage,
});

const IMGS = [heroImg, valleyImg, horsemanImg, villageImg, waterfallImg, elderImg, agricultureImg, valleyImg, horsemanImg, villageImg, waterfallImg, heroImg];

function GalleryPage() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <PageHero eyebrow={t("gallery.hero.eyebrow")} title={t("gallery.hero.title")} image={heroImg} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1500px] px-4 lg:px-8">
          <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
            {IMGS.map((src, i) => (
              <div key={i} className="mb-3 break-inside-avoid overflow-hidden">
                <img src={src} alt="" loading="lazy" className="h-auto w-full transition-transform duration-700 hover:scale-105" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
