import villageImg from "@/assets/village.jpg";
import valleyImg from "@/assets/valley.jpg";
import waterfallImg from "@/assets/waterfall.jpg";
import horsemanImg from "@/assets/horseman.jpg";
import agricultureImg from "@/assets/agriculture.jpg";
import elderImg from "@/assets/elder.jpg";
import mountainsImg from "@/assets/hero-mountains.jpg";
import jailooImg from "@/assets/jailoo.jpg";
import mountainRoadImg from "@/assets/mountain-road.jpg";
import horseRouteImg from "@/assets/horse-route.jpg";
import winterVillageImg from "@/assets/winter-village.jpg";
import kymyzImg from "@/assets/kymyz.jpg";
import type { Lang } from "@/lib/i18n";
import {
  displayTerritoryName,
  displayVillageName as displayOfficialVillageName,
  OFFICIAL_VILLAGES,
  formatPopulation,
  getOfficialVillage,
  getTerritoryForVillage,
} from "@/lib/territories-data";

export type Localized<T> = Record<Lang, T>;

export type VillageInfo = { label: Localized<string>; value: Localized<string> };
export type VillagePerson = { name: Localized<string>; role: Localized<string>; img: string };
export type TourismItem = { title: Localized<string>; body: Localized<string>; image: string };
export type InvestmentItem = { title: Localized<string>; body: Localized<string> };

export type Village = {
  slug: string;
  name: string;
  nameRu?: string;
  nameEn?: string;
  population?: number | null;
  territorySlug?: string;
  order?: number;
  tagline: Localized<string>;
  hero: string;
  intro: Localized<string>;
  info: VillageInfo[];
  history: Localized<string>;
  tourism: { lead: Localized<string>; items: TourismItem[] };
  investment: { lead: Localized<string>; items: InvestmentItem[] };
  people: VillagePerson[];
  gallery: string[];
  mapNote: Localized<string>;
  related: string[];
};

const L = (kg: string, ru: string, en: string): Localized<string> => ({ kg, ru, en });

const SHARED_TOURISM: TourismItem[] = [
  {
    title: L("Ат туризми", "Конный туризм", "Horse tourism"),
    body: L(
      "Тоо жолдору менен атчан саякат — кылымдар бою сакталган ыргак.",
      "Конные путешествия по горным тропам — ритм, сохранённый веками.",
      "Horseback journeys along mountain trails — a rhythm preserved for centuries."
    ),
    image: horseRouteImg,
  },
  {
    title: L("Жайлоо жашоосу", "Жизнь на джайлоо", "Life on the jailoo"),
    body: L(
      "Боз үйдө түнөө, кымыз, тоо абасы — көчмөн маданиятка кириш.",
      "Ночь в юрте, кумыс, горный воздух — погружение в кочевую культуру.",
      "A night in a yurt, kumys, mountain air — an entry into nomadic culture."
    ),
    image: jailooImg,
  },
  {
    title: L("Тоо жолдору", "Горные дороги", "Mountain roads"),
    body: L(
      "Туман баскан өрөөндөр, кенен ашуулар, унутулгус көрүнүштөр.",
      "Долины в тумане, широкие перевалы, незабываемые виды.",
      "Misty valleys, wide passes, unforgettable views."
    ),
    image: mountainRoadImg,
  },
  {
    title: L("Треккинг", "Треккинг", "Trekking"),
    body: L(
      "Дарыя боюндагы жөө сапарлар, бийик жайлоолорго чыгуу.",
      "Пешие маршруты вдоль рек и подъёмы на высокие джайлоо.",
      "Walks along rivers and climbs to the highest pastures."
    ),
    image: waterfallImg,
  },
  {
    title: L("Кымыз", "Кумыс", "Kumys"),
    body: L(
      "Жаңы саалган бээ сүтүнүн даамы — жайдын белгиси.",
      "Вкус свежего кобыльего молока — знак лета.",
      "The taste of freshly milked mare's milk — a sign of summer."
    ),
    image: kymyzImg,
  },
  {
    title: L("Кышкы көрүнүштөр", "Зимние пейзажи", "Winter scenes"),
    body: L(
      "Карга оронгон айыл, түтүн чыккан мордор, тынч мезгил.",
      "Село под снегом, дымящиеся трубы, тихая пора.",
      "A village under snow, smoking chimneys, a quiet season."
    ),
    image: winterVillageImg,
  },
  {
    title: L("Сүрөткө тартуу", "Фотография", "Photography"),
    body: L(
      "Эртең мененки тумандар, алтын күз, кеч күндүн жарыгы.",
      "Утренние туманы, золотая осень, мягкий вечерний свет.",
      "Morning mists, golden autumn, the soft evening light."
    ),
    image: mountainsImg,
  },
];

