import { TERRITORIES } from "./territories-data";
import type { InstitutionSource } from "./institution-types";

// Approved import aliases. These change relationships, never Excel display text.
const territoryAliases: Record<string, string> = {
  "Сары-Булак": "ryspai-abdykadyrov",
  "Р. Абдыкадыров": "ryspai-abdykadyrov",
};
const villageAliases: Record<string, string> = {
  "1-Май": "birinchi-may",
  Биймырза: "biy-myrza",
  "Жетим-Дөөбө": "zhetim-dobo",
  "Кайын-Талаа": "kaiyn-talaa",
  "Күйөө-Таш": "kuyotash",
  "Сары-Күнгөй": "sary-kungoy",
  "Сары-Таш": "sary-tash",
};
const normalized = (s: string) =>
  s
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[\s-]+/g, "");
export function resolveInstitutionLocation(territoryValue: string, villageValue: string) {
  const territory = TERRITORIES.find(
    (t) =>
      t.slug === territoryAliases[territoryValue] ||
      normalized(t.name) === normalized(territoryValue),
  );
  const village = territory?.villages.find(
    (v) =>
      v.slug === villageAliases[villageValue] || normalized(v.name) === normalized(villageValue),
  );
  if (!territory || !village) throw new Error("Institution location requires an explicit mapping");
  return { territory_slug: territory.slug, village_slug: village.slug };
}

export function prepareInstitutionLocation(
  territoryValue: string,
  villageValue: string,
  source: InstitutionSource,
) {
  return {
    ...resolveInstitutionLocation(territoryValue, villageValue),
    source_metadata: { ...source, original_territory: territoryValue },
  };
}
