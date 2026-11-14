import { useState } from "react";
import { useAdminI18n } from "@/lib/admin-i18n";
import { TERRITORIES, displayTerritoryName, displayVillageName } from "@/lib/territories-data";
import {
  filterSchools,
  schoolStatus,
  schoolStatusKind,
  type SchoolFilter,
} from "@/lib/school-admin";
import type { SchoolRecord } from "@/lib/schools-data";
import { SchoolLifecycleActions } from "./SchoolLifecycleActions";

export function SchoolStatusBadge({ record }: { record: SchoolRecord }) {
  const { t } = useAdminI18n();
  const status = schoolStatusKind(record);
  const styles = {
    draft: "border-white/10 bg-white/5 text-muted-foreground",
    review: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    published: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
    correction: "border-orange-400/20 bg-orange-400/10 text-orange-200",
    archived: "border-white/5 bg-white/[0.025] text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex max-w-full rounded-sm border px-2.5 py-1 font-sans text-xs leading-relaxed ${styles[status]}`}
    >
      {t(schoolStatus(record))}
    </span>
  );
}

export function SchoolMetadata({ record }: { record: SchoolRecord }) {
  const { t, locale } = useAdminI18n();
  const territory = TERRITORIES.find((item) => item.slug === record.territory_slug);
  const village = territory?.villages.find((item) => item.slug === record.village_slug);
  return (
    <div className="space-y-2 text-sm">
      <p className="break-words text-muted-foreground">
        {territory ? displayTerritoryName(territory, locale) : t("Аймак не указан")}
        {" · "}
        {village ? displayVillageName(village, locale) : t("Село не указано")}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SchoolStatusBadge record={record} />
      </div>
    </div>
  );
}

export function SchoolAdminList({
  schools,
  onOpen,
  onLifecycleChange,
}: {
  schools: SchoolRecord[];
  onOpen: (id: string) => void;
  onLifecycleChange: (deleted: boolean, message: string) => Promise<void>;
}) {
  const { t } = useAdminI18n();
  const [filter, setFilter] = useState<SchoolFilter>("all");
  const [query, setQuery] = useState("");
  const filtered = filterSchools(schools, filter, query);
  return (
    <section aria-labelledby="school-list-heading" className="min-w-0 font-sans text-sm">
      <h2 id="school-list-heading" className="mb-4 font-sans text-lg font-semibold tracking-normal">
        {t("Список школ")}
      </h2>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={t("Статус школы")} className="flex flex-wrap gap-2">
          {(
            [
              ["all", "Все"],
              ["draft", "Черновики"],
              ["review", "На проверке"],
              ["published", "Опубликованные"],
              ["archived", "Архив"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={`min-h-10 rounded-sm border px-3 py-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--beige)] ${filter === key ? "border-[var(--beige)] bg-white/5 text-foreground" : "border-transparent text-muted-foreground hover:border-white/10 hover:text-foreground"}`}
            >
              {t(label)}
            </button>
          ))}
        </div>
        <label className="min-w-0 text-sm text-muted-foreground lg:w-64">
          {t("Поиск школы")}
          <input
            type="search"
            className="mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm text-foreground focus:border-[var(--beige)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {filtered.length ? (
        <ul className="divide-y divide-border border-y hairline">
          {filtered.map((school) => (
            <li
              key={school.id}
              className="flex min-w-0 flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
            >
              <div className="min-w-0">
                <h3 className="mb-2 break-words font-display text-lg font-medium text-foreground">
                  {school.name_kg}
                </h3>
                <SchoolMetadata record={school} />
              </div>
              <SchoolLifecycleActions
                key={`${school.id}-${school.revision}`}
                compact
                record={school}
                onOpen={() => onOpen(school.id)}
                onChanged={onLifecycleChange}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="border-y hairline py-8 text-sm text-muted-foreground">
          {t(schools.length ? "Школы не найдены." : "Школ пока нет. Создайте первую школу.")}
        </p>
      )}
    </section>
  );
}
