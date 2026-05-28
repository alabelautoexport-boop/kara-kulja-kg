import type { Lang } from "@/lib/i18n";

const karaKuljaImg = "/images/nature/aerial-image-of-snow-covered-mountains-under-bright-sky.jpg";
const alaikuuImg = "/images/nature/jagged-mountain-peaks-above-lush-forest-below.jpg";
const karaGuzImg = "/images/nature/autumn-trees-hillside.jpg";
const karaKochkorImg = "/images/nature/snow-tips-in-clouds.jpg";
const oyTalImg = "/images/nature/person-silhouetted-on-a-horse-in-a-open-field.jpg";
const ryspaiAbdykadyrovImg = "/images/nature/freshwater-mountain-creek.jpg";
const ylaiTalaaImg = "/images/nature/nature-mountains-flower-landscape-adventure.jpg";

export type Localized<T> = Record<Lang, T>;

export type TerritoryVillage = {
  name: string;
  nameRu: string;
  nameEn: string;
  slug: string;
  population: number;
  order: number;
};

export type Territory = {
  slug: string;
  name: string;
  nameRu: string;
  nameEn: string;
  subtitle: Localized<string>;
  description: Localized<string>;
  population: number;
  image: string;
  villages: TerritoryVillage[];
};

const L = (kg: string, ru: string, en: string): Localized<string> => ({ kg, ru, en });

const territoryCopy = (name: string, nameEn: string, tone: string): Localized<string> =>
  L(
    `${name} - ${tone}. Айылдар өрөөндүн ыргагы менен жай ачылат.`,
    `${name} - ${tone}. Сёла раскрываются в ритме долины.`,
    `${nameEn} - villages unfold at the pace of the valley.`,
  );

