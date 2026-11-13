import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ExternalLink } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useI18n, displayStructuredValue } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import {
  getPublishedSchool,
  getPublishedSchools,
  localizedSchoolField,
  type PublicSchoolDocument,
} from "@/lib/schools-data";
import {
  TERRITORIES,
  getOfficialVillage,
  displayTerritoryName,
  displayVillageName,
} from "@/lib/territories-data";
import { ORT_RANGES } from "@/lib/school-ort";
import valleyImg from "@/assets/valley.jpg";

function SchoolHeading({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden border-b hairline px-6 pb-12 pt-32 lg:px-10">
      <img
        src={valleyImg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-15"
      />
      <div className="relative mx-auto max-w-[1200px]">{children}</div>
    </div>
  );
}

export function SchoolLocation({ info }: { info: PublicSchoolDocument["info"] }) {
  const { lang } = useI18n();
  const territory = TERRITORIES.find((t) => t.slug === info.territory_slug);
  const village = getOfficialVillage(info.village_slug);
  return (
    <>
      {[
        village && displayVillageName(village, lang),
        territory && displayTerritoryName(territory, lang),
      ]
        .filter(Boolean)
        .join(" / ") || displayStructuredValue(null, lang)}
    </>
  );
}

export function SchoolsList() {
  const { lang } = useI18n();
  const c = SCHOOL_COPY[lang];
  const [territory, setTerritory] = useState("");
  const [village, setVillage] = useState("");
  const query = useQuery({
    queryKey: ["schools", "published"],
    queryFn: getPublishedSchools,
    retry: false,
  });
  const schools = query.data ?? [];
  const filtered = schools.filter(
    (s) =>
      (!territory || s.document.info.territory_slug === territory) &&
      (!village || s.document.info.village_slug === village),
  );
  const value = (n: number | string | null | undefined) =>
    displayStructuredValue(n == null ? null : String(n), lang);
  return (
    <SiteLayout>
      <SchoolHeading>
        <h1 className="font-display text-5xl md:text-6xl">{c.title}</h1>
      </SchoolHeading>
      <section className="mx-auto max-w-[1200px] px-6 py-12 lg:px-10">
        {schools.length > 0 && (
          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <select
              aria-label={c.territory}
              value={territory}
              onChange={(e) => {
                setTerritory(e.target.value);
                setVillage("");
              }}
              className="min-h-11 w-full border hairline bg-background px-3"
            >
              <option value="">{c.allTerritories}</option>
              {TERRITORIES.filter((t) =>
                schools.some((s) => s.document.info.territory_slug === t.slug),
              ).map((t) => (
                <option key={t.slug} value={t.slug}>
                  {displayTerritoryName(t, lang)}
                </option>
              ))}
            </select>
            <select
              aria-label={c.village}
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              className="min-h-11 w-full border hairline bg-background px-3"
            >
              <option value="">{c.allVillages}</option>
              {TERRITORIES.filter((t) => !territory || t.slug === territory)
                .flatMap((t) => t.villages)
                .filter((v) => schools.some((s) => s.document.info.village_slug === v.slug))
                .map((v) => (
                  <option key={v.slug} value={v.slug}>
                    {displayVillageName(v, lang)}
                  </option>
                ))}
            </select>
          </div>
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
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((s) => {
              const current = s.document.stats.find(
                (y) => y.academic_year === s.document.info.current_academic_year,
              );
              const latest = s.document.ort[0];
              return (
                <Link
                  key={s.school_id}
                  to="/schools/$slug"
                  params={{ slug: s.slug }}
                  className="group min-w-0 border hairline p-5 transition-colors hover:border-[var(--beige)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="break-words font-display text-2xl">
                      {localizedSchoolField(s.document.info, "name", lang)}
                    </h2>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    <SchoolLocation info={s.document.info} />
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {c.academicYear}: {value(s.document.info.current_academic_year || null)}
                  </p>
                  <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    {[
                      [c.students, current?.total_students],
                      [c.teachers, current?.total_teachers],
                      [c.graduates, current?.grade11_graduates],
                      [`${c.average}${latest ? ` (${latest.year})` : ""}`, latest?.summary.average],
                    ].map(([label, n]) => (
                      <div key={label}>
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="mt-1">{value(n as number | null | undefined)}</dd>
                      </div>
                    ))}
                  </dl>
                </Link>
              );
            })}
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
  const stats = doc?.stats.find((s) => s.academic_year === doc.info.current_academic_year);
  const ort = doc?.ort.find((s) => s.academic_year === doc.info.current_academic_year);
  const band = "border-b hairline py-10";
  const title = "mb-6 font-display text-3xl";
  return (
    <SiteLayout>
      <SchoolHeading>
        <Link to="/schools" className="text-sm text-muted-foreground hover:text-foreground">
          {c.all}
        </Link>
        <h1 className="mt-5 break-words font-display text-4xl md:text-5xl">
          {doc ? localizedSchoolField(doc.info, "name", lang) : c.title}
        </h1>
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
                  [c.director, doc.info.director_name],
                  [c.directorPhone, doc.info.director_phone],
                  [c.officePhone, doc.info.office_phone],
                  [c.address, localizedSchoolField(doc.info, "address", lang)],
                  [c.academicYear, doc.info.current_academic_year],
                ].map(([label, text]) => (
                  <div key={label}>
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="mt-1 break-words">{value(text)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={band}>
              <h2 className={title}>{c.indicators}</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {value(doc.info.current_academic_year)}
              </p>
              <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                {[
                  [c.students, stats?.total_students],
                  [c.teachers, stats?.total_teachers],
                  [c.graduates, stats?.grade11_graduates],
                  [c.participants, ort?.summary.participants],
                ].map(([label, n]) => (
                  <div key={label}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-3 font-display text-3xl">{value(n)}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className={band}>
              <h2 className={title}>{c.ort}</h2>
              {doc.ort.length > 1 && (
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-medium">{c.dynamics}</h3>
                  <ul className="space-y-2 text-sm">
                    {[...doc.ort].reverse().map((r) => (
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
              {doc.ort.map((r) => (
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
              {doc.ort.length > 0 && (
                <p className="text-xs text-muted-foreground">{c.rangesNote}</p>
              )}
            </section>
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
          </>
        )}
      </div>
    </SiteLayout>
  );
}
