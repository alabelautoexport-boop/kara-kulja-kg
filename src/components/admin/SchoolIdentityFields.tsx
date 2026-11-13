import { useAdminI18n } from "@/lib/admin-i18n";
import { TERRITORIES, displayTerritoryName, displayVillageName } from "@/lib/territories-data";
import type { SchoolIdentity } from "@/lib/school-admin";

export function SchoolIdentityFields({
  value,
  onChange,
}: {
  value: SchoolIdentity;
  onChange: (value: SchoolIdentity) => void;
}) {
  const { t, locale } = useAdminI18n();
  const input =
    "mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm text-foreground focus:border-[var(--beige)]";
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-xs text-muted-foreground">
        {t("Название школы KG")}
        <input
          required
          maxLength={300}
          className={input}
          value={value.name_kg}
          onChange={(e) => onChange({ ...value, name_kg: e.target.value })}
        />
      </label>
      <label className="min-w-0 text-xs text-muted-foreground">
        {t("Айыл аймак")}
        <select
          required
          className={input}
          value={value.territory_slug}
          onChange={(e) => onChange({ ...value, territory_slug: e.target.value, village_slug: "" })}
        >
          <option value="">{t("Не выбрано")}</option>
          {TERRITORIES.map((territory) => (
            <option key={territory.slug} value={territory.slug}>
              {displayTerritoryName(territory, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 text-xs text-muted-foreground">
        {t("Село")}
        <select
          required
          className={input}
          value={value.village_slug}
          onChange={(e) => onChange({ ...value, village_slug: e.target.value })}
        >
          <option value="">{t("Не выбрано")}</option>
          {TERRITORIES.find((territory) => territory.slug === value.territory_slug)?.villages.map(
            (village) => (
              <option key={village.slug} value={village.slug}>
                {displayVillageName(village, locale)}
              </option>
            ),
          )}
        </select>
      </label>
      <label className="min-w-0 text-xs text-muted-foreground">
        {t("Текущий учебный год")}
        <input
          required
          pattern="[0-9]{4}-[0-9]{4}"
          placeholder="2026-2027"
          className={input}
          value={value.current_academic_year}
          onChange={(e) => onChange({ ...value, current_academic_year: e.target.value })}
        />
      </label>
    </div>
  );
}