export const TERRITORIES: Territory[] = [
  {
    slug: "kara-kulja",
    name: "Кара-Кулжа",
    nameRu: "Кара-Кульджа",
    nameEn: "Kara-Kulja",
    subtitle: L("Райондун жүрөгү жана жолдор түйүнү", "Сердце района и узел дорог", "The district heart and meeting of roads"),
    description: territoryCopy("Кара-Кулжа", "Kara-Kulja", "борбордук дем менен тоо тынчтыгы кошулган аймак"),
    population: 26077,
    image: karaKuljaImg,
    villages: [
      { name: "Кара-Кулжа", nameRu: "Кара-Кульджа", nameEn: "Kara-Kulja", slug: "kara-kulja", population: 13917, order: 1 },
      { name: "Бий-Мырза", nameRu: "Бий-Мырза", nameEn: "Biy-Myrza", slug: "biy-myrza", population: 4741, order: 2 },
      { name: "Биринчи Май", nameRu: "Биринчи Май", nameEn: "Birinchi May", slug: "birinchi-may", population: 6401, order: 3 },
      { name: "Сары-Камыш", nameRu: "Сары-Камыш", nameEn: "Sary-Kamysh", slug: "sary-kamysh", population: 1018, order: 4 },
    ],
  },
  {
    slug: "alaikuu",
    name: "Алайкуу",
    nameRu: "Алайкуу",
    nameEn: "Alaikuu",
    subtitle: L("Бийик өрөөндөр жана алыскы жайлоолор", "Высокие долины и дальние джайлоо", "High valleys and distant jailoos"),
    description: territoryCopy("Алайкуу", "Alaikuu", "бийик жолдордун жана тоо шамалынын аймагы"),
    population: 12073,
    image: alaikuuImg,
    villages: [
      { name: "Кызыл-Жар", nameRu: "Кызыл-Жар", nameEn: "Kyzyl-Jar", slug: "kyzyl-zhar", population: 682, order: 1 },
      { name: "Кайын-Талаа", nameRu: "Кайын-Талаа", nameEn: "Kaiyn-Talaa", slug: "kaiyn-talaa", population: 1228, order: 2 },
      { name: "Коо-Чаты", nameRu: "Коо-Чаты", nameEn: "Koo-Chaty", slug: "koo-chaty", population: 2117, order: 3 },
      { name: "Терек", nameRu: "Терек", nameEn: "Terek", slug: "terek", population: 1207, order: 4 },
      { name: "Чычырканак", nameRu: "Чычырканак", nameEn: "Chychyrkanak", slug: "chychyrkanak", population: 302, order: 5 },
      { name: "Күйөө-Таш", nameRu: "Күйөө-Таш", nameEn: "Kuyoo-Tash", slug: "kuyotash", population: 1030, order: 6 },
      { name: "Көк-Арт", nameRu: "Көк-Арт", nameEn: "Kok-Art", slug: "kok-art", population: 2487, order: 7 },
      { name: "Кан-Коргон", nameRu: "Кан-Коргон", nameEn: "Kan-Korgon", slug: "kan-korgon", population: 2080, order: 8 },
      { name: "Сайталаа", nameRu: "Сайталаа", nameEn: "Saitalaa", slug: "sai-talaa", population: 401, order: 9 },
      { name: "Ара-Булак", nameRu: "Ара-Булак", nameEn: "Ara-Bulak", slug: "ara-bulak", population: 125, order: 10 },
      { name: "Бөрү-Токой", nameRu: "Бөрү-Токой", nameEn: "Boru-Tokoy", slug: "boru-tokoy", population: 177, order: 11 },
      { name: "Желе-Дөбө", nameRu: "Желе-Дөбө", nameEn: "Jele-Dobo", slug: "zhele-dobo", population: 237, order: 12 },
    ],
  },
  {
    slug: "kara-guz",
    name: "Кара Гуз",
    nameRu: "Кара Гуз",
    nameEn: "Kara-Guz",
    subtitle: L("Дыйкан жерлер жана жылуу өрөөн", "Земледельческие земли и тёплая долина", "Farmland and a warm valley"),
    description: territoryCopy("Кара Гуз", "Kara-Guz", "айдоо талаалары менен эл эмгегинин аймагы"),
    population: 10306,
    image: karaGuzImg,
    villages: [
      { name: "Жаңы-Талаа", nameRu: "Жаңы-Талаа", nameEn: "Jany-Talaa", slug: "zhany-talaa", population: 1192, order: 1 },
      { name: "Алтын-Күрөк", nameRu: "Алтын-Күрөк", nameEn: "Altyn-Kurok", slug: "altyn-kurok", population: 440, order: 2 },
      { name: "Жетим-Дөбө", nameRu: "Жетим-Дөбө", nameEn: "Jetim-Dobo", slug: "zhetim-dobo", population: 1270, order: 3 },
      { name: "Калматай", nameRu: "Калматай", nameEn: "Kalmatay", slug: "kalmatay", population: 1063, order: 4 },
      { name: "Кара-Жыгач", nameRu: "Кара-Жыгач", nameEn: "Kara-Jygach", slug: "kara-zhygach", population: 1199, order: 5 },
      { name: "Насирдин", nameRu: "Насирдин", nameEn: "Nasirdin", slug: "nasirdin", population: 417, order: 6 },
      { name: "Кеңеш", nameRu: "Кеңеш", nameEn: "Kenesh", slug: "kenesh", population: 2930, order: 7 },
      { name: "Пор", nameRu: "Пор", nameEn: "Por", slug: "por", population: 1795, order: 8 },
    ],
  },
  {
    slug: "kara-kochkor",
    name: "Кара-Кочкор",
    nameRu: "Кара-Кочкор",
    nameEn: "Kara-Kochkor",
    subtitle: L("Тоолуу аймактын кең деми", "Широкое дыхание горного аймака", "The wide breath of a mountain territory"),
    description: territoryCopy("Кара-Кочкор", "Kara-Kochkor", "жолдор тоого бурулган аймак"),
    population: 18490,
    image: karaKochkorImg,
    villages: [
      { name: "Кара-Кочкор", nameRu: "Кара-Кочкор", nameEn: "Kara-Kochkor", slug: "kara-kochkor", population: 4386, order: 1 },
      { name: "Ак-Кыя", nameRu: "Ак-Кыя", nameEn: "Ak-Kyya", slug: "ak-kyya", population: 2952, order: 2 },
      { name: "Кашка-Жол", nameRu: "Кашка-Жол", nameEn: "Kashka-Jol", slug: "kashka-zhol-kara-kochkor", population: 1981, order: 3 },
      { name: "Сары-Булак", nameRu: "Сары-Булак", nameEn: "Sary-Bulak", slug: "sary-bulak-kara-kochkor", population: 1981, order: 4 },
      { name: "Жаңы-Талап", nameRu: "Жаңы-Талап", nameEn: "Jany-Talap", slug: "zhany-talap", population: 1873, order: 5 },
      { name: "Жийде", nameRu: "Жийде", nameEn: "Jiide", slug: "zhiyde", population: 1244, order: 6 },
      { name: "Октябрь", nameRu: "Октябрь", nameEn: "Oktyabr", slug: "oktyabr", population: 2746, order: 7 },
      { name: "Тоготой", nameRu: "Тоготой", nameEn: "Togotoy", slug: "togotoy", population: 2551, order: 8 },
      { name: "Ынтымак", nameRu: "Ынтымак", nameEn: "Yntymak", slug: "yntymak", population: 757, order: 9 },
    ],
  },
  {
    slug: "oy-tal",
    name: "Ой-Тал",
    nameRu: "Ой-Тал",
    nameEn: "Oi-Tal",
    subtitle: L("Капчыгайлардан жайлоого ачылган өрөөн", "Долина от ущелий к джайлоо", "A valley opening from gorges toward the jailoo"),
    description: territoryCopy("Ой-Тал", "Oi-Tal", "аттын дүбүртү менен жайлоого чыккан аймак"),
    population: 6134,
    image: oyTalImg,
    villages: [
      { name: "Сары-Бээ", nameRu: "Сары-Бээ", nameEn: "Sary-Bee", slug: "sary-bee", population: 1143, order: 1 },
      { name: "Кара-Таш", nameRu: "Кара-Таш", nameEn: "Kara-Tash", slug: "kara-tash", population: 901, order: 2 },
      { name: "Терек-Суу", nameRu: "Терек-Суу", nameEn: "Terek-Suu", slug: "terek-suu", population: 502, order: 3 },
      { name: "Ничке-Суу", nameRu: "Ничке-Суу", nameEn: "Nichke-Suu", slug: "nichke-suu", population: 303, order: 4 },
      { name: "Ой-Тал", nameRu: "Ой-Тал", nameEn: "Oi-Tal", slug: "oy-tal", population: 2077, order: 5 },
      { name: "Көңдүк", nameRu: "Көңдүк", nameEn: "Konduk", slug: "konduk", population: 1208, order: 6 },
    ],
  },
  {
    slug: "ryspai-abdykadyrov",
    name: "Рыспай Абдыкадыров",
    nameRu: "Рыспай Абдыкадыров",
    nameEn: "Ryspai Abdykadyrov",
    subtitle: L("Булактар жана жашыл ойдуңдар", "Родники и зелёные низины", "Springs and green hollows"),
    description: territoryCopy("Рыспай Абдыкадыров", "Ryspai Abdykadyrov", "суунун үнү айылдарды бириктирген аймак"),
    population: 4968,
    image: ryspaiAbdykadyrovImg,
    villages: [
      { name: "Сары-Булак", nameRu: "Сары-Булак", nameEn: "Sary-Bulak", slug: "sary-bulak", population: 676, order: 1 },
      { name: "Кара-Булак", nameRu: "Кара-Булак", nameEn: "Kara-Bulak", slug: "kara-bulak", population: 696, order: 2 },
      { name: "Конокбай-Талаа", nameRu: "Конокбай-Талаа", nameEn: "Konokbay-Talaa", slug: "konokbay-talaa", population: 714, order: 3 },
      { name: "Кызыл-Булак", nameRu: "Кызыл-Булак", nameEn: "Kyzyl-Bulak", slug: "kyzyl-bulak", population: 398, order: 4 },
      { name: "Сары-Күңгөй", nameRu: "Сары-Күңгөй", nameEn: "Sary-Kungoy", slug: "sary-kungoy", population: 950, order: 5 },
      { name: "Тегерек-Саз", nameRu: "Тегерек-Саз", nameEn: "Tegerek-Saz", slug: "tegerek-saz", population: 780, order: 6 },
      { name: "Тогуз-Булак", nameRu: "Тогуз-Булак", nameEn: "Toguz-Bulak", slug: "toguz-bulak", population: 754, order: 7 },
    ],
  },
  {
    slug: "ylai-talaa",
    name: "Ылай-Талаа",
    nameRu: "Ылай-Талаа",
    nameEn: "Ylai-Talaa",
    subtitle: L("Кең талаалар жана узак горизонт", "Широкие поля и дальний горизонт", "Open fields and a long horizon"),
    description: territoryCopy("Ылай-Талаа", "Ylai-Talaa", "талаа, суу жана тоо көрүнгөн аймак"),
    population: 17501,
    image: ylaiTalaaImg,
    villages: [
      { name: "Токбай-Талаа", nameRu: "Токбай-Талаа", nameEn: "Tokbay-Talaa", slug: "tokbay-talaa", population: 4647, order: 1 },
      { name: "Буйга", nameRu: "Буйга", nameEn: "Buyga", slug: "buyga", population: 1144, order: 2 },
      { name: "Беш-Кемпир", nameRu: "Беш-Кемпир", nameEn: "Besh-Kempir", slug: "besh-kempir", population: 680, order: 3 },
      { name: "Орто-Талаа", nameRu: "Орто-Талаа", nameEn: "Orto-Talaa", slug: "orto-talaa", population: 207, order: 4 },
      { name: "Ылай-Талаа", nameRu: "Ылай-Талаа", nameEn: "Ylai-Talaa", slug: "ylai-talaa", population: 7130, order: 5 },
      { name: "Сай", nameRu: "Сай", nameEn: "Sai", slug: "sai", population: 2417, order: 6 },
      { name: "Шаркыратма", nameRu: "Шаркыратма", nameEn: "Sharkyratma", slug: "sharkyratma", population: 527, order: 7 },
      { name: "Жылкол", nameRu: "Жылкол", nameEn: "Jylkol", slug: "zhylkol", population: 512, order: 8 },
      { name: "Сарыташ", nameRu: "Сарыташ", nameEn: "Sarytash", slug: "sary-tash", population: 237, order: 9 },
    ],
  },
];

