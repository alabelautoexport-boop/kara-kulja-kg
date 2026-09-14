import type { ReactNode } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, BookOpen, GraduationCap, HeartPulse, Home, Map as MapIcon, MapPin, Users } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { displayStructuredAbsence, displayStructuredValue, useI18n, type Lang } from "@/lib/i18n";
import { getPeopleForTerritory, type PersonProfile } from "@/lib/people-data";
import { getTerritoryHeroUrl, getTerritoryPhotoUrl } from "@/lib/r2";
import {
  displayTerritoryName,
  displayVillageName,
  formatPopulation,
  getTerritory,
  pick,
  type Localized,
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

const sectionTitles: Record<
  Lang,
  {
    passport: string;
    nature: string;
    infrastructure: string;
    economy: string;
    history: string;
    gallery: string;
  }
> = {
  kg: {
    passport: "Айыл аймагы жөнүндө",
    nature: "Жаратылыш",
    infrastructure: "Социалдык инфраструктура",
    economy: "Экономика",
    history: "Тарых",
    gallery: "Галерея",
  },
  ru: {
    passport: "Об айыл аймаке",
    nature: "Природа",
    infrastructure: "Социальная инфраструктура",
    economy: "Экономика",
    history: "История",
    gallery: "Галерея",
  },
  en: {
    passport: "About the aiyl aimak",
    nature: "Nature",
    infrastructure: "Social infrastructure",
    economy: "Economy",
    history: "History",
    gallery: "Gallery",
  },
};

const heroStatLabels: Record<Lang, readonly [string, string, string, string]> = {
  kg: ["Калк", "Айыл", "Кожолук", "Жалпы аянт"],
  ru: ["Население", "Сёла", "Хозяйства", "Общая площадь"],
  en: ["Population", "Villages", "Households", "Total area"],
};

type TerritoryPassportKey =
  | "region"
  | "district"
  | "administrativeCenter"
  | "population"
  | "villages"
  | "households"
  | "totalArea"
  | "elevation"
  | "districtDistance";

const TERRITORY_PASSPORT_ORDER: TerritoryPassportKey[] = [
  "region",
  "district",
  "administrativeCenter",
  "population",
  "villages",
  "households",
  "totalArea",
  "elevation",
  "districtDistance",
];

const TERRITORY_PASSPORT_LABELS: Record<Lang, Record<TerritoryPassportKey, string>> = {
  kg: {
    region: "Облусу",
    district: "Району",
    administrativeCenter: "Административдик борбору",
    population: "Калкы",
    villages: "Айылдардын саны",
    households: "Кожолук саны",
    totalArea: "Жалпы аянты",
    elevation: "Деңиз деңгээлинен бийиктиги",
    districtDistance: "Район борборунан аралык",
  },
  ru: {
    region: "Область",
    district: "Район",
    administrativeCenter: "Административный центр",
    population: "Население",
    villages: "Количество сёл",
    households: "Количество хозяйств",
    totalArea: "Общая площадь",
    elevation: "Высота над уровнем моря",
    districtDistance: "Расстояние до районного центра",
  },
  en: {
    region: "Region",
    district: "District",
    administrativeCenter: "Administrative center",
    population: "Population",
    villages: "Number of villages",
    households: "Households",
    totalArea: "Total area",
    elevation: "Elevation above sea level",
    districtDistance: "Distance to district center",
  },
};

const TERRITORY_PASSPORT_KEYS: Record<string, TerritoryPassportKey> = {
  "Облусу": "region",
  "Району": "district",
  "Административдик борбору": "administrativeCenter",
  "Калкы": "population",
  "Айылдары": "villages",
  "Айылдардын саны": "villages",
  "Кожолуктар": "households",
  "Кожолук саны": "households",
  "Жалпы аянт": "totalArea",
  "Жалпы аянты": "totalArea",
  "Деңиз деңгээлинен": "elevation",
  "Деңиз деңгээлинен бийиктиги": "elevation",
  "Район борборунан аралык": "districtDistance",
};

type InfrastructureMetricKey =
  | "schools"
  | "students"
  | "kindergartens"
  | "preschoolGroups"
  | "fap"
  | "familyMedicine"
  | "ambulance"
  | "cultureHouses"
  | "libraries"
  | "sportsFacilities";

type InfrastructureGroupSchema = {
  key: "education" | "healthcare" | "cultureSport";
  title: Record<Lang, string>;
  metrics: Array<{ key: InfrastructureMetricKey; label: Record<Lang, string> }>;
};

const INFRASTRUCTURE_SCHEMA: InfrastructureGroupSchema[] = [
  {
    key: "education",
    title: { kg: "Билим берүү", ru: "Образование", en: "Education" },
    metrics: [
      { key: "schools", label: { kg: "Мектептер", ru: "Школы", en: "Schools" } },
      { key: "students", label: { kg: "Окуучулар", ru: "Учащиеся", en: "Students" } },
      { key: "kindergartens", label: { kg: "Бала бакчалар", ru: "Детские сады", en: "Kindergartens" } },
      { key: "preschoolGroups", label: { kg: "Мектепке чейинки топтор", ru: "Дошкольные группы", en: "Preschool groups" } },
    ],
  },
  {
    key: "healthcare",
    title: { kg: "Саламаттык сактоо", ru: "Здравоохранение", en: "Healthcare" },
    metrics: [
      { key: "fap", label: { kg: "ФАП", ru: "ФАП", en: "FAP clinics" } },
      { key: "familyMedicine", label: { kg: "ҮДТ / ГСВ", ru: "ЦСМ / ГСВ", en: "Family medicine / GSV facilities" } },
      { key: "ambulance", label: { kg: "Тез жардам", ru: "Скорая помощь", en: "Ambulance service" } },
    ],
  },
  {
    key: "cultureSport",
    title: { kg: "Маданият жана спорт", ru: "Культура и спорт", en: "Culture and sport" },
    metrics: [
      { key: "cultureHouses", label: { kg: "Маданият үйлөрү / клубдар", ru: "Дома культуры / клубы", en: "Culture houses / clubs" } },
      { key: "libraries", label: { kg: "Китепканалар", ru: "Библиотеки", en: "Libraries" } },
      { key: "sportsFacilities", label: { kg: "Спорт объекттери", ru: "Спортивные объекты", en: "Sports facilities" } },
    ],
  },
];

const STRUCTURED_PRESENCE: Record<Lang, string> = { kg: "Бар", ru: "Есть", en: "Present" };

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
  const sectionTitle = sectionTitles[lang];
  const territoryName = displayTerritoryName(territory, lang);
  const detail = territory.detail;
  const people = getPeopleForTerritory(territory.slug);
  const animateHero = territory.slug === "ylai-talaa";

  return (
    <SiteLayout>
      <section className="relative flex min-h-[86vh] items-end overflow-hidden pt-32">
        <img
          src={getTerritoryHeroUrl(territory.slug)}
          alt={territoryName}
          loading="eager"
          fetchPriority="high"
          className={
            "absolute inset-0 h-full w-full object-cover " +
            (animateHero ? "ylai-talaa-hero-image" : "")
          }
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
          <p className="mt-6 max-w-2xl text-base text-pretty text-muted-foreground md:text-lg">
            {pick(territory.description, lang)}
          </p>
          <HeroStats territory={territory} lang={lang} />
        </div>
      </section>

      <SectionShell
        eyebrow={territoryName}
        title={detail?.passport ? pick(detail.passport.title, lang) : sectionTitle.passport}
        compact
      >
        <PassportSection territory={territory} passport={detail?.passport} lang={lang} />
      </SectionShell>

      <VillageList territory={territory} territoryName={territoryName} lang={lang} labels={l} />

      <SectionShell
        eyebrow={territoryName}
        title={detail?.nature ? pick(detail.nature.title, lang) : sectionTitle.nature}
        intro={detail?.nature ? pick(detail.nature.intro, lang) : undefined}
      >
        {detail?.nature?.places.length ? (
          <NatureSection territory={territory} places={detail.nature.places} lang={lang} />
        ) : null}
      </SectionShell>

      <SectionShell
        eyebrow={territoryName}
        title={detail?.infrastructure ? pick(detail.infrastructure.title, lang) : sectionTitle.infrastructure}
        compact
      >
        <InfrastructureSection groups={detail?.infrastructure?.groups ?? []} lang={lang} />
      </SectionShell>

      <SectionShell
        eyebrow={territoryName}
        title={detail?.economy ? pick(detail.economy.title, lang) : sectionTitle.economy}
      >
        {detail?.economy ? (
          <EconomySection body={detail.economy.body} profile={detail.economy.profile} lang={lang} />
        ) : null}
      </SectionShell>

      <SectionShell
        eyebrow={territoryName}
        title={detail?.history ? pick(detail.history.title, lang) : sectionTitle.history}
      >
        {detail?.history && pick(detail.history.body, lang) ? (
          <p className="max-w-4xl text-base leading-8 text-muted-foreground md:text-lg md:leading-9">
            {pick(detail.history.body, lang)}
          </p>
        ) : null}
      </SectionShell>

      <SectionShell eyebrow={territoryName} title={t("nav.people")}>
        {people.length ? <PeopleSection people={people} lang={lang} /> : null}
      </SectionShell>

      <SectionShell
        eyebrow={territoryName}
        title={detail?.gallery ? pick(detail.gallery.title, lang) : sectionTitle.gallery}
      >
        {detail?.gallery?.images.length ? (
          <GallerySection territory={territory} images={detail.gallery.images} lang={lang} />
        ) : null}
      </SectionShell>
    </SiteLayout>
  );
}

