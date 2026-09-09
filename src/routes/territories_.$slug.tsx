import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Activity, ArrowLeft, ArrowRight, BookOpen, GraduationCap, HeartPulse, Home, Map, MapPin, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n, type Lang } from "@/lib/i18n";
import { getPeopleForTerritory, type PersonProfile } from "@/lib/people-data";
import { getTerritoryHeroUrl, getTerritoryPhotoUrl } from "@/lib/r2";
import {
  displayTerritoryName,
  displayVillageName,
  formatPopulation,
  getTerritory,
  pick,
  type Territory,
  type TerritoryEconomyProfileItem,
  type TerritoryGalleryImage,
  type TerritoryInfrastructureGroup,
  type TerritoryProfileGroup,
  type TerritoryScenicPlace,
  type TerritoryTextValue,
} from "@/lib/territories-data";
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
  const { lang, t } = useI18n();
  const l = labels[lang];
  const territoryName = displayTerritoryName(territory, lang);
  const detail = territory.detail;
  const people = getPeopleForTerritory(territory.slug);

  return (
    <SiteLayout>
      <section className="relative flex min-h-[86vh] items-end overflow-hidden pt-32">
        <img
          src={getTerritoryHeroUrl(territory.slug)}
          alt={territoryName}
          loading="eager"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {detail?.heroDarkOverlay ? <div className="absolute inset-0 bg-background/35" /> : null}
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
          <HeroStats territory={territory} lang={lang} labels={l} />
        </div>
      </section>

      {detail?.passport ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.passport.title, lang)} compact>
          <PassportSection passport={detail.passport} lang={lang} />
        </SectionShell>
      ) : null}

      <VillageList territory={territory} territoryName={territoryName} lang={lang} labels={l} />

      {detail?.nature ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.nature.title, lang)} intro={pick(detail.nature.intro, lang)}>
          <NatureSection territory={territory} places={detail.nature.places} lang={lang} />
        </SectionShell>
      ) : null}

      {detail?.infrastructure ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.infrastructure.title, lang)} compact>
          <InfrastructureSection groups={detail.infrastructure.groups} lang={lang} />
        </SectionShell>
      ) : null}

      {detail?.economy ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.economy.title, lang)}>
          <EconomySection body={detail.economy.body} profile={detail.economy.profile} lang={lang} />
        </SectionShell>
      ) : null}

      {detail?.history ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.history.title, lang)}>
          <p className="max-w-4xl text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
            {pick(detail.history.body, lang)}
          </p>
        </SectionShell>
      ) : null}

      {people.length ? (
        <SectionShell eyebrow={territoryName} title={t("nav.people")}>
          <PeopleSection people={people} lang={lang} />
        </SectionShell>
      ) : null}

      {detail?.gallery ? (
        <SectionShell eyebrow={territoryName} title={pick(detail.gallery.title, lang)}>
          <GallerySection territory={territory} images={detail.gallery.images} lang={lang} />
        </SectionShell>
      ) : null}
    </SiteLayout>
  );
}

function HeroStats({
  territory,
  lang,
  labels: l,
}: {
  territory: Territory;
  lang: Lang;
  labels: (typeof labels)[Lang];
}) {
  const detailStats = territory.detail?.heroStats;

  if (detailStats?.length) {
    const statIcons = [Users, MapPin, Home, Map] as const;

    return (
      <div className="mt-10 flex flex-wrap gap-3 text-xs text-muted-foreground">
        {detailStats.map((stat, index) => {
          const Icon = statIcons[index] ?? Users;

          return (
            <span key={`${pick(stat.label, lang)}-${pick(stat.value, lang)}`} className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 font-normal backdrop-blur-md">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--beige)]/70" strokeWidth={1.25} />
              <span>{pick(stat.value, lang)}</span>
              <span>{pick(stat.label, lang)}</span>
            </span>
          );
        })}
      </div>
    );
  }

  return (
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
  );
}

