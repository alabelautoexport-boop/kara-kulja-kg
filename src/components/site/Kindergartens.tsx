import { catalogInstitutionName } from "@/lib/institution-names";
import { kindergartenDisplayName } from "./kindergarten-display-name";
import { EMPTY_INSTITUTION_FILTERS } from "@/lib/institution-types";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { SiteLayout } from "./Layout";
import { SchoolHeading } from "./Schools";
import { SchoolLocation } from "./SchoolCard";
import { InstitutionFilters } from "./InstitutionFilters";
import { useI18n, displayStructuredValue } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import { INSTITUTION_COPY } from "@/lib/institution-types";
import { localizedSchoolField } from "@/lib/schools-data";
import { getPublishedKindergartens, getPublishedKindergarten } from "@/lib/kindergartens-data";

export function KindergartensList() {
  const { lang, t } = useI18n(),
    c = INSTITUTION_COPY[lang],
    common = SCHOOL_COPY[lang];
  const [filters, setFilters] = useState(EMPTY_INSTITUTION_FILTERS);
  const query = useQuery({
    queryKey: ["kindergartens", "published"],
    queryFn: getPublishedKindergartens,
    retry: false,
  });
  const records = query.data ?? [];
  const filtered = records.filter(
    ({ slug, document: { info } }) =>
      (!filters.territory || info.territory_slug === filters.territory) &&
      (!filters.village || info.village_slug === filters.village) &&
      (kindergartenDisplayName(info, slug, lang) + " " + catalogInstitutionName(info, lang))
        .toLocaleLowerCase()
        .includes(filters.search.trim().toLocaleLowerCase()),
  );
  return (
    <SiteLayout>
      <SchoolHeading compact>
        <Link
          to="/about"
          hash="social-infrastructure"
          className="mb-4 inline-flex items-center gap-2 py-2 text-xs text-muted-foreground hover:text-[var(--beige)] focus-visible:outline focus-visible:outline-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("about.section.infrastructure")}
        </Link>
        <h1 className="font-display text-5xl md:text-6xl">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p>
      </SchoolHeading>
      <section className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">
        {records.length > 0 && (
          <InstitutionFilters
            values={filters}
            onChange={setFilters}
            locations={records.map((r) => r.document.info)}
          />
        )}
        {query.isPending ? (
          <p role="status">{common.loading}</p>
        ) : query.isError ? (
          <p role="alert">{c.unavailable}</p>
        ) : !records.length ? (
          <p className="text-muted-foreground">{c.empty}</p>
        ) : !filtered.length ? (
          <p>{c.noMatches}</p>
        ) : (
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((r) => (
              <Link
                key={r.kindergarten_id}
                to="/kindergartens/$slug"
                params={{ slug: r.slug }}
                className="group w-full min-w-0 max-w-md border hairline p-4 transition-colors hover:border-[var(--beige)] sm:p-5"
              >
                <h2 className="break-words font-display text-xl leading-snug">
                  {kindergartenDisplayName(r.document.info, r.slug, lang)}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  <SchoolLocation info={r.document.info} />
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--beige)]">
                  {lang === "en" ? "More details" : common.more}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

export function KindergartenPublicPage({ slug }: { slug: string }) {
  const { lang } = useI18n(),
    c = INSTITUTION_COPY[lang],
    common = SCHOOL_COPY[lang];
  const query = useQuery({
    queryKey: ["kindergartens", "published", slug],
    queryFn: () => getPublishedKindergarten(slug),
    retry: false,
  });
  const info = query.data?.document.info;
  return (
    <SiteLayout>
      <SchoolHeading compact>
        <Link
          to="/kindergartens"
          className="mb-4 inline-flex items-center gap-2 py-2 text-xs text-muted-foreground hover:text-[var(--beige)] focus-visible:outline focus-visible:outline-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {c.title}
        </Link>
        <h1 className="break-words font-display text-4xl md:text-5xl">
          {info ? kindergartenDisplayName(info, slug, lang) : c.title}
        </h1>
        {info && (
          <p className="mt-3 text-sm text-muted-foreground">
            <SchoolLocation info={info} />
          </p>
        )}
      </SchoolHeading>
      <section className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">
        {query.isPending ? (
          <p role="status">{common.loading}</p>
        ) : query.isError ? (
          <p role="alert">{c.unavailable}</p>
        ) : !info ? (
          <p>{c.notFound}</p>
        ) : (
          <>
            <h2 className="font-display text-3xl">{common.general}</h2>
            <dl className="mt-5 divide-y hairline border-y hairline text-sm">
              <div className="grid gap-2 py-4 sm:grid-cols-[12rem_1fr]">
                <dt className="text-muted-foreground">{common.address}</dt>
                <dd className="break-words">
                  {localizedSchoolField(info, "address", lang) ||
                    displayStructuredValue(null, lang)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </SiteLayout>
  );
}