function HeroStats({
  territory,
  lang,
}: {
  territory: Territory;
  lang: Lang;
}) {
  const detailStats = territory.detail?.heroStats;
  const statIcons = [Users, MapPin, Home, MapIcon] as const;
  const fallbackValues = [formatPopulation(territory.population), String(territory.villages.length), "", ""];
  const stats = heroStatLabels[lang].map((label, index) => ({
    label,
    value: displayStructuredValue(
      detailStats?.[index] ? pick(detailStats[index].value, lang) : fallbackValues[index],
      lang,
    ),
    Icon: statIcons[index],
  }));

  return (
    <div className="mt-10 flex flex-wrap gap-3 text-xs text-muted-foreground">
      {stats.map(({ label, value, Icon }) => (
        <span
          key={label}
          className="inline-flex items-center gap-2 border hairline bg-background/35 px-3 py-2 font-normal backdrop-blur-md"
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--beige)]/70" strokeWidth={1.25} />
          <span>{value}</span>
          <span>{label}</span>
        </span>
      ))}
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

type TerritoryPassport = {
  reference: TerritoryTextValue["value"];
  groups: TerritoryProfileGroup[];
};

const localizedValue = (kg: string, ru = kg, en = kg): Localized<string> => ({ kg, ru, en });
const hasLocalizedValue = (value?: Localized<string>) =>
  Boolean(value && Object.values(value).some((part) => part.trim()));

