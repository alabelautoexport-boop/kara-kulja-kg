import { catalogInstitutionName } from "@/lib/institution-names";
import { EMPTY_INSTITUTION_FILTERS } from "@/lib/institution-types";
import { TERRITORIES } from "@/lib/territories-data";
import { InstitutionFilters } from "./InstitutionFilters";
import {
  SCHOOL_TYPES,
  SCHOOL_TYPE_FILTER_LABELS,
  SCHOOL_TYPE_LABELS,
  INSTITUTION_COPY,
  isSchoolType,
} from "@/lib/institution-types";
import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n, displayStructuredValue } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import { getPublishedSchool, getPublishedSchools, localizedSchoolField } from "@/lib/schools-data";
import { ORT_RANGES } from "@/lib/school-ort";
import valleyImg from "@/assets/valley.jpg";
import { SchoolCard, SchoolLocation } from "./SchoolCard";
import { SchoolGallery } from "./SchoolGallery";
import { schoolPublicImageUrl, type SchoolMediaImage } from "@/lib/school-media-model";
import { getPublishedSchoolAcademicYears } from "@/lib/school-academic-years";

export function SchoolHeading({
  children,
  cover,
  compact = false,
}: {
  children: ReactNode;
  cover?: SchoolMediaImage | null;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden border-b hairline px-6 lg:px-10 ${compact ? "pb-8 pt-24 lg:pt-28" : "pb-12 pt-32"}`}
    >
      <img
        src={valleyImg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="relative mx-auto max-w-[1200px]">
        {cover && schoolPublicImageUrl(cover, "main") && (
          <img
            src={schoolPublicImageUrl(cover, "main")}
            alt=""
            width={cover.width}
            height={cover.height}
            className="mb-7 max-h-[60vh] w-full object-contain"
            fetchPriority="high"
          />
        )}
        {children}
      </div>
    </div>
  );
}

export function SchoolsList() {
  const { lang, t } = useI18n();
  const c = SCHOOL_COPY[lang];
  const [filters, setFilters] = useState(EMPTY_INSTITUTION_FILTERS);
  const { territory, village, search, type } = filters;
  const query = useQuery({
    queryKey: ["schools", "published"],
    queryFn: getPublishedSchools,
    retry: false,
  });
  const schools = query.data ?? [];
  const filtered = schools.filter(
    (s) =>
      (!type || s.document.info.school_type === type) &&
      (!territory || s.document.info.territory_slug === territory) &&
      (!village || s.document.info.village_slug === village) &&
      (
        localizedSchoolField(s.document.info, "name", lang) +
        " " +
        catalogInstitutionName(s.document.info, lang)
      )
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  return (
    <SiteLayout>
      <SchoolHeading compact>
        <Link
          to="/about"
          hash="social-infrastructure"
          className="mb-4 inline-flex max-w-full items-start gap-2 py-2 text-xs leading-relaxed text-muted-foreground transition-colors hover:text-[var(--beige)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ember)]"
        >
          <ArrowLeft aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t("about.section.infrastructure")}
        </Link>
        <h1 className="font-display text-5xl md:text-6xl">{c.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{c.subtitle}</p>
      </SchoolHeading>
      <section className="mx-auto max-w-[1200px] px-6 py-8 lg:px-10">
        {schools.length > 0 && (
          <InstitutionFilters
            school
            values={filters}
            onChange={setFilters}
            locations={schools.map((s) => s.document.info)}
            types={SCHOOL_TYPES.map((value, i) => ({
              value,
              label: SCHOOL_TYPE_FILTER_LABELS[lang][i],
            }))}
          />
        )}
        {query.isPending ? (
          <p role="status">{c.loading}</p>
        ) : query.isError ? (
          <p role="alert">{c.unavailable}</p>
        ) : !schools.length ? (
          <p className="text-muted-foreground">{c.empty}</p>
        ) : !filtered.length ? (
          <p>{c.noMatches}</p>
        ) : (
          <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <SchoolCard key={s.school_id} school={s} />
            ))}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

export function SchoolPublicPage({ slug }: { slug: string }) {
  const { lang } = useI18n();
  const c = SCHOOL_COPY[lang];
  const query = useQuery({
    queryKey: ["schools", "published", slug],
    queryFn: () => getPublishedSchool(slug),
    retry: false,
  });
  const doc = query.data?.document;
  const value = (n: number | string | null | undefined) =>
    displayStructuredValue(n == null ? null : String(n), lang);
  const academicYears = query.data ? getPublishedSchoolAcademicYears(query.data) : [];
  const latestYear = academicYears[0];
  const stats = latestYear?.stats;
  const reportingYear = latestYear?.academic_year;
  const ortYears = academicYears.flatMap((period) => period.ort);
  const band = "border-b hairline py-10";
  const title = "mb-6 font-display text-3xl";
  return (
    <SiteLayout>
      <SchoolHeading cover={doc?.media?.cover}>
        <Link to="/schools" className="text-sm text-muted-foreground hover:text-foreground">
          {c.all}
        </Link>
        <h1 className="mt-5 break-words font-display text-4xl md:text-5xl">
          {doc ? localizedSchoolField(doc.info, "name", lang) : c.title}
        </h1>
        {doc && (
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              <SchoolLocation info={doc.info} />
            </p>
          </div>
        )}
      </SchoolHeading>
      <div className="mx-auto max-w-[1200px] px-6 pb-12 lg:px-10">
        {!doc ? (
          <p role={query.isError ? "alert" : "status"} className="py-12">
            {query.isPending ? c.loading : query.isError ? c.unavailable : c.notFound}
          </p>
        ) : (
          <>
            <section className={band}>
              <h2 className={title}>{c.general}</h2>
              <dl className="grid gap-x-12 gap-y-5 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">
                    {c.village} / {c.territory}
                  </dt>
                  <dd className="mt-1">
                    <SchoolLocation info={doc.info} />
                  </dd>
                </div>
                {[
                  [
                    INSTITUTION_COPY[lang].schoolType,
                    isSchoolType(doc.info.school_type)
                      ? SCHOOL_TYPE_LABELS[doc.info.school_type][lang]
                      : "",
                  ],
                  [c.director, doc.info.director_name],
                  [c.directorPhone, doc.info.director_phone],
                  [c.officePhone, doc.info.office_phone],
                  [c.address, localizedSchoolField(doc.info, "address", lang)],
                ].map(([label, text]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words">{value(text)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={band} aria-labelledby="school-indicators-heading">
              <h2 id="school-indicators-heading" className={title}>
                {c.indicators}
              </h2>
              {reportingYear ? (
                <>
                  <p className="-mt-3 mb-5 text-xs text-muted-foreground">
                    {c.academicYear}: {reportingYear}
                  </p>
                  <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
                    <div className="min-w-0">
                      <h3 className="mb-3 font-sans text-base font-semibold tracking-normal text-foreground">
                        {c.students}
                      </h3>
                      <dl className="space-y-2 text-sm">
                        {[
                          [c.total, stats?.total_students],
                          [c.graduates, stats?.grade11_graduates],
                        ].map(([label, n]) => (
                          <div key={label} className="flex items-baseline justify-between gap-4">
                            <dt className="text-muted-foreground">{label}</dt>
                            <dd className="text-right tabular-nums">{value(n)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="min-w-0">
                      <h3 className="mb-3 font-sans text-base font-semibold tracking-normal text-foreground">
                        {c.teachers}
                      </h3>
                      <dl className="text-sm">
                        <div className="flex items-baseline justify-between gap-4">
                          <dt className="text-muted-foreground">{c.total}</dt>
                          <dd className="text-right tabular-nums">
                            {value(stats?.total_teachers)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{c.noAnnualData}</p>
              )}
            </section>
            <section className={band}>
              <h2 className={title}>{c.ort}</h2>
              {!ortYears.length && (
                <p className="text-sm text-muted-foreground">{c.noAnnualData}</p>
              )}
              {ortYears.length > 1 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-medium">{c.dynamics}</h3>
                  <ul className="space-y-2 text-sm">
                    {[...ortYears].reverse().map((r) => (
                      <li
                        key={r.year}
                        className="flex flex-wrap justify-between gap-3 border-b hairline py-2"
                      >
                        <span>{r.year}</span>
                        <span>
                          {c.average}: {value(r.summary.average)}
                        </span>
                        <span>
                          {c.participants}: {r.summary.participants}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ortYears.map((r) => (
                <div key={r.year} className="mb-8">
                  <h3 className="mb-5 text-xl">
                    {r.year}{" "}
                    <span className="text-sm text-muted-foreground">{r.academic_year}</span>
                  </h3>
                  <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3 lg:grid-cols-5">
                    {[
                      [c.participants, r.summary.participants],
                      [c.average, r.summary.average],
                      [c.median, r.summary.median],
                      [c.minimum, r.summary.minimum],
                      [c.maximum, r.summary.maximum],
                      [c.over200, r.summary.over200],
                    ].map(([label, n]) => (
                      <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1">{value(n)}</dd>
                      </div>
                    ))}
                  </dl>
                  <h4 className="mb-3 mt-6 text-sm">{c.distribution}</h4>
                  <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
                    {ORT_RANGES.map((range, i) => (
                      <div key={range} className="border-t hairline pt-2">
                        <dt className="text-muted-foreground">{i === 0 ? c.upTo109 : range}</dt>
                        <dd>{r.summary.distribution[i]}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
              {ortYears.length > 0 && (
                <p className="text-xs text-muted-foreground">{c.rangesNote}</p>
              )}
            </section>
            {!!doc.media?.gallery.length && (
              <section className={band}>
                <h2 className={title}>{c.schoolLife}</h2>
                <SchoolGallery images={doc.media.gallery} />
              </section>
            )}
            {!!doc.achievements.length && (
              <section className={band}>
                <h2 className={title}>{c.achievements}</h2>
                <div className="space-y-6">
                  {doc.achievements.map((a, i) => (
                    <article key={i}>
                      <p className="text-xs text-muted-foreground">{a.date}</p>
                      <h3 className="mt-2 break-words font-display text-2xl">
                        {localizedSchoolField(a, "title", lang)}
                      </h3>
                      <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">
                        {localizedSchoolField(a, "description", lang)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {!!doc.resources.length && (
              <section className="py-10">
                <h2 className={title}>{c.resources}</h2>
                <ul className="divide-y divide-border">
                  {doc.resources.map((r, i) => (
                    <li key={i} className="py-5">
                      <h3 className="break-words text-base">
                        {r.url && /^https?:\/\//i.test(r.url) ? (
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-start gap-2 hover:text-[var(--beige)]"
                          >
                            {localizedSchoolField(r, "title", lang)}
                            <ExternalLink className="mt-1 h-4 w-4 shrink-0" />
                          </a>
                        ) : (
                          localizedSchoolField(r, "title", lang)
                        )}
                      </h3>
                      <p className="mt-2 break-words text-sm leading-7 text-muted-foreground">
                        {localizedSchoolField(r, "description", lang)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {[r.year, r.source].filter(Boolean).join(" / ")}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <nav className="flex flex-wrap gap-5 border-t hairline py-8 text-sm">
              {TERRITORIES.some((territory) =>
                territory.villages.some((village) => village.slug === doc.info.village_slug),
              ) && (
                <Link to="/villages/$slug" params={{ slug: doc.info.village_slug }}>
                  {c.village}: <SchoolLocation info={doc.info} />
                </Link>
              )}
              {TERRITORIES.some((territory) => territory.slug === doc.info.territory_slug) && (
                <Link to="/territories/$slug" params={{ slug: doc.info.territory_slug }}>
                  {c.territory}
                </Link>
              )}
            </nav>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