const SHARED_INVESTMENT: InvestmentItem[] = [
  {
    title: L("Мал чарбачылык", "Животноводство", "Livestock"),
    body: L("Жайыттардын кенендиги, салттуу тажрыйба.", "Просторные пастбища и вековой опыт.", "Vast pastures and centuries of experience."),
  },
  {
    title: L("Бал өндүрүү", "Производство мёда", "Honey production"),
    body: L("Тоо чөптөрүнөн жыйналган таза бал.", "Чистый мёд, собранный с горных трав.", "Pure honey gathered from mountain herbs."),
  },
  {
    title: L("Экотуризм", "Экотуризм", "Ecotourism"),
    body: L("Табигый чөйрөнү сактоо менен жаңы багыт.", "Новое направление, бережное к природе.", "A new direction, gentle on nature."),
  },
  {
    title: L("Дыйканчылык", "Земледелие", "Agriculture"),
    body: L("Тоо суусу менен сугарылган түшүмдүү жерлер.", "Плодородные земли, орошаемые горной водой.", "Fertile lands watered by mountain streams."),
  },
  {
    title: L("Жайлоо туризми", "Туризм на джайлоо", "Jailoo tourism"),
    body: L("Боз үй лагерлери, маданий программа.", "Юрточные лагеря, культурная программа.", "Yurt camps and a cultural programme."),
  },
  {
    title: L("Тоо инфраструктурасы", "Горная инфраструктура", "Mountain infrastructure"),
    body: L("Жолдор, көпүрөлөр, конок үйлөр.", "Дороги, мосты, гостевые дома.", "Roads, bridges and guesthouses."),
  },
];

const INFO_POP = L("Калкы", "Население", "Population");
const INFO_ALT = L("Бийиктиги", "Высота", "Altitude");
const INFO_LOC = L("Жайгашуусу", "Расположение", "Location");
const INFO_DIST = L("Борборго чейин", "До центра", "Distance to centre");
const INFO_AO = L("Айыл өкмөтү", "Айыл окмоту", "Aiyl okmotu");

