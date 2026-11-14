import { useI18n } from "@/lib/i18n";
import { SCHOOL_COPY } from "@/lib/schools-copy";
import { INSTITUTION_COPY, type InstitutionFilterValues } from "@/lib/institution-types";
import { TERRITORIES, displayTerritoryName, displayVillageName } from "@/lib/territories-data";

export function InstitutionFilters({
  values,
  onChange,
  locations,
  types = [],
  school = false,
}: {
  values: InstitutionFilterValues;
  onChange: (values: InstitutionFilterValues) => void;
  locations: { territory_slug: string; village_slug: string }[];
  types?: { value: string; label: string }[];
  school?: boolean;
}) {
  const { lang } = useI18n(),
    c = SCHOOL_COPY[lang],
    copy = INSTITUTION_COPY[lang];
  const input =
    "mt-1.5 h-11 w-full min-w-0 border hairline bg-background px-3 text-sm text-foreground";
  return (
    <div
      className={`mb-6 grid grid-cols-2 items-end gap-3 ${types.length ? "md:grid-cols-4" : "md:grid-cols-3"}`}
    >
      <label className="col-span-2 min-w-0 text-xs text-muted-foreground md:col-span-1">
        {c.search}
        <input
          type="search"
          value={values.search}
          onChange={(e) => onChange({ ...values, search: e.target.value })}
          className={input}
        />
      </label>
      <label className="min-w-0 text-xs text-muted-foreground">
        {c.filterTerritory}
        <select
          className={input}
          value={values.territory}
          onChange={(e) => onChange({ ...values, territory: e.target.value, village: "" })}
        >
          <option value="">{c.allTerritories}</option>
          {TERRITORIES.filter((t) => locations.some((s) => s.territory_slug === t.slug)).map(
            (t) => (
              <option key={t.slug} value={t.slug}>
                {displayTerritoryName(t, lang)}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="min-w-0 text-xs text-muted-foreground">
        {c.village}
        <select
          className={input}
          value={values.village}
          onChange={(e) => onChange({ ...values, village: e.target.value })}
        >
          <option value="">{c.allVillages}</option>
          {TERRITORIES.filter((t) => !values.territory || t.slug === values.territory)
            .flatMap((t) => t.villages)
            .filter((v) => locations.some((s) => s.village_slug === v.slug))
            .map((v) => (
              <option key={v.slug} value={v.slug}>
                {displayVillageName(v, lang)}
              </option>
            ))}
        </select>
      </label>
      {types.length > 0 && (
        <label className="col-span-2 min-w-0 text-xs text-muted-foreground md:col-span-1">
          {school ? copy.schoolType : copy.type}
          <select
            className={input}
            value={values.type}
            onChange={(e) => onChange({ ...values, type: e.target.value })}
          >
            <option value="">{copy.allTypes}</option>
            {types.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