function getTerritoryPassportItems(territory: Territory) {
  const sourceItems = territory.detail?.passport?.groups.flatMap((group) => group.items) ?? [];
  const sourceByKey = new Map<TerritoryPassportKey, TerritoryTextValue>();

  sourceItems.forEach((item) => {
    const key = TERRITORY_PASSPORT_KEYS[item.label.kg];
    if (key && !sourceByKey.has(key)) sourceByKey.set(key, item);
  });

  const heroStats = territory.detail?.heroStats;
  const populationKgRu = new Intl.NumberFormat("ru-RU").format(territory.population);
  const populationEn = new Intl.NumberFormat("en-US").format(territory.population);
  const fallbacks: Partial<Record<TerritoryPassportKey, Localized<string>>> = {
    population: heroStats?.[0]?.value ?? localizedValue(populationKgRu, populationKgRu, populationEn),
    villages: heroStats?.[1]?.value ?? localizedValue(String(territory.villages.length)),
    households: heroStats?.[2]?.value,
    totalArea: heroStats?.[3]?.value,
  };

  return TERRITORY_PASSPORT_ORDER.map((key) => {
    const source = sourceByKey.get(key);
    const value = hasLocalizedValue(source?.value) ? source!.value : fallbacks[key] ?? localizedValue("");

    return {
      key,
      item: {
        label: {
          kg: TERRITORY_PASSPORT_LABELS.kg[key],
          ru: TERRITORY_PASSPORT_LABELS.ru[key],
          en: TERRITORY_PASSPORT_LABELS.en[key],
        },
        value,
        links: source?.links,
      } satisfies TerritoryTextValue,
    };
  });
}