const DETAILED_VILLAGES: Village[] = [
  {
    slug: "kara-kulja",
    name: "Кара-Кулжа",
    nameRu: "Кара-Кульджа",
    nameEn: "Kara-Kulja",
    tagline: L("Райондун жүрөгү", "Сердце района", "Heart of the district"),
    hero: mountainsImg,
    intro: L(
      "Тоолордун арасында жайгашкан райондук борбор. Бул жерден күн чыгат, бул жерден жолдор тарайт.",
      "Районный центр среди гор. Отсюда восходит солнце, отсюда расходятся дороги.",
      "The district centre nestled among mountains. The sun rises here, and from here the roads spread out."
    ),
    info: [
      { label: INFO_POP, value: L("≈ 18 000", "≈ 18 000", "≈ 18,000") },
      { label: INFO_ALT, value: L("1 450 м", "1 450 м", "1,450 m") },
      { label: INFO_LOC, value: L("Кара-Кулжа өрөөнү", "Долина Кара-Кульджа", "Kara-Kulja valley") },
      { label: INFO_DIST, value: L("0 км", "0 км", "0 km") },
      { label: INFO_AO, value: L("Кара-Кулжа а/ө", "АО Кара-Кульджа", "Kara-Kulja AO") },
    ],
    history: L(
      "Кылымдар бою бул өрөөн көчмөн уруулардын жайлоосу болуп келген. Убакыттын өтүшү менен ал райондун жүрөгүнө айланды — соода жолдору кошулган, мечит-мектептери курулган, муундардан муундарга жашоо уланган жер.",
      "Веками эта долина была летним джайлоо кочевых племён. Со временем она стала сердцем района — здесь сходились торговые пути, строились мечети и школы, жизнь передавалась из поколения в поколение.",
      "For centuries this valley was the summer jailoo of nomadic tribes. In time it became the heart of the district — trade routes met here, mosques and schools were built, and life passed from one generation to the next."
    ),
    tourism: {
      lead: L(
        "Тоолор, дарыя, асман — Кара-Кулжанын табияты сапарга чакырат.",
        "Горы, реки, небо — природа Кара-Кульджи зовёт в путь.",
        "Mountains, rivers, sky — the nature of Kara-Kulja calls you on a journey."
      ),
      items: SHARED_TOURISM,
    },
    investment: {
      lead: L(
        "Райондун борбору катары — өнүгүүнүн жана өнөктөштүктүн негизги чекити.",
        "Как центр района — ключевая точка для развития и партнёрства.",
        "As the district centre, the key point for growth and partnership."
      ),
      items: SHARED_INVESTMENT,
    },
    people: [
      { name: L("Мугалим", "Учитель", "Teacher"), role: L("Орто мектеп", "Средняя школа", "Secondary school"), img: elderImg },
      { name: L("Чабан", "Чабан", "Shepherd"), role: L("Жайлоодо", "На джайлоо", "On the jailoo"), img: horsemanImg },
      { name: L("Дыйкан", "Земледелец", "Farmer"), role: L("Өрөөн боюнда", "У долины", "Along the valley"), img: agricultureImg },
    ],
    gallery: [villageImg, jailooImg, horsemanImg, mountainRoadImg, waterfallImg, winterVillageImg],
    mapNote: L("Кара-Кулжа району, Ош облусу", "Кара-Кульджинский район, Ошская область", "Kara-Kulja district, Osh Region"),
    related: ["zhiyde", "oy-tal"],
  },
  {
    slug: "zhiyde",
    name: "Жийде",
    nameRu: "Жийде",
    nameEn: "Jiide",
    tagline: L("Тоолордун арасындагы тынч айыл", "Тихое село среди гор", "A quiet village among the mountains"),
    hero: valleyImg,
    intro: L(
      "Тоолордун арасында жашынган, убакыт жайыраак өткөн айыл. Ар бир үй — бир окуя, ар бир жол — бир эс.",
      "Село, спрятанное среди гор, где время идёт медленнее. Каждый дом — история, каждая дорога — память.",
      "A village hidden among the mountains, where time runs slower. Every house is a story, every road a memory."
    ),
    info: [
      { label: INFO_POP, value: L("≈ 2 400", "≈ 2 400", "≈ 2,400") },
      { label: INFO_ALT, value: L("1 720 м", "1 720 м", "1,720 m") },
      { label: INFO_LOC, value: L("Тоо этегинде", "У подножия гор", "At the foot of the mountains") },
      { label: INFO_DIST, value: L("≈ 24 км", "≈ 24 км", "≈ 24 km") },
      { label: INFO_AO, value: L("Жийде а/ө", "АО Жийде", "Jiide AO") },
    ],
    history: L(
      "Жийде — аты дарактан, руху адамдарынан. Кылымдар бою үй-бүлөлөр бул жерде туруктуу жашап, өз салтын, өз тилин, өз нанын сактап келишкен.",
      "Жийде — имя от дерева, дух — от людей. Веками семьи жили здесь, сохраняя свои традиции, язык и хлеб.",
      "Jiide — its name from a tree, its spirit from its people. For centuries families have lived here, keeping their traditions, language and bread."
    ),
    tourism: {
      lead: L(
        "Тынч өрөөн, муздак булактар, кеңири жайыттар — табияттын жакындыгы.",
        "Тихая долина, прохладные родники, широкие пастбища — близость природы.",
        "A quiet valley, cool springs, wide pastures — nature close at hand."
      ),
      items: SHARED_TOURISM,
    },
    investment: {
      lead: L(
        "Кичинекей айыл — чоң мүмкүнчүлүктөр. Үй чарбасы менен экотуризм.",
        "Маленькое село — большие возможности. Семейное хозяйство и экотуризм.",
        "A small village with big potential. Family farming and ecotourism."
      ),
      items: SHARED_INVESTMENT,
    },
    people: [
      { name: L("Карыя", "Старейшина", "Elder"), role: L("Айылдын эси", "Память села", "Memory of the village"), img: elderImg },
      { name: L("Дыйкан", "Земледелец", "Farmer"), role: L("Жер иштеткен", "Работающий на земле", "Working the land"), img: agricultureImg },
      { name: L("Атчан", "Всадник", "Horseman"), role: L("Жайлоо жолунда", "На пути к джайлоо", "On the way to the jailoo"), img: horsemanImg },
    ],
    gallery: [valleyImg, mountainsImg, elderImg, mountainRoadImg, waterfallImg, jailooImg],
    mapNote: L("Жийде айылы, Кара-Кулжа району", "село Жийде, Кара-Кульджинский район", "Jiide village, Kara-Kulja district"),
    related: ["kara-kulja", "oy-tal"],
  },
  {
    slug: "oy-tal",
    name: "Ой-Тал",
    nameRu: "Ой-Тал",
    nameEn: "Oi-Tal",
    tagline: L("Жайлоолорго жол ачкан өрөөн", "Долина, ведущая к джайлоо", "The valley that opens to the jailoo"),
    hero: horseRouteImg,
    intro: L(
      "Кең өрөөн, бийик асман. Ой-Тал — жайлоого чыккан атчандардын, мал баккан үй-бүлөлөрдүн жери.",
      "Широкая долина, высокое небо. Ой-Тал — земля всадников, поднимающихся на джайлоо, и семей, что пасут скот.",
      "A wide valley, a high sky. Oi-Tal is the land of horsemen heading to the jailoo and of families who tend their herds."
    ),
    info: [
      { label: INFO_POP, value: L("≈ 5 600", "≈ 5 600", "≈ 5,600") },
      { label: INFO_ALT, value: L("1 880 м", "1 880 м", "1,880 m") },
      { label: INFO_LOC, value: L("Ой-Тал өрөөнү", "Долина Ой-Тал", "Oi-Tal valley") },
      { label: INFO_DIST, value: L("≈ 38 км", "≈ 38 км", "≈ 38 km") },
      { label: INFO_AO, value: L("Ой-Тал а/ө", "АО Ой-Тал", "Oi-Tal AO") },
    ],
    history: L(
      "Ой-Тал кылымдар бою көчмөн жашоонун уюткусу болуп келген. Бул жерден жайлоого жол ачылат, бул жерден кымыздын даамы башталат.",
      "Ой-Тал веками был основой кочевой жизни. Отсюда открывается путь к джайлоо, отсюда начинается вкус кумыса.",
      "For centuries Oi-Tal has been the core of nomadic life. From here the road to the jailoo opens; from here the taste of kumys begins."
    ),
    tourism: {
      lead: L(
        "Бийик жайлоолор, аттардын дүбүртү, кымыздын даамы — чыныгы көчмөн тажрыйба.",
        "Высокие джайлоо, топот копыт, вкус кумыса — подлинный кочевой опыт.",
        "High pastures, the drumming of hooves, the taste of kumys — a true nomadic experience."
      ),
      items: SHARED_TOURISM,
    },
    investment: {
      lead: L(
        "Жайлоо туризми жана мал чарбачылык үчүн стратегиялык өрөөн.",
        "Стратегическая долина для джайлоо-туризма и животноводства.",
        "A strategic valley for jailoo tourism and livestock."
      ),
      items: SHARED_INVESTMENT,
    },
    people: [
      { name: L("Чабан", "Чабан", "Shepherd"), role: L("Жайлоодо", "На джайлоо", "On the jailoo"), img: horsemanImg },
      { name: L("Эне", "Мать", "Mother"), role: L("Боз үйдө", "В юрте", "In the yurt"), img: elderImg },
      { name: L("Жаш спортчу", "Юный спортсмен", "Young athlete"), role: L("Көк бөрү", "Кок-бору", "Kok-boru"), img: agricultureImg },
    ],
    gallery: [horseRouteImg, jailooImg, valleyImg, kymyzImg, elderImg, mountainRoadImg],
    mapNote: L("Ой-Тал айыл аймагы, Кара-Кулжа району", "АА Ой-Тал, Кара-Кульджинский район", "Oi-Tal aiyl aimak, Kara-Kulja district"),
    related: ["kara-kulja", "zhiyde"],
  },
];