function SectionShell({
  eyebrow,
  title,
  intro,
  compact = false,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <div className="mb-10 max-w-4xl">
          <p className="kbd-eyebrow text-muted-foreground/70">{eyebrow}</p>
          <h2 className={`mt-3 font-display leading-tight ${compact ? "text-4xl md:text-[42px]" : "text-4xl md:text-5xl"}`}>{title}</h2>
          {intro ? <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">{intro}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function PassportSection({
  passport,
  lang,
}: {
  passport: {
    reference: TerritoryTextValue["value"];
    groups: TerritoryProfileGroup[];
  };
  lang: Lang;
}) {
  const items = passport.groups.flatMap((group) => group.items);

  return (
    <div className="space-y-6">
      <p className="text-sm leading-6 text-muted-foreground">{pick(passport.reference, lang)}</p>

      <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={pick(item.label, lang)}
            className={`grid gap-1 border-t hairline py-4 sm:grid-cols-[minmax(128px,0.42fr)_1fr] sm:gap-4 ${item.links?.length ? "sm:col-span-2 xl:col-span-3" : ""}`}
          >
            <dt className="text-base font-normal leading-6 text-[var(--beige)]/70 md:text-[17px]">{pick(item.label, lang)}</dt>
            <dd className="min-w-0 text-base font-normal leading-6 text-foreground/85 md:text-[17px]">
              <PassportValue item={item} lang={lang} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PassportValue({ item, lang }: { item: TerritoryTextValue; lang: Lang }) {
  if (!item.links?.length) return <>{pick(item.value, lang)}</>;

  return (
    <span className="flex flex-wrap gap-x-3 gap-y-2">
      {item.links.map((link, index) => {
        const territory = link.slug ? getTerritory(link.slug) : null;
        const label = pick(link.label, lang);
        const separator = index < item.links!.length - 1 ? <span className="ml-3 text-muted-foreground/45">·</span> : null;

        return (
          <span key={`${label}-${index}`} className="inline-flex items-center">
            {territory && link.slug ? (
              <Link
                to="/territories/$slug"
                params={{ slug: link.slug }}
                className="text-current underline decoration-border/80 underline-offset-4 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--beige)]"
              >
                {label}
              </Link>
            ) : (
              <span>{label}</span>
            )}
            {separator}
          </span>
        );
      })}
    </span>
  );
}

function VillageList({
  territory,
  territoryName,
  lang,
  labels: l,
}: {
  territory: Territory;
  territoryName: string;
  lang: Lang;
  labels: (typeof labels)[Lang];
}) {
  const useNeutralCards = territory.detail?.villageCardVisual === "neutral";

  return (
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
            const image = useNeutralCards ? null : detail?.hero ?? territory.image;

            return (
              <Link
                key={village.slug}
                to="/villages/$slug"
                params={{ slug: village.slug }}
                className="group grid min-h-[172px] overflow-hidden border hairline bg-background/35 transition-colors duration-500 hover:bg-foreground/[0.025] sm:grid-cols-[190px_1fr]"
              >
                <div className="relative min-h-[150px] overflow-hidden sm:min-h-full">
                  {image ? (
                    <>
                      <img
                        src={image}
                        alt={displayVillageName(village, lang)}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/55 to-transparent" />
                    </>
                  ) : (
                    <NeutralVillageVisual order={village.order} />
                  )}
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
  );
}

function NeutralVillageVisual({ order }: { order: number }) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(135deg,oklch(0.22_0.018_130)_0%,oklch(0.30_0.025_100)_48%,oklch(0.18_0.012_130)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.85_0.04_80_/_0.18),transparent_34%),linear-gradient(to_top,oklch(0.16_0.012_130_/_0.86),transparent_68%)]" />
      <div className="absolute bottom-4 left-4 font-display text-5xl text-foreground/18">{String(order).padStart(2, "0")}</div>
    </div>
  );
}

