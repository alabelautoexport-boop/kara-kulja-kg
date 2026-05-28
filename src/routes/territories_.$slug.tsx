import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, MapPin, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n, type Lang } from "@/lib/i18n";
import { getTerritoryHeroUrl } from "@/lib/r2";
import { displayTerritoryName, displayVillageName, formatPopulation, getTerritory, pick, type Territory } from "@/lib/territories-data";
import { getVillage } from "@/lib/villages-data";

export const Route = createFileRoute("/territories_/$slug")({
  loader: ({ params }) => {
    const territory = getTerritory(params.slug);
    if (!territory) throw notFound();
    return territory;
  },
  notFoundComponent: TerritoryNotFound,
  component: TerritoryPage,
});

const labels: Record<
  Lang,
  {
    back: string;
    population: string;
    villages: string;
    villageList: string;
    order: string;
    enter: string;
    notFound: string;
  }
> = {
  kg: {
    back: "Аймактарга кайтуу",
    population: "калк",
    villages: "айыл",
    villageList: "Аймактын айылдары",
    order: "ирет",
    enter: "Айылга кирүү",
    notFound: "Аймак табылган жок",
  },
  ru: {
    back: "К территориям",
    population: "население",
    villages: "сёл",
    villageList: "Сёла территории",
    order: "порядок",
    enter: "Войти в село",
    notFound: "Территория не найдена",
  },
  en: {
    back: "Back to territories",
    population: "population",
    villages: "villages",
    villageList: "Villages of the territory",
    order: "order",
    enter: "Enter village",
    notFound: "Territory not found",
  },
};

function TerritoryNotFound() {
  const { lang } = useI18n();
  const l = labels[lang];

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <p className="kbd-eyebrow text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-4xl">{l.notFound}</h1>
        <Link to="/territories" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {l.back}
        </Link>
      </div>
    </SiteLayout>
  );
}

function TerritoryPage() {
  const territory = Route.useLoaderData() as Territory;
  const { lang } = useI18n();
  const l = labels[lang];
  const territoryName = displayTerritoryName(territory, lang);

  return (
    <SiteLayout>
      <section className="relative flex min-h-[86vh] items-end overflow-hidden pt-32">
        <img
          src={getTerritoryHeroUrl(territory.slug)}
          alt={territoryName}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 gradient-fade-b" />
        <div className="absolute inset-0 gradient-vignette" />
        <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-20 lg:px-10 lg:pb-28">
          <Link
            to="/territories"
            className="kbd-eyebrow inline-flex items-center gap-2 text-[var(--beige)]/80 hover:text-[var(--beige)]"
          >
            <ArrowLeft className="h-3 w-3" /> {l.back}
          </Link>
          <h1 className="mt-6 font-display text-6xl leading-[0.98] text-balance text-foreground md:text-8xl">
            {territoryName}
          </h1>
          <p className="mt-6 max-w-2xl font-display text-2xl font-light italic leading-[1.4] text-foreground/85 md:text-3xl">
            {pick(territory.subtitle, lang)}
          </p>
          <p className="mt-8 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
            {pick(territory.description, lang)}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 backdrop-blur-md">
              <Users className="h-3.5 w-3.5 text-[var(--beige)]/80" strokeWidth={1.25} />
              {formatPopulation(territory.population)} {l.population}
            </span>
            <span className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 backdrop-blur-md">
              <MapPin className="h-3.5 w-3.5 text-[var(--beige)]/80" strokeWidth={1.25} />
              {territory.villages.length} {l.villages}
            </span>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="kbd-eyebrow text-muted-foreground/70">{territoryName}</p>
              <h2 className="mt-3 font-display text-4xl leading-tight md:text-5xl">
                {l.villageList}
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {territory.villages.map((village) => {
              const detail = getVillage(village.slug);
              const image = detail?.hero ?? territory.image;

              return (
                <Link
                  key={village.slug}
                  to="/villages/$slug"
                  params={{ slug: village.slug }}
                  className="group grid min-h-[172px] overflow-hidden border hairline bg-background/35 transition-colors duration-500 hover:bg-foreground/[0.025] sm:grid-cols-[190px_1fr]"
                >
                  <div className="relative min-h-[150px] overflow-hidden sm:min-h-full">
                    <img
                      src={image}
                      alt={displayVillageName(village, lang)}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/55 to-transparent" />
                  </div>
                  <div className="flex min-w-0 flex-col justify-between p-5 md:p-6">
                    <div>
                      <p className="kbd-eyebrow text-[10px] text-muted-foreground/65">
                        {l.order} {String(village.order).padStart(2, "0")}
                      </p>
                      <h3 className="mt-3 font-display text-2xl leading-tight md:text-3xl">
                        {displayVillageName(village, lang)}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatPopulation(village.population)} {l.population}
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center gap-2 kbd-eyebrow text-[var(--beige)]/80">
                      {l.enter}
                      <ArrowRight className="h-3 w-3 transition-transform duration-500 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
