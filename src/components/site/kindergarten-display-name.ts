import type { Lang } from "@/lib/i18n";
import type { KindergartenInfo } from "@/lib/kindergartens-data";
import { localizedSchoolField } from "@/lib/schools-data";

// Public presentation only. Stored names, snapshots and Admin values are unchanged.
// Full-name evidence for preschool units: approved schools in the same village:
// apyz-kalmatov (kalmatay), toktor-sydykov (por), zhumabay-abidinov (buyga).
// See src/lib/villages-data.ts (Kalmatay / Por) and the approved school catalog.
// Other initials remain initials. Each correction matches the reviewed source text,
// so later Admin edits are displayed directly instead of being overwritten here.
const displayCorrections: Record<
  string,
  Partial<Record<Lang, { source: string; value: string }>>
> = {
  "a-kalmatov-mektep-aldyndagy-bala-bakcha": {
    kg: {
      source: "А. Калматов мектеп алдындагы бала бакча",
      value: "Апыз Калматов мектеп алдындагы бала бакча",
    },
    ru: {
      source: "Дошкольное отделение при школе А. Калматов",
      value: "Дошкольное отделение при школе им. Апыза Калматова",
    },
    en: {
      source: "A. Kalmatov School Preschool Unit",
      value: "Apyz Kalmatov School Preschool Unit",
    },
  },
  "t-sydykov-mektep-aldyndagy-bala-bakcha": {
    kg: {
      source: "Т. Сыдыков мектеп алдындагы бала бакча",
      value: "Токтор Сыдыков мектеп алдындагы бала бакча",
    },
    ru: {
      source: "Дошкольное отделение при школе Т. Сыдыков",
      value: "Дошкольное отделение при школе им. Токтора Сыдыкова",
    },
    en: {
      source: "T. Sydykov School Preschool Unit",
      value: "Toktor Sydykov School Preschool Unit",
    },
  },
  "zh-abidinov-mektep-aldyndagy-bala-bakcha": {
    kg: {
      source: "Ж. Абидинов мектеп алдындагы бала бакча",
      value: "Жумабай Абидинов мектеп алдындагы бала бакча",
    },
    ru: {
      source: "Дошкольное отделение при школе Ж. Абидинов",
      value: "Дошкольное отделение при школе им. Жумабая Абидинова",
    },
    en: {
      source: "Zh. Abidinov School Preschool Unit",
      value: "Zhumabay Abidinov School Preschool Unit",
    },
  },
  "sh-bokoeva-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Ш. Бокоева",
      value: "Детский сад им. Ш. Бокоевой",
    },
  },
  "t-aydarov-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Т. Айдаров",
      value: "Детский сад им. Т. Айдарова",
    },
  },
  "a-karimov-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. А. Каримов",
      value: "Детский сад им. А. Каримова",
    },
  },
  "g-ibraimova-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Г. Ибраимова",
      value: "Детский сад им. Г. Ибраимовой",
    },
  },
  "s-kokoev-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. С. Көкөев",
      value: "Детский сад им. С. Көкөева",
    },
  },
  "r-berdibaev-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Р. Бердибаев",
      value: "Детский сад им. Р. Бердибаева",
    },
  },
  "sh-mametov-bala-bakchasy": {
    kg: {
      source: "Ш. Маметов бала бакчасы",
      value: "Ш. Маметов атындагы бала бакча",
    },
    ru: {
      source: "Детский сад Ш. Маметов",
      value: "Детский сад им. Ш. Маметова",
    },
  },
  "zh-zholdoshov-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Ж. Жолдошов",
      value: "Детский сад им. Ж. Жолдошова",
    },
  },
  "m-kalbaev-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. М. Калбаев",
      value: "Детский сад им. М. Калбаева",
    },
  },
  "b-matiev-atyndagy-bala-bakcha": {
    ru: {
      source: "Детский сад им. Б. Матиев",
      value: "Детский сад им. Б. Матиева",
    },
  },
  "zh-mamyr-mektep-aldyndagy-bala-bakcha": {
    kg: {
      source: "Ж Мамыр мектеп алдындагы бала бакча",
      value: "Ж. Мамыр мектеп алдындагы бала бакча",
    },
    ru: {
      source: "Дошкольное отделение при школе Ж Мамыр",
      value: "Дошкольное отделение при школе им. Ж. Мамыра",
    },
    en: {
      source: "Zh Mamyr School Preschool Unit",
      value: "Zh. Mamyr School Preschool Unit",
    },
  },
  "5-balapan-bala-bakchasy": {
    en: {
      source: "№5 «Balapan Kindergarten",
      value: "No. 5 “Balapan” Kindergarten",
    },
  },
};

export function kindergartenDisplayName(
  info: Pick<KindergartenInfo, "name_kg" | "name_ru" | "name_en">,
  slug: string,
  lang: Lang,
): string {
  const fullName = localizedSchoolField(info, "name", lang);
  const correction = displayCorrections[slug]?.[lang];
  return correction?.source === fullName ? correction.value : fullName;
}
