import type { PublicSchoolDocument, SchoolPublication, SchoolYearStats } from "./schools-data";

// A period belongs to one existing school, never to a duplicate school/catalog entry.
// This public view groups only real published annual records. Legacy current-year
// identity/contact/media fields are not backfilled into invented historical periods.
export type PublishedSchoolAcademicYear = {
  school_id: string;
  academic_year: string;
  stats?: SchoolYearStats;
  ort: PublicSchoolDocument["ort"];
};

export function getPublishedSchoolAcademicYears(
  school: Pick<SchoolPublication, "school_id" | "document">,
): PublishedSchoolAcademicYear[] {
  const years = new Map<string, PublishedSchoolAcademicYear>();
  const getYear = (academicYear: string) => {
    if (!/^\d{4}-\d{4}$/.test(academicYear)) return undefined;
    let period = years.get(academicYear);
    if (!period) {
      period = { school_id: school.school_id, academic_year: academicYear, ort: [] };
      years.set(academicYear, period);
    }
    return period;
  };
  for (const stats of school.document.stats) {
    if (
      ![stats.total_students, stats.total_teachers, stats.grade11_graduates].some(
        (value) => value != null,
      )
    )
      continue;
    const period = getYear(stats.academic_year);
    if (period) period.stats = stats;
  }
  for (const record of school.document.ort) {
    if (!record.summary.participants) continue;
    const period = getYear(record.academic_year);
    // Explicit public projection: never propagate a raw score array, even if a
    // malformed response happens to contain one alongside its public summary.
    period?.ort.push({
      year: record.year,
      academic_year: record.academic_year,
      summary: record.summary,
    });
  }
  return [...years.values()]
    .sort((a, b) => b.academic_year.localeCompare(a.academic_year))
    .map((period) => ({ ...period, ort: [...period.ort].sort((a, b) => b.year - a.year) }));
}
