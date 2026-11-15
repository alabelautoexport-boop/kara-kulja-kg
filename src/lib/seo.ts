import {
  TERRITORIES,
  displayTerritoryName,
  displayVillageName,
  getOfficialVillage,
} from "./territories-data";
import { formatPublicText } from "./public-text";

export const SITE_ORIGIN = "https://kara-kulja.kg";

export function canonicalPath(path: string) {
  const pathname = path.split(/[?#]/, 1)[0];
  return pathname === "/" ? "/" : `${pathname.replace(/\/+$/, "")}/`;
}

export function canonicalUrl(path: string) {
  return SITE_ORIGIN + canonicalPath(path);
}

export function isPrivatePath(path: string) {
  return /^\/(?:admin|school-admin|news-admin)(?:\/|$)/.test(path);
}

export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${formatPublicText(title)} | Kara-Kulja` },
      { name: "description", content: formatPublicText(description) },
      { property: "og:title", content: `${formatPublicText(title)} | Kara-Kulja` },
      { property: "og:description", content: formatPublicText(description) },
    ],
  };
}

export function institutionDescription(
  info: { territory_slug: string; village_slug: string },
  name: string,
  lang: "kg" | "ru" | "en" = "kg",
) {
  const territory = TERRITORIES.find((t) => t.slug === info.territory_slug);
  const village = getOfficialVillage(info.village_slug);
  const location = [
    village && displayVillageName(village, lang),
    territory && displayTerritoryName(territory, lang),
  ]
    .filter(Boolean)
    .join(", ");
  return `${name}. ${location ? location + ". " : ""}${lang === "ru" ? "Кара-Кульджинский район." : lang === "en" ? "Kara-Kulja District." : "Кара-Кулжа району."}`;
}
