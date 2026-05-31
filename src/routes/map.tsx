import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n } from "@/lib/i18n";

const KaraKuljaDistrictMap = lazy(() =>
  import("@/components/site/KaraKuljaDistrictMap").then((module) => ({
    default: module.KaraKuljaDistrictMap,
  })),
);

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map - Kara-Kulja" },
      {
        name: "description",
        content:
          "Interactive map of Kara-Kulja District showing settlements, rivers, lakes, main roads, and the district boundary.",
      },
      { name: "robots", content: "noindex,nofollow" },
      { property: "og:title", content: "Kara-Kulja District Map" },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const [mounted, setMounted] = useState(false);
  const { lang } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  const title =
    lang === "ru"
      ? "Карта Кара-Кульджинского района"
      : lang === "en"
        ? "Kara-Kulja District Map"
        : "Кара-Кулжа районунун картасы";

  return (
    <SiteLayout>
      <section className="overflow-x-hidden bg-background pt-24 pb-14 lg:pt-28 lg:pb-20">
        <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
          <div className="mb-5 max-w-full">
            <h1 className="kbd-eyebrow max-w-4xl text-[var(--ember)]">
              {title}
            </h1>
          </div>

          {mounted ? (
            <Suspense fallback={<MapLoading />}>
              <KaraKuljaDistrictMap />
            </Suspense>
          ) : (
            <MapLoading />
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function MapLoading() {
  return (
    <div className="flex min-h-[420px] items-center justify-center border hairline bg-[#efe5cf] px-6 text-sm text-[#26352d]">
      <MapPin className="mr-2 h-4 w-4" />
      Loading map...
    </div>
  );
}
