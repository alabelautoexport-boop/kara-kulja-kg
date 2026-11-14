import { parseOrtScores } from "./school-ort";
import type { SchoolDraft } from "./schools-data";

const academicYear = /^\d{4}-\d{4}$/;
const hasText = (value: unknown) => typeof value === "string" && value.trim() !== "";
export type SchoolValidationIssue = {
  section: string;
  row?: number;
  message: string;
  values?: string;
};
export type ActiveSchoolDraft = Pick<SchoolDraft, "info" | "ort"> & {
  media?: { cover: string | null; gallery: string[] };
};

export function prepareActiveSchoolDraft(
  draft: SchoolDraft,
  scoreTexts: string[],
  ortTouched: boolean[],
) {
  const prepared = prepareSchoolDraft(
    { ...draft, stats: [], achievements: [], resources: [] },
    scoreTexts,
    ortTouched,
  );
  return {
    issues: prepared.issues,
    payload: {
      info: prepared.payload.info,
      ort: prepared.payload.ort,
      ...(draft.media
        ? {
            media: {
              cover: draft.media.cover?.asset_id ?? null,
              gallery: draft.media.gallery.map((image) => image.asset_id),
            },
          }
        : {}),
    },
  };
}

// Empty optional rows are discarded only before validation, never partial rows.
export function prepareSchoolDraft(
  draft: SchoolDraft,
  scoreTexts: string[],
  ortTouched: boolean[],
) {
  const issues: SchoolValidationIssue[] = [];
  const add = (section: string, message: string, row?: number, values?: string) =>
    issues.push({ section, message, row, values });
  if (!draft.info.name_kg.trim()) add("Общая информация", "Укажите название школы KG.");
  if (draft.info.slug !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(draft.info.slug))
    add("Общая информация", "Проверьте slug.");
  if (draft.info.current_academic_year && !academicYear.test(draft.info.current_academic_year))
    add("Общая информация", "Укажите учебный год в формате YYYY-YYYY.");
  const stats = draft.stats.filter(
    (row) =>
      hasText(row.academic_year) ||
      [row.total_students, row.total_teachers, row.grade11_graduates].some((v) => v !== null),
  );
  stats.forEach((row, i) => {
    if (!academicYear.test(row.academic_year))
      add("Основные показатели", "Укажите учебный год в формате YYYY-YYYY.", i + 1);
    if (
      [row.total_students, row.total_teachers, row.grade11_graduates].some(
        (v) => v !== null && (!Number.isInteger(v) || v < 0),
      )
    )
      add("Основные показатели", "Укажите целое неотрицательное число.", i + 1);
  });
  const ort = draft.ort.flatMap((row, i) => {
    const text = scoreTexts[i] ?? "";
    if (!ortTouched[i] && !text.trim()) return [];
    if (!Number.isInteger(row.year) || row.year < 2000 || row.year > 2200)
      add("Результаты ОРТ", "Проверьте год ОРТ.", i + 1);
    if (!academicYear.test(row.academic_year))
      add("Результаты ОРТ", "Укажите учебный год в формате YYYY-YYYY.", i + 1);
    const parsed = parseOrtScores(text);
    if (parsed.invalid.length)
      add(
        "Результаты ОРТ",
        "Проверьте следующие значения:",
        i + 1,
        parsed.invalid
          .slice(0, 20)
          .map((v) => v || "∅")
          .join(", "),
      );
    return [{ ...row, scores: parsed.scores }];
  });
  const achievements = draft.achievements.filter((row) => Object.values(row).some(hasText));
  achievements.forEach((row, i) => {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      !Number.isFinite(Date.parse(row.date)) ||
      !row.title_kg.trim() ||
      !row.description_kg.trim()
    )
      add("Достижения", "Укажите дату, заголовок KG и описание KG.", i + 1);
  });
  const resources = draft.resources.filter((row) =>
    Object.entries(row).some(([key, value]) =>
      key === "type" ? value !== "material" : key === "year" ? value !== null : hasText(value),
    ),
  );
  resources.forEach((row, i) => {
    if (!row.title_kg.trim()) add("Подготовка к ОРТ", "Укажите заголовок KG.", i + 1);
    if (row.url && !/^https?:\/\/\S+$/.test(row.url))
      add("Подготовка к ОРТ", "Укажите ссылку http:// или https://.", i + 1);
    if (row.year !== null && (!Number.isInteger(row.year) || row.year < 2000 || row.year > 2200))
      add("Подготовка к ОРТ", "Проверьте год ресурса.", i + 1);
  });
  for (const [rows, key, section] of [
    [stats, "academic_year", "Основные показатели"],
    [ort, "year", "Результаты ОРТ"],
  ] as const) {
    const values = rows.map((row) => String((row as unknown as Record<string, unknown>)[key]));
    if (new Set(values).size !== values.length) add(section, "Удалите повторяющиеся годы.");
  }
  return { payload: { ...draft, stats, ort, achievements, resources }, issues };
}