function PassportSection({ territory, passport, lang }: { territory: Territory; passport?: TerritoryPassport; lang: Lang }) {
  const items = getTerritoryPassportItems(territory);

  return (
    <div className="space-y-6">
      {passport ? <p className="text-sm leading-6 text-muted-foreground">{pick(passport.reference, lang)}</p> : null}

      <dl className="grid gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
        {items.map(({ key, item }) => (
          <div
            key={key}
            className={`grid gap-1 border-t hairline py-4 sm:grid-cols-[minmax(128px,0.42fr)_1fr] sm:gap-4 ${item.links?.length ? "sm:col-span-2 xl:col-span-3" : ""}`}
          >
            <dt className="text-base font-normal leading-6 text-[var(--beige)]/70 md:text-[17px]">{pick(item.label, lang)}</dt>
            <dd className="min-w-0 break-words text-base font-normal leading-6 text-foreground/85 md:text-[17px]">
              <PassportValue item={item} lang={lang} />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function PassportValue({ item, lang }: { item: TerritoryTextValue; lang: Lang }) {
  if (!item.links?.length) return <>{displayStructuredValue(pick(item.value, lang), lang)}</>;

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
                    {village.population != null ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {formatPopulation(village.population)} {l.population}
                      </p>
                    ) : null}
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

type InfrastructureSourceItem = {
  group: string;
  value: Localized<string>;
};

function matchesInfrastructureMetric(metric: InfrastructureMetricKey, item: InfrastructureSourceItem) {
  const group = item.group.toLocaleLowerCase("ky-KG");
  const value = item.value.kg.toLocaleLowerCase("ky-KG");
  const education = group.includes("билим");
  const healthcare = group.includes("саламаттык");
  const culture = group.includes("маданият");
  const sport = group.includes("спорт");

  switch (metric) {
    case "schools":
      return education && value.includes("мектеп") && !value.includes("мектепке") && !value.includes("окуучу") && !value.includes("орун");
    case "students":
      return education && value.includes("окуучу");
    case "kindergartens":
      return education && (value.includes("бала бакча") || value.includes("мектепке чейинки мекеме"));
    case "preschoolGroups":
      return education && value.includes("мектепке чейинки топ");
    case "fap":
      return healthcare && value.includes("фап");
    case "familyMedicine":
      return healthcare && (value.includes("үдт") || value.includes("гсв") || value.includes("үй-бүлөлүк медицина") || value.includes("үй-бүлөлүк дарыгер"));
    case "ambulance":
      return healthcare && value.includes("тез жардам");
    case "cultureHouses":
      return culture && (value.includes("маданият үй") || value.includes("клуб"));
    case "libraries":
      return culture && value.includes("китепкана");
    case "sportsFacilities":
      return sport;
  }
}

function getInfrastructureMetricValue(
  metric: InfrastructureMetricKey,
  sourceItems: InfrastructureSourceItem[],
  lang: Lang,
) {
  const matches = sourceItems.filter((item) => matchesInfrastructureMetric(metric, item));
  if (!matches.length) return undefined;

  if (matches.every((item) => item.value.kg.toLocaleLowerCase("ky-KG").includes("жок"))) {
    return displayStructuredAbsence(lang);
  }

  if (matches.length > 1) return matches.map((item) => pick(item.value, lang)).join("; ");

  const value = pick(matches[0].value, lang);
  const numericValue = value.match(/^([\d][\d\s.,-]*)\s+/)?.[1]?.trim();
  return numericValue || STRUCTURED_PRESENCE[lang];
}

function InfrastructureSection({ groups, lang }: { groups: TerritoryInfrastructureGroup[]; lang: Lang }) {
  const groupIcons = [GraduationCap, HeartPulse, BookOpen] as const;
  const sourceItems = groups.flatMap((group) =>
    [...group.primary, ...group.secondary].map((value) => ({ group: group.title.kg, value })),
  );

  return (
    <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
      {INFRASTRUCTURE_SCHEMA.map((group, index) => {
        const Icon = groupIcons[index];

        return (
          <article key={group.key} className="border-t hairline pt-4">
            <h3 className="flex items-center gap-3 font-display text-xl font-normal leading-6 text-[var(--beige)]/75 md:text-[22px]">
              <Icon className="h-4 w-4 shrink-0 text-[var(--beige)]/70" strokeWidth={1.25} />
              <span>{group.title[lang]}</span>
            </h3>
            <ul className="mt-4 text-base font-normal leading-6 text-foreground/85 md:text-[17px]">
              {group.metrics.map((metric) => (
                <li key={metric.key} className="grid min-w-0 gap-1 border-t hairline py-3.5 sm:grid-cols-[minmax(160px,0.48fr)_1fr] sm:gap-4">
                  <span className="text-[var(--beige)]/70">{metric.label[lang]}</span>
                  <span className="min-w-0 break-words">
                    {displayStructuredValue(getInfrastructureMetricValue(metric.key, sourceItems, lang), lang)}
                  </span>
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
    <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} className="w-full">
      <CarouselContent className="-ml-6">
        {people.map((person) => (
          <CarouselItem key={person.slug} className="basis-[84%] pl-6 sm:basis-[48%] lg:basis-[32%] xl:basis-[29%]">
            <TerritoryPersonCard person={person} lang={lang} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="-left-4 hidden border-border/60 bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-opacity disabled:pointer-events-none disabled:opacity-0 md:inline-flex" />
      <CarouselNext className="-right-4 hidden border-border/60 bg-background/85 text-foreground shadow-sm backdrop-blur-sm transition-opacity disabled:pointer-events-none disabled:opacity-0 md:inline-flex" />
    </Carousel>
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