const withOfficialDetails = (village: Village): Village => {
  const official = getOfficialVillage(village.slug);
  if (!official) return village;

  return {
    ...village,
    nameRu: village.nameRu ?? official.nameRu,
    nameEn: village.nameEn ?? official.nameEn,
    population: official.population,
    territorySlug: official.territorySlug,
    order: official.order,
  };
};

const detailedSlugs = new Set(DETAILED_VILLAGES.map((village) => village.slug));

const GENERATED_VILLAGES: Village[] = OFFICIAL_VILLAGES.filter(
  (official) => !detailedSlugs.has(official.slug),
).map((official) => {
  const territory = getTerritoryForVillage(official.slug);
  const territoryName = territory?.name ?? official.territoryName;
  const territoryNameRu = territory ? displayTerritoryName(territory, "ru") : official.territoryNameRu;
  const territoryNameEn = territory ? displayTerritoryName(territory, "en") : official.territoryNameEn;
  const villageNameRu = displayOfficialVillageName(official, "ru");
  const villageNameEn = displayOfficialVillageName(official, "en");
  const populationText = formatPopulation(official.population);
  const hero = territory?.image ?? villageImg;

  return {
    slug: official.slug,
    name: official.name,
    nameRu: villageNameRu,
    nameEn: villageNameEn,
    population: official.population,
    territorySlug: official.territorySlug,
    order: official.order,
    tagline: L(
      `${territoryName} аймагындагы айыл`,
      `Село аймака ${territoryNameRu}`,
      `A village of ${territoryNameEn}`,
    ),
    hero,
    intro: L(
      `${official.name} - ${territoryName} аймагындагы айыл. Бул барак анын өзүнчө үнүн жана тоо ичиндеги ордун жай ачат.`,
      `${villageNameRu} - село аймака ${territoryNameRu}. Эта страница мягко открывает его отдельный голос и место среди гор.`,
      `${villageNameEn} is a village in ${territoryNameEn}, opened here through its own quiet place among the mountains.`,
    ),
    info: [
      { label: INFO_POP, value: L(populationText, populationText, populationText) },
      { label: INFO_AO, value: L(territoryName, territoryNameRu, territoryNameEn) },
    ],
    history: L(
      `${official.name} Кара-Кулжанын өрөөндөрү менен жолдорунун ичиндеги чакан, бирок өз алдынча эс. Айылдын күнүмдүк жашоосу тоо абасы, үй-бүлө эмгеги жана муундан муунга өткөн тынч тартип менен уланат.`,
      `${villageNameRu} - небольшая, но самостоятельная память внутри долин и дорог Кара-Кульджи. Повседневная жизнь села держится на горном воздухе, семейном труде и спокойном ритме поколений.`,
      `${villageNameEn} carries a small but distinct memory inside Kara-Kulja's valleys and roads. Its daily life continues through mountain air, family work and the quiet rhythm of generations.`,
    ),
    tourism: {
      lead: L(
        `${official.name} айылы аймакты жай таанууга чакырат: жол, суу, тоо этеги жана адамдардын меймандостугу.`,
        `${villageNameRu} приглашает узнавать территорию медленно: дорога, вода, предгорье и гостеприимство людей.`,
        `${villageNameEn} invites a slower reading of the territory: road, water, foothill and local hospitality.`,
      ),
      items: SHARED_TOURISM,
    },
    investment: {
      lead: L(
        `${official.name} үчүн мүмкүнчүлүктөр табигый масштабда ачылат: үй чарбасы, айыл чарба, конок тосуу жана жол боюндагы кызматтар.`,
        `Возможности для ${villageNameRu} раскрываются в естественном масштабе: хозяйство, аграрные инициативы, гостеприимство и дорожные сервисы.`,
        `Opportunities for ${villageNameEn} unfold at a natural scale: household production, agriculture, hospitality and road-side services.`,
      ),
      items: SHARED_INVESTMENT,
    },
    people: [
      { name: L("Устат", "Наставник", "Mentor"), role: L("Айылдын эс тутуму", "Память села", "Village memory"), img: elderImg },
      { name: L("Дыйкан", "Земледелец", "Farmer"), role: L("Жер менен иштеген", "Работающий на земле", "Working the land"), img: agricultureImg },
      { name: L("Жол башчы", "Проводник", "Guide"), role: L("Аймакты тааныткан", "Открывающий территорию", "Opening the territory"), img: horsemanImg },
    ],
    gallery: [hero, villageImg, valleyImg, waterfallImg, horsemanImg, elderImg],
    mapNote: L(
      `${official.name}, ${territoryName} аймагы`,
      `${villageNameRu}, аймак ${territoryNameRu}`,
      `${villageNameEn}, ${territoryNameEn}`,
    ),
    related: [],
  };
});

export const VILLAGES: Village[] = [
  ...DETAILED_VILLAGES.map(withOfficialDetails),
  ...GENERATED_VILLAGES,
];

export const getVillage = (slug: string) => VILLAGES.find((v) => v.slug === slug);

export const pick = <T,>(loc: Localized<T>, lang: Lang): T => loc[lang] ?? loc.kg;

export const displayVillageName = (village: Pick<Village, "name" | "nameRu" | "nameEn">, lang: Lang) =>
  lang === "en" && village.nameEn ? village.nameEn : lang === "ru" && village.nameRu ? village.nameRu : village.name;
