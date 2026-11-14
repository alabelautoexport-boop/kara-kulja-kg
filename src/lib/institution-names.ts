import type { Lang } from "./i18n";

export type InstitutionShortNames = {
  short_name_kg?: string;
  short_name_ru?: string;
  short_name_en?: string;
};

export function validInstitutionShortNames(info: InstitutionShortNames) {
  return [info.short_name_kg, info.short_name_ru, info.short_name_en].every(
    (value) => value === undefined || (typeof value === "string" && value.length <= 120),
  );
}

// Display names are stored and edited independently. Never infer them at render time.
export function catalogInstitutionName(info: object, lang: Lang): string {
  const record = info as Record<string, unknown>;
  const short = record[`short_name_${lang}`] || record.short_name_kg;
  return String(short || record[`name_${lang}`] || record.name_kg || "");
}
