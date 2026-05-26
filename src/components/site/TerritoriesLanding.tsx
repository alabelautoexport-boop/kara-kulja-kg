import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { PageHero, SiteLayout } from "@/components/site/Layout";
import { useI18n, type Lang } from "@/lib/i18n";
import { TERRITORIES, displayTerritoryName, formatPopulation, pick } from "@/lib/territories-data";

const territoriesHeroImg = "/images/nature/aerial-image-of-snow-covered-mountains-under-bright-sky.jpg";

const labels: Record<Lang, { villages: string; population: string }> = {
  kg: { villages: "айыл", population: "калк" },
  ru: { villages: "сёл", population: "население" },
  en: { villages: "villages", population: "population" },
};

export function TerritoriesLanding() {
  const { t, lang } = useI18n();
  const l = labels[lang];

  return (
    <SiteLayout>
      <PageHero
        eyebrow={t("villages.eyebrow")}
        title={t("villages.title")}
        image={territoriesHeroImg}
      />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-6 lg:grid-cols-2">
            {TERRITORIES.map((territory, index) => (
              <Link
                key={territory.slug}
                to="/territories/$slug"
                params={{ slug: territory.slug }}
                className="group relative block min-h-[430px] overflow-hidden border hairline md:min-h-[520px]"
              >
                <img
                  src={territory.image}
                  alt={displayTerritoryName(territory, lang)}
                  loading={index < 2 ? "eager" : "lazy"}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1600ms] group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/10" />
                <div className="absolute inset-0 gradient-vignette" />
                <div className="relative flex min-h-[430px] flex-col justify-between p-6 md:min-h-[520px] md:p-8 lg:p-10">
                  <div className="flex items-center justify-between gap-4">
                    <span className="kbd-eyebrow text-[var(--beige)]/85">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center border hairline bg-background/30 text-foreground backdrop-blur-md transition-transform duration-500 group-hover:translate-x-1">
                      <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
                    </span>
                  </div>

                  <div>
                    <p className="max-w-lg font-display text-xl font-light italic leading-[1.45] text-foreground/85 md:text-2xl">
                      {pick(territory.subtitle, lang)}
                    </p>
                    <h2 className="mt-5 font-display text-5xl leading-[0.98] text-foreground md:text-7xl">
                      {displayTerritoryName(territory, lang)}
                    </h2>
                    <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 backdrop-blur-md">
                        <MapPin className="h-3.5 w-3.5 text-[var(--beige)]/80" strokeWidth={1.25} />
                        {territory.villages.length} {l.villages}
                      </span>
                      <span className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 backdrop-blur-md">
                        <Users className="h-3.5 w-3.5 text-[var(--beige)]/80" strokeWidth={1.25} />
                        {formatPopulation(territory.population)} {l.population}
                      </span>
                    </div>
                    <div className="mt-8 kbd-eyebrow inline-flex items-center gap-2 text-[var(--beige)]/85">
                      {t("villages.cta")}
                      <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