function NatureSection({ territory, places, lang }: { territory: Territory; places: TerritoryScenicPlace[]; lang: Lang }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {places.map((place, index) => (
        <article
          key={place.filename}
          className={`group relative min-h-[260px] overflow-hidden border hairline bg-background/35 ${index === 0 ? "md:col-span-2 lg:row-span-2 lg:min-h-[536px]" : ""}`}
        >
          <img
            src={getTerritoryPhotoUrl(territory.slug, place.filename)}
            alt={pick(place.alt, lang)}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
            <h3 className="font-display text-3xl leading-tight text-foreground">{pick(place.name, lang)}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}

function InfrastructureSection({ groups, lang }: { groups: TerritoryInfrastructureGroup[]; lang: Lang }) {
  const groupIcons = [GraduationCap, HeartPulse, BookOpen, Activity] as const;

  return (
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
      {groups.map((group, index) => {
        const Icon = groupIcons[index] ?? BookOpen;
        const visibleItems = [...group.primary, ...group.secondary];

        return (
          <article key={pick(group.title, lang)} className="border-t hairline pt-4">
            <h3 className="flex items-center gap-3 font-display text-xl font-normal leading-6 text-[var(--beige)]/75 md:text-[22px]">
              <Icon className="h-4 w-4 shrink-0 text-[var(--beige)]/70" strokeWidth={1.25} />
              <span>{pick(group.title, lang)}</span>
            </h3>
            <ul className="mt-4 grid gap-x-8 text-base font-normal leading-6 text-foreground/85 sm:grid-cols-2 md:text-[17px]">
              {visibleItems.map((item) => (
                <li key={pick(item, lang)} className="border-t hairline py-3.5">
                  {pick(item, lang)}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

function EconomySection({ body, profile, lang }: { body: TerritoryTextValue["value"]; profile: TerritoryEconomyProfileItem[]; lang: Lang }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.92fr)] lg:gap-12">
      <p className="max-w-3xl text-base font-normal leading-7 text-muted-foreground md:text-[17px] md:leading-8">
        {pick(body, lang)}
      </p>
      <dl className="border-y hairline divide-y divide-border/55">
        {profile.map((item) => (
          <div key={pick(item.label, lang)} className="grid gap-2 py-3.5 sm:grid-cols-[minmax(145px,0.38fr)_1fr] sm:gap-5">
            <dt className="text-base font-normal leading-6 text-[var(--beige)]/70 md:text-[17px]">{pick(item.label, lang)}</dt>
            <dd className="min-w-0 text-base font-normal leading-6 text-foreground/85 md:text-[17px]">
              <InlineValues values={item.values} lang={lang} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PeopleSection({ people, lang }: { people: PersonProfile[]; lang: Lang }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((person) => <TerritoryPersonCard key={person.slug} person={person} lang={lang} />)}
    </div>
  );
}

function TerritoryPersonCard({ person, lang }: { person: PersonProfile; lang: Lang }) {
  const isInPeopleDirectory = person.featuredInPeople !== false;
  const content = (
    <>
      <PersonPortrait person={person} lang={lang} />
      <div className="mt-5">
        <p className="font-display text-xl">{pick(person.name, lang)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{pick(person.role, lang)}</p>
        <p className="mt-5 text-base leading-7 text-[var(--beige)]/75">{person.body[lang]}</p>
      </div>
    </>
  );

  if (!isInPeopleDirectory) return <article className="group">{content}</article>;

  return (
    <Link to="/people" hash={person.slug} className="group block">
      {content}
    </Link>
  );
}

function PersonPortrait({ person, lang }: { person: PersonProfile; lang: Lang }) {
  return (
    <div className="relative aspect-[4/5] overflow-hidden border hairline bg-background/70">
      {person.image ? (
        <img
          src={person.image}
          alt={pick(person.name, lang)}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain grayscale transition-all duration-700 group-hover:grayscale-0"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-foreground/[0.025]" aria-hidden>
          <Users className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
        </div>
      )}
    </div>
  );
}
function InlineValues({ values, lang }: { values: TerritoryEconomyProfileItem["values"]; lang: Lang }) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {values.map((value, index) => (
        <span key={pick(value, lang)} className="inline-flex items-center">
          <span>{pick(value, lang)}</span>
          {index < values.length - 1 ? <span className="ml-3 text-muted-foreground/45">·</span> : null}
        </span>
      ))}
    </span>
  );
}

function GallerySection({ territory, images, lang }: { territory: Territory; images: TerritoryGalleryImage[]; lang: Lang }) {
  return (
    <div className="grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 sm:auto-rows-[250px] lg:grid-cols-6">
      {images.map((image) => (
        <figure key={image.filename} className={`${galleryClass(image.layout)} group relative overflow-hidden border hairline bg-background/30`}>
          <img
            src={getTerritoryPhotoUrl(territory.slug, image.filename)}
            alt={pick(image.alt, lang)}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-4 text-xs text-foreground/80">
            {pick(image.caption, lang)}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function galleryClass(layout: TerritoryGalleryImage["layout"]) {
  if (layout === "wide") return "sm:col-span-2 lg:col-span-4";
  if (layout === "tall") return "sm:row-span-2 lg:col-span-2";
  return "lg:col-span-2";
}