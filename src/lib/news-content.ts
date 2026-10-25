import DOMPurify from "dompurify";
import type { Lang } from "@/lib/i18n";
import type { NewsRecord } from "@/lib/news-data";

const ALLOWED_TAGS = ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "blockquote", "a", "br"];

export function sanitizeNewsHtml(html: string | null | undefined) {
  if (!html || typeof window === "undefined") return "";
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  });
}

export function localizedNewsField(
  news: NewsRecord,
  field: "title" | "excerpt" | "body",
  lang: Lang,
) {
  const localized = news[`${field}_${lang}` as keyof NewsRecord];
  const fallback = news[`${field}_kg` as keyof NewsRecord];
  return (typeof localized === "string" && localized.trim() ? localized : fallback) as
    | string
    | null;
}

const NEWS_MONTHS = {
  kg: [
    "январы",
    "февралы",
    "марты",
    "апрели",
    "майы",
    "июну",
    "июлу",
    "августу",
    "сентябры",
    "октябры",
    "ноябры",
    "декабры",
  ],
  ru: [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
} as const;

export function formatNewsDate(value: string | null, lang: Lang) {
  if (!value) return "";

  const date = new Date(value);
  const year = date.getFullYear();
  const day = date.getDate();
  const month = date.getMonth();

  if (lang === "kg") return `${year}-жылдын ${day}-${NEWS_MONTHS.kg[month]}`;
  if (lang === "ru") return `${day} ${NEWS_MONTHS.ru[month]} ${year} г.`;
  return `${NEWS_MONTHS.en[month]} ${day}, ${year}`;
}

const CYRILLIC: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  ң: "ng",
  о: "o",
  ө: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ү: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

export function createNewsSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .split("")
    .map((character) => CYRILLIC[character] ?? character)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

export const NEWS_COPY = {
  kg: {
    title: "Райондун жаңылыктары",
    description: "Кара-Кулжа районундагы акыркы жаңылыктар жана окуялар.",
    empty: "Азырынча жарыяланган жаңылык жок.",
    back: "Бардык жаңылыктар",
    read: "Толугу менен",
  },
  ru: {
    title: "Новости района",
    description: "Последние новости и события Кара-Кульджинского района.",
    empty: "Опубликованных новостей пока нет.",
    back: "Все новости",
    read: "Читать полностью",
  },
  en: {
    title: "District news",
    description: "Latest news and events from Kara-Kulja District.",
    empty: "There are no published news items yet.",
    back: "All news",
    read: "Read more",
  },
} as const;
