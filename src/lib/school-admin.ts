import { validInstitutionShortNames } from "./institution-names";
import { isSchoolType } from "./institution-types";
import { TERRITORIES } from "./territories-data";
import type { SchoolInfo, SchoolRecord } from "./schools-data";

export type SchoolIdentity = Pick<
  SchoolInfo,
  | "short_name_kg"
  | "short_name_ru"
  | "short_name_en"
  | "school_type"
  | "name_kg"
  | "territory_slug"
  | "village_slug"
  | "current_academic_year"
>;
export const emptySchoolIdentity: SchoolIdentity = {
  school_type: null,
  name_kg: "",
  territory_slug: "",
  village_slug: "",
  current_academic_year: "",
};
export function validSchoolIdentity(info: SchoolIdentity) {
  return (
    validInstitutionShortNames(info) &&
    !!info.name_kg.trim() &&
    isSchoolType(info.school_type) &&
    info.name_kg.length <= 300 &&
    (!info.current_academic_year || /^\d{4}-\d{4}$/.test(info.current_academic_year)) &&
    TERRITORIES.some(
      (territory) =>
        territory.slug === info.territory_slug &&
        territory.villages.some((village) => village.slug === info.village_slug),
    )
  );
}
export function schoolStatus(record: SchoolRecord) {
  return {
    draft: "Черновик",
    review: "Ожидает проверки",
    published: "Опубликовано",
    correction: "На исправлении",
    archived: "В архиве",
  }[schoolStatusKind(record)];
}

export type SchoolFilter = "all" | "draft" | "review" | "published" | "archived";
export function schoolStatusKind(record: SchoolRecord) {
  return record.is_archived
    ? "archived"
    : record.status === "draft" && record.review_note != null
      ? "correction"
      : record.status;
}
export function filterSchools(schools: SchoolRecord[], filter: SchoolFilter, query: string) {
  const name = query.trim().toLocaleLowerCase();
  return schools.filter((school) => {
    const matches =
      (filter === "all" && !school.is_archived) ||
      (filter === "archived"
        ? school.is_archived
        : !school.is_archived && school.status === filter);
    return matches && school.name_kg.toLocaleLowerCase().includes(name);
  });
}
