import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { getVillageHeroUrl } from "@/lib/r2";
import { displayVillageName, getVillage, VILLAGES, pick, type Village } from "@/lib/villages-data";
import { displayTerritoryName, getNeighborVillageSlugs, getTerritoryForVillage } from "@/lib/territories-data";
import { useI18n } from "@/lib/i18n";
import { getPeopleForVillage, type PersonProfile } from "@/lib/people-data";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  Archive,
  BookOpen,
  Compass,
  TrendingUp,
  Image as ImageIcon,
  Info,
  Map as MapIcon,
  Network,
} from "lucide-react";

const VillageMapBlock = lazy(() =>
  import("@/components/site/VillageMapBlock").then((module) => ({
    default: module.VillageMapBlock,
  })),
);

export const Route = createFileRoute("/villages_/$slug")({
  head: ({ params }) => {
    const v = getVillage(params.slug);
    const title = v ? `${v.name} — Kara-Kulja` : "Village — Kara-Kulja";
    const desc = v ? v.intro.en : "A village of Kara-Kulja district.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
      links: [{ rel: "canonical", href: `https://kara-kulja.kg/villages/${params.slug}` }],
    };
  },
  loader: ({ params }) => {
    const v = getVillage(params.slug);
    if (!v) throw notFound();
    return v;
  },
  notFoundComponent: NotFoundView,
  errorComponent: ErrorView,
  component: VillagePage,
});

function NotFoundView() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <p className="kbd-eyebrow text-muted-foreground">404</p>
        <h1 className="mt-4 font-display text-4xl">{t("village.notFound")}</h1>
        <Link to="/villages" className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("village.backToVillages")}
        </Link>
      </div>
    </SiteLayout>
  );
}

function ErrorView() {
  const { t } = useI18n();
  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-40 text-center">
        <h1 className="font-display text-3xl">{t("village.error")}</h1>
      </div>
    </SiteLayout>
  );
}

const ABOUT_LABEL = {
  kg: "Айыл жөнүндө",
  ru: "О селе",
  en: "About the village",
} as const;

const SECTIONS = [
  { id: "history", labelKey: "village.section.history", Icon: BookOpen },
  { id: "tourism", labelKey: "village.section.tourism", Icon: Compass },
  { id: "investment", labelKey: "village.section.investment", Icon: TrendingUp },
  { id: "people", labelKey: "village.section.people", Icon: Users },
  { id: "archive", labelKey: "village.section.archive", Icon: Archive },
  { id: "gallery", labelKey: "village.section.gallery", Icon: ImageIcon },
  { id: "map", labelKey: "village.section.map", Icon: MapIcon },
  { id: "related", labelKey: "village.section.related", Icon: Network },
] as const;

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Back to top"
      className={`fixed bottom-8 right-8 z-40 flex h-10 w-10 items-center justify-center rounded-full border hairline bg-background/60 backdrop-blur-md text-muted-foreground/60 transition-all duration-500 hover:bg-background/80 hover:text-foreground/80 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0 pointer-events-none"
      }`}
    >
      <ArrowUp className="h-4 w-4" strokeWidth={1.25} />
    </button>
  );
}