export const OFFICIAL_VILLAGES = TERRITORIES.flatMap((territory) =>
  territory.villages.map((village) => ({
    ...village,
    territorySlug: territory.slug,
    territoryName: territory.name,
    territoryNameRu: territory.nameRu,
    territoryNameEn: territory.nameEn,
  })),
);

export const formatPopulation = (value: number | null) =>
  value == null ? "—" : new Intl.NumberFormat("ru-RU").format(value);

export const pick = <T,>(loc: Localized<T>, lang: Lang): T => loc[lang] ?? loc.kg;

export const displayTerritoryName = (territory: Pick<Territory, "name" | "nameRu" | "nameEn">, lang: Lang) =>
  lang === "en" ? territory.nameEn : lang === "ru" ? territory.nameRu : territory.name;

export const displayVillageName = (village: Pick<TerritoryVillage, "name" | "nameRu" | "nameEn">, lang: Lang) =>
  lang === "en" ? village.nameEn : lang === "ru" ? village.nameRu : village.name;

export const getTerritory = (slug: string) => TERRITORIES.find((territory) => territory.slug === slug);

export const getOfficialVillage = (slug: string) => OFFICIAL_VILLAGES.find((village) => village.slug === slug);

export const getTerritoryForVillage = (slug: string) => {
  const officialVillage = getOfficialVillage(slug);
  return officialVillage ? getTerritory(officialVillage.territorySlug) : undefined;
};

export const getNeighborVillageSlugs = (slug: string) => {
  const territory = getTerritoryForVillage(slug);
  if (!territory) return [];

  const index = territory.villages.findIndex((village) => village.slug === slug);
  if (index < 0) return [];

  if (index === 0) return territory.villages.slice(1, 3).map((village) => village.slug);
  if (index === territory.villages.length - 1) {
    return territory.villages.slice(Math.max(0, index - 2), index).map((village) => village.slug);
  }

  return [territory.villages[index - 1].slug, territory.villages[index + 1].slug];
};
