const DEFAULT_R2_PUBLIC_URL = "https://media.kara-kulja.kg";

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const getR2Url = (
  path: string,
  publicUrl = DEFAULT_R2_PUBLIC_URL,
) => `${trimSlashes(publicUrl)}/${trimSlashes(path)}`;

export const getPageHeroUrl = (pageSlug: string) =>
  getR2Url(`site/hero/pages/${pageSlug}.jpg`);

export const getTerritoryHeroUrl = (aimakSlug: string) =>
  getR2Url(`site/hero/territories/${aimakSlug}/hero.jpg`);

export const getVillageHeroUrl = (aimakSlug: string, villageSlug: string) =>
  getR2Url(
    `site/hero/territories/${aimakSlug}/villages/${villageSlug}/hero.jpg`,
  );