function SectionNav({ showInfo }: { showInfo: boolean }) {
  const { t, lang } = useI18n();
  const sections = [
    ...(showInfo ? [{ id: "about", label: ABOUT_LABEL[lang], Icon: Info }] : []),
    ...SECTIONS.map(({ id, labelKey, Icon }) => ({ id, label: t(labelKey), Icon })),
  ];
  const [active, setActive] = useState<string>(sections[0]?.id ?? "history");
  const sectionKey = sections.map((section) => section.id).join("|");

  useEffect(() => {
    setActive((current) =>
      sections.some((section) => section.id === current) ? current : sections[0]?.id ?? "",
    );

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean) as HTMLElement[];
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sectionKey]);

  return (
    <nav
      aria-label="Section navigation"
      className="border-y hairline bg-background/70 backdrop-blur-md"
    >
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <ul className="-mx-2 flex snap-x snap-mandatory gap-1 overflow-x-auto py-4 lg:flex-wrap lg:justify-center lg:gap-2 lg:overflow-visible lg:py-5">
          {sections.map(({ id, label, Icon }) => {
            const isActive = active === id;
            return (
              <li key={id} className="snap-start shrink-0">
                <a
                  href={"#" + id}
                  className={
                    "group inline-flex items-center gap-2 whitespace-nowrap px-3 py-2 transition-colors duration-300 " +
                    (isActive ? "text-foreground" : "text-muted-foreground/70 hover:text-foreground")
                  }
                >
                  <Icon
                    className={
                      "h-[14px] w-[14px] transition-colors " +
                      (isActive
                        ? "text-[var(--beige)]"
                        : "text-muted-foreground/50 group-hover:text-[var(--beige)]/80")
                    }
                    strokeWidth={1.25}
                  />
                  <span className="kbd-eyebrow text-[11px] tracking-[0.18em]">{label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

function VillagePage() {
  const v = Route.useLoaderData() as Village;
  const { t, lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const territory = getTerritoryForVillage(v.slug);
  const villageName = displayVillageName(v, lang);
  const territoryName = territory ? displayTerritoryName(territory, lang) : undefined;
  const centralPeople = getPeopleForVillage(v.slug);
  const relatedSlugs = getNeighborVillageSlugs(v.slug);
  const related = relatedSlugs
    .map((s: string) => VILLAGES.find((x) => x.slug === s))
    .filter(Boolean) as Village[];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SiteLayout>
      {/* HERO */}
      <section className="relative flex min-h-[88vh] items-end overflow-hidden pt-32">
        <img
          src={getVillageHeroUrl(v.territorySlug, v.slug)}
          alt={villageName}
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 gradient-fade-b" />
        <div className="absolute inset-0 gradient-vignette" />
        <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-20 lg:px-10 lg:pb-32">
          <Link
            to={territory ? "/territories/$slug" : "/villages"}
            params={territory ? { slug: territory.slug } : undefined}
            className="kbd-eyebrow inline-flex items-center gap-2 text-[var(--beige)]/80 hover:text-[var(--beige)]"
          >
            <ArrowLeft className="h-3 w-3" /> {territoryName ?? t("village.back")}
          </Link>
          <h1
            className={
              "mt-6 font-display leading-[1.02] text-balance text-foreground md:text-8xl " +
              (v.slug === "tokbay-talaa" ? "text-[42px] sm:text-6xl" : "text-6xl")
            }
          >
            {villageName}
          </h1>
          <p className="mt-6 max-w-2xl font-display text-2xl font-light italic leading-[1.4] text-foreground/85 md:text-3xl">
            «{pick(v.tagline, lang)}»
          </p>
          <p className="mt-8 max-w-xl text-base text-pretty text-muted-foreground md:text-lg">
            {pick(v.intro, lang)}
          </p>
        </div>
      </section>

      {/* SECTION NAVIGATION */}
      <div className="sticky top-0 z-30">
        <SectionNav showInfo={Boolean(v.showInfo && v.info.length)} />
      </div>

      {v.showInfo && v.info.length ? (
        <section id="about" className="scroll-mt-24 border-b hairline py-20 lg:py-24">
          <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
            <p className="kbd-eyebrow text-muted-foreground/70">{villageName}</p>
            <h2 className="mt-3 font-display text-4xl leading-tight md:text-[42px]">
              {ABOUT_LABEL[lang]}
            </h2>
            <dl className="mt-10 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {v.info.map((item) => (
                <div key={pick(item.label, lang)} className="grid gap-1 border-t hairline py-4">
                  <dt className="text-sm font-normal leading-6 text-[var(--beige)]/70">
                    {pick(item.label, lang)}
                  </dt>
                  <dd className="text-base font-normal leading-6 text-foreground/85">
                    {pick(item.value, lang)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ) : null}

      {/* HISTORY */}
      <section id="history" className="scroll-mt-24 py-28 lg:py-36">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-4">
            <p className="kbd-eyebrow text-muted-foreground/70">{t("village.section.history")}</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">
              {t("village.history.title")}
            </h2>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <p className="font-display text-xl font-light italic leading-[1.55] text-pretty text-foreground/85 md:text-2xl">
              {pick(v.history, lang)}
            </p>
          </div>
        </div>
      </section>

      {/* TOURISM OPPORTUNITIES */}
      <section
        id="tourism"
        className="scroll-mt-24 relative border-y hairline bg-background/40 py-28 lg:py-36"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="kbd-eyebrow text-muted-foreground/70">{t("village.section.tourism")}</p>
            <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">
              {t("village.tourism.title")}
            </h2>
            <p className="mt-6 font-display text-xl font-light italic leading-[1.5] text-foreground/80 md:text-2xl">
              {pick(v.tourism.lead, lang)}
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {v.tourism.items.map((it, i) => (
              <article
                key={i}
                className="group relative overflow-hidden border hairline"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={it.image}
                    alt={pick(it.title, lang)}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-[1.06]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6 lg:p-7">
                    <p className="kbd-eyebrow text-[var(--beige)]/80">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-3 font-display text-2xl leading-tight md:text-3xl">
                      {pick(it.title, lang)}
                    </h3>
                    <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
                      {pick(it.body, lang)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* INVESTMENT POTENTIAL */}
      <section id="investment" className="scroll-mt-24 py-28 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="kbd-eyebrow text-muted-foreground/70">{t("village.section.investment")}</p>
              <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">
                {t("village.investment.title")}
              </h2>
              <p className="mt-6 max-w-md text-base text-pretty text-muted-foreground md:text-lg">
                {pick(v.investment.lead, lang)}
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-px bg-border/40 sm:grid-cols-2 lg:grid-cols-3">
                {v.investment.items.map((it, i) => (
                  <div
                    key={i}
                    className="group relative bg-background p-8 transition-colors duration-500 hover:bg-foreground/[0.02]"
                  >
                    <p className="kbd-eyebrow text-[10px] text-muted-foreground/60">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-6 font-display text-2xl leading-tight">
                      {pick(it.title, lang)}
                    </h3>
                    <p className="mt-3 text-sm text-pretty text-muted-foreground">
                      {pick(it.body, lang)}
                    </p>
                    <div className="mt-8 h-px w-8 bg-[var(--beige)]/40 transition-all duration-500 group-hover:w-16 group-hover:bg-[var(--beige)]/80" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PEOPLE */}
      <section id="people" className="scroll-mt-24 border-t hairline py-28 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <h2 className="font-display text-4xl leading-[1.05] md:text-5xl">
            {t("village.section.people")}
          </h2>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {centralPeople.length
              ? centralPeople.map((person) => (
                  <CentralVillagePersonCard key={person.slug} person={person} lang={lang} />
                ))
              : v.people.map((person, index) => (
                  <div key={index} className="group">
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={person.img}
                        alt={pick(person.name, lang)}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    </div>
                    <div className="mt-5">
                      <p className="font-display text-xl">{pick(person.name, lang)}</p>
                      <p className="mt-1 kbd-eyebrow text-muted-foreground/70">
                        {pick(person.role, lang)}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </section>

      {/* ARCHIVE */}
      <section id="archive" className="scroll-mt-24 border-y hairline py-24 lg:py-32">
        <div className="mx-auto grid max-w-[1400px] gap-12 px-6 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-5">
            <Archive className="h-5 w-5 text-[var(--beige)]/70" strokeWidth={1.25} />
            <h2 className="mt-6 font-display text-4xl leading-[1.05] md:text-5xl">
              {t("village.section.archive")}
            </h2>
            <p className="mt-6 max-w-md text-base text-pretty text-muted-foreground md:text-lg">
              {t("village.archive.body")}
            </p>
            <p className="mt-8 text-sm text-muted-foreground/70">
              {t("village.archive.note")}
            </p>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square border hairline bg-foreground/[0.02]"
                  aria-hidden
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="scroll-mt-24 py-28 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <h2 className="font-display text-4xl leading-[1.05] md:text-5xl">
            {t("village.section.gallery")}
          </h2>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {v.gallery.map((src, i) => (
              <div
                key={i}
                className={`relative overflow-hidden ${
                  i % 5 === 0 ? "aspect-[3/4] md:col-span-2 md:aspect-[16/10]" : "aspect-square"
                }`}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MAP */}
      <section id="map" className="scroll-mt-16 border-y hairline py-16 lg:scroll-mt-24 lg:py-32">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-4xl leading-[1.05] md:text-5xl">
                {t("village.section.map")}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{pick(v.mapNote, lang)}</p>
          </div>
          {mounted ? (
            <Suspense fallback={<VillageMapLoading />}>
              <VillageMapBlock villageSlug={v.slug} villageName={villageName} />
            </Suspense>
          ) : (
            <VillageMapLoading />
          )}
        </div>
      </section>

      {/* RELATED */}
      <section id="related" className="scroll-mt-24 py-28 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <p className="kbd-eyebrow text-muted-foreground/70">{t("village.related.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl leading-[1.05] md:text-5xl">
            {t("village.related.title")}
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                to="/villages/$slug"
                params={{ slug: r.slug }}
                className="group relative block aspect-[16/10] overflow-hidden border hairline"
              >
                <img
                  src={r.hero}
                  alt={displayVillageName(r, lang)}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-8">
                  <div>
                    <p className="font-display text-3xl">{displayVillageName(r, lang)}</p>
                    <p className="mt-2 font-display italic text-foreground/80">«{pick(r.tagline, lang)}»</p>
                  </div>
                  <ArrowRight className="h-5 w-5 translate-y-[-2px] text-foreground/80 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <BackToTop />
    </SiteLayout>
  );
}

function CentralVillagePersonCard({
  person,
  lang,
}: {
  person: PersonProfile;
  lang: "kg" | "ru" | "en";
}) {
  const content = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden border hairline bg-background/70">
        {person.image ? (
          <img
            src={person.image}
            alt={person.name[lang]}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain grayscale transition-all duration-700 group-hover:grayscale-0"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center bg-foreground/[0.025]"
            aria-hidden
          >
            <Users className="h-12 w-12 text-muted-foreground/30" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="mt-5">
        <p className="font-display text-xl">{person.name[lang]}</p>
        <p className="mt-1 text-xs text-muted-foreground">{person.role[lang]}</p>
        <p className="mt-5 text-base leading-7 text-[var(--beige)]/75">
          {person.body[lang]}
        </p>
      </div>
    </>
  );

  if (person.featuredInPeople === false) {
    return <article className="group">{content}</article>;
  }

  return (
    <Link to="/people" hash={person.slug} className="group block">
      {content}
    </Link>
  );
}

function VillageMapLoading() {
  return (
    <div className="mt-12 flex min-h-[320px] items-center justify-center border hairline bg-[#efe5cf] px-6 text-sm text-[#26352d]">
      Loading map...
    </div>
  );
}
