import type { Lang } from "./i18n";

export const SCHOOL_TYPES = [
  "general",
  "secondary",
  "basic",
  "primary",
  "boarding",
  "school",
] as const;
export type SchoolType = (typeof SCHOOL_TYPES)[number];
export const KINDERGARTEN_TYPES = ["kindergarten", "school_preschool"] as const;
export type KindergartenType = (typeof KINDERGARTEN_TYPES)[number];
export const SCHOOL_TYPE_LABELS: Record<SchoolType, Record<Lang, string>> = {
  general: {
    kg: "Жалпы билим берүү мектеби",
    ru: "Общеобразовательная школа",
    en: "General Education School",
  },
  secondary: { kg: "Орто мектеп", ru: "Средняя школа", en: "Secondary School" },
  basic: { kg: "Негизги мектеп", ru: "Основная школа", en: "Basic School" },
  primary: { kg: "Башталгыч мектеп", ru: "Начальная школа", en: "Primary School" },
  boarding: { kg: "Жатак-мектеп", ru: "Школа-интернат", en: "Boarding School" },
  school: { kg: "Мектеп", ru: "Школа", en: "School" },
};
export const SCHOOL_TYPE_FILTER_LABELS = {
  kg: ["Жалпы билим берүү", "Орто", "Негизги", "Башталгыч", "Жатак-мектеп", "Мектеп"],
  ru: ["Общеобразовательная", "Средняя", "Основная", "Начальная", "Школа-интернат", "Школа"],
  en: ["General education", "Secondary", "Basic", "Primary", "Boarding", "School"],
};
export const KINDERGARTEN_TYPE_LABELS: Record<KindergartenType, Record<Lang, string>> = {
  kindergarten: { kg: "Бала бакча", ru: "Детский сад", en: "Kindergarten" },
  school_preschool: {
    kg: "Мектеп алдындагы бала бакча",
    ru: "Дошкольное отделение при школе",
    en: "School Preschool Unit",
  },
};
export const isSchoolType = (value: unknown): value is SchoolType =>
  typeof value === "string" && SCHOOL_TYPES.includes(value as SchoolType);
export const isKindergartenType = (value: unknown): value is KindergartenType =>
  typeof value === "string" && KINDERGARTEN_TYPES.includes(value as KindergartenType);

// Internal provenance. Never spread this object into a public publication snapshot.
export type InstitutionSource = {
  source_file: string;
  source_sheet: string;
  source_row: number;
  excel_number: number;
  original_name: string;
  original_address: string;
  original_territory?: string;
  source_sha256?: string;
  original_source_sheet?: string;
  original_source_row?: number;
};

export const INSTITUTION_COPY = {
  kg: {
    title: "Бала бакчалар",
    subtitle: "Кара-Кулжа районундагы бала бакчалар жөнүндө маалымат.",
    schoolType: "Мектептин түрү",
    type: "Түрү",
    allTypes: "Баары",
    empty: "Жарыяланган бала бакчалар азырынча жок.",
    noMatches: "Бала бакчалар табылган жок.",
    unavailable: "Бала бакчаларды жүктөө мүмкүн болгон жок.",
    notFound: "Бала бакча табылган жок.",
  },
  ru: {
    title: "Детские сады",
    subtitle: "Информация о детских садах Кара-Кульджинского района.",
    schoolType: "Тип школы",
    type: "Тип",
    allTypes: "Все",
    empty: "Опубликованных детских садов пока нет.",
    noMatches: "Детские сады не найдены.",
    unavailable: "Не удалось загрузить детские сады.",
    notFound: "Детский сад не найден.",
  },
  en: {
    title: "Kindergartens",
    subtitle: "Information about kindergartens in Kara-Kulja District.",
    schoolType: "School type",
    type: "Type",
    allTypes: "All",
    empty: "No kindergartens have been published yet.",
    noMatches: "No kindergartens found.",
    unavailable: "Kindergartens could not be loaded.",
    notFound: "Kindergarten not found.",
  },
};

export type InstitutionFilterValues = {
  search: string;
  territory: string;
  village: string;
  type: string;
};
export const EMPTY_INSTITUTION_FILTERS: InstitutionFilterValues = {
  search: "",
  territory: "",
  village: "",
  type: "",
};
