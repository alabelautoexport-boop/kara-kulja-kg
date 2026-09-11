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
  showInfo?: boolean;
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
const INFO_HOUSEHOLDS = L("Кожолук", "Хозяйства", "Households");
const INFO_VILLAGE_COORDINATES = L("Айыл борборунун координаты", "Координаты центра села", "Village centre coordinates");
const INFO_LOC = L("Жайгашуусу", "Расположение", "Location");
const INFO_DIST = L("Борборго чейин", "До центра", "Distance to centre");
const INFO_AO = L("Айыл өкмөтү", "Айыл окмоту", "Aiyl okmotu");
const INFO_AIMAK = L("Айыл аймагы", "Айылный аймак", "Aiyl aimak");
const INFO_FORMER_NAME = L("Мурунку аталышы", "Прежнее название", "Former name");
const INFO_ECONOMY = L("Негизги чарба багыттары", "Основные направления хозяйства", "Main livelihoods");
const INFO_RIVER_LOCATION = L("Жайгашуусу", "Расположение", "Location");
const INFO_FROM_KARA_KULJA = L("Кара-Кулжа айылынан", "От села Кара-Кульджа", "From Kara-Kulja village");
const INFO_ABOVE_SEA = L("Деңиз деңгээлинен", "Высота над уровнем моря", "Elevation above sea level");
const INFO_SCHOOL = L("Мектеп", "Школа", "School");
const INFO_SCHOOL_OPENED = L("Мектеп пайдаланууга берилген", "Школа введена в эксплуатацию", "School opened");
const INFO_STUDENTS = L("Мектептеги окуучулар", "Ученики школы", "School students");
const INFO_MEDICAL = L("Медициналык пункт", "Медицинский пункт", "Medical point");
const INFO_PRESCHOOL = L("Мектепке чейинки мекеме", "Дошкольное учреждение", "Preschool");
const INFO_FORMER_ADMIN = L("Мурдагы административдик караштуулугу", "Прежняя административная принадлежность", "Former administrative affiliation");

type LegacyVillageSections = Pick<
  Village,
  "hero" | "tourism" | "investment" | "people" | "gallery"
>;

const createLegacyVillageSections = (
  slug: string,
  name: string,
  nameRu: string,
  nameEn: string,
): LegacyVillageSections => {
  const official = getOfficialVillage(slug);
  if (!official) throw new Error("Unknown official village: " + slug);

  const territory = getTerritoryForVillage(slug);
  const hero = territory?.image ?? villageImg;

  return {
    hero,
    tourism: {
      lead: L(
        name + " айылы аймакты жай таанууга чакырат: жол, суу, тоо этеги жана адамдардын меймандостугу.",
        nameRu + " приглашает узнавать территорию медленно: дорога, вода, предгорье и гостеприимство людей.",
        nameEn + " invites a slower reading of the territory: road, water, foothill and local hospitality.",
      ),
      items: SHARED_TOURISM,
    },
    investment: {
      lead: L(
        name + " үчүн мүмкүнчүлүктөр табигый масштабда ачылат: үй чарбасы, айыл чарба, конок тосуу жана жол боюндагы кызматтар.",
        "Возможности для " + nameRu + " раскрываются в естественном масштабе: хозяйство, аграрные инициативы, гостеприимство и дорожные сервисы.",
        "Opportunities for " + nameEn + " unfold at a natural scale: household production, agriculture, hospitality and road-side services.",
      ),
      items: SHARED_INVESTMENT,
    },
    people: [
      { name: L("Устат", "Наставник", "Mentor"), role: L("Айылдын эс тутуму", "Память села", "Village memory"), img: elderImg },
      { name: L("Дыйкан", "Земледелец", "Farmer"), role: L("Жер менен иштеген", "Работающий на земле", "Working the land"), img: agricultureImg },
      { name: L("Жол башчы", "Проводник", "Guide"), role: L("Аймакты тааныткан", "Открывающий территорию", "Opening the territory"), img: horsemanImg },
    ],
    gallery: [hero, villageImg, valleyImg, waterfallImg, horsemanImg, elderImg],
  };
};

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
    showInfo: true,
    tagline: L(
      "Бийик тоолуу, мал чарбачылыгы өнүккөн айыл",
      "Высокогорное село с развитым животноводством",
      "A high-altitude village with developed livestock farming",
    ),
    hero: horseRouteImg,
    intro: L(
      "Ой-Тал айылы 2026-жылга карата 2 077 калкы жана 359 кожолугу бар тоолуу айыл. Деңиз деңгээлинен 1 920-2 108 метр бийиктикте жайгашат. Айылдын негизги кесиби - мал чарбачылыгы. Жакынкы тоолуу аймакта Кара-Тума чокусу жана Кара-Тума-Бел ашуусу жайгашкан.",
      "Ой-Тал - горное село, в котором по состоянию на 2026 год проживают 2 077 человек в 359 хозяйствах. Оно расположено на высоте 1 920-2 108 метров над уровнем моря. Основное занятие жителей - животноводство. В близлежащей горной местности находятся пик Кара-Тума и перевал Кара-Тума-Бел.",
      "Oi-Tal is a mountain village with a population of 2,077 and 359 households as of 2026. It lies at an elevation of 1,920-2,108 metres above sea level. The main livelihood is livestock farming. Kara-Tuma Peak and the Kara-Tuma-Bel Pass are located in the nearby mountain area.",
    ),
    info: [
      { label: INFO_POP, value: L("2 077", "2 077", "2,077") },
      { label: INFO_HOUSEHOLDS, value: L("359", "359", "359") },
      { label: INFO_ABOVE_SEA, value: L("1 920-2 108 м", "1 920-2 108 м", "1,920-2,108 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.427140, 74.100850", "40.427140, 74.100850", "40.427140, 74.100850") },
      { label: INFO_SCHOOL, value: L("Куланчы Орунбеков атындагы орто мектеп", "Средняя школа имени Куланчы Орунбекова", "Secondary school named after Kulanchy Orunbekov") },
      { label: L("Медициналык кызмат", "Медицинская служба", "Medical service"), value: L("Ой-Тал ҮДТ", "ГСВ Ой-Тал", "Oi-Tal family doctors group") },
      { label: INFO_PRESCHOOL, value: L("Казыбек-Ата балдар бакчасы", "Детский сад Казыбек-Ата", "Kazybek-Ata kindergarten") },
      { label: L("Негизги чарба багыты", "Основное направление хозяйства", "Main livelihood"), value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
    ],
    history: L(
      "Жергиликтүү маалыматтарда Ой-Тал айылынын тарыхы Кокон хандыгы мезгилине байланыштырылып, Бөрү уруусунун өкүлдөрүнүн бул жерде отурукташуусу баяндалат. Айыл 1920-1930-жылдары туруктуу конуш катары калыптана баштаган. «Ой-Тал» аталышы ойдуң жерде тал дарактары көп өскөнү менен түшүндүрүлөт. Бул маалыматтардын бир бөлүгү жергиликтүү оозеки тарыхка негизделет.",
      "В местных сведениях история села Ой-Тал связывается с периодом Кокандского ханства и рассказывается о поселении здесь представителей рода Бөрү. В 1920-1930-х годах село начало формироваться как постоянное поселение. Название «Ой-Тал» объясняется тем, что в низине росло много ив. Часть этих сведений основана на местной устной истории.",
      "Local accounts connect the history of Oi-Tal village with the period of the Kokand Khanate and describe members of the Boru clan settling here. The village began to form as a permanent settlement in the 1920s and 1930s. The name Oi-Tal is explained by the many willow trees that grew in the low-lying area. Some of this information is based on local oral history.",
    ),
    tourism: {
      lead: L(
        "Ой-Талдын тоолуу жаратылышы, Кара-Тума чокусу, Кара-Тума-Бел ашуусу, жайлоолору жана «Жатак» участкасы тоо, жайлоо жана этнотуризмди өнүктүрүүгө мүмкүнчүлүк түзөт. Материалда «НУР» эс алуу борбору иштеп жатканы көрсөтүлгөн.",
        "Горная природа Ой-Тала, пик Кара-Тума, перевал Кара-Тума-Бел, жайлоо и участок «Жатак» создают возможности для развития горного, жайлоо и этнотуризма. В материале указано, что действует центр отдыха «НУР».",
        "The mountain landscape of Oi-Tal, Kara-Tuma Peak, the Kara-Tuma-Bel Pass, its jailoos, and the Jatak area create opportunities for mountain, jailoo, and ethno-tourism. The supplied material states that the NUR recreation centre is operating.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Айылдын жаратылыш жана чарбалык мүмкүнчүлүктөрү туризм, балчылык жана айыл чарба продукциясын кайра иштетүү багыттарында долбоорлорду өнүктүрүүгө шарт түзөт.",
        "Природные и хозяйственные возможности села создают условия для развития проектов в сфере туризма, пчеловодства и переработки сельскохозяйственной продукции.",
        "The natural and economic potential of the village creates conditions for projects in tourism, beekeeping, and agricultural processing.",
      ),
      items: [
        {
          title: L("Тоо жана жайлоо туризми", "Горный и жайлоо туризм", "Mountain and jailoo tourism"),
          body: L("Боз үй лагери, жөө жана атчан маршруттар, жайкы жана кышкы эс алуу багыттарын өнүктүрүү мүмкүнчүлүгү бар.", "Есть возможность развивать юрточный лагерь, пешие и конные маршруты, а также направления летнего и зимнего отдыха.", "There is potential to develop a yurt camp, hiking and horseback routes, and summer and winter recreation."),
        },
        {
          title: L("Балчылык жана дары чөптөр", "Пчеловодство и лекарственные травы", "Beekeeping and medicinal herbs"),
          body: L("Бал өндүрүү, жергиликтүү дары чөптөрдү чогултуу жана кайра иштетүү боюнча чакан долбоорлорду өнүктүрүүгө мүмкүнчүлүк бар.", "Есть возможность развивать небольшие проекты по производству мёда, сбору и переработке местных лекарственных трав.", "There is potential to develop small projects for honey production and the collection and processing of local medicinal herbs."),
        },
        {
          title: L("Сүт жана этти кайра иштетүү", "Переработка молока и мяса", "Milk and meat processing"),
          body: L("Сүт жана эт азыктарын кайра иштетүү, сактоо жана жеткирүү боюнча чакан өндүрүш жана логистикалык кызматтарды өнүктүрүүгө мүмкүнчүлүк бар.", "Есть возможность развивать небольшое производство и логистические услуги по переработке, хранению и доставке молочной и мясной продукции.", "There is potential to develop small-scale production and logistics services for processing, storing, and delivering milk and meat products."),
        },
      ],
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
  {
    slug: "konduk",
    name: "Көңдүк",
    nameRu: "Көңдүк",
    nameEn: "Konduk",
    showInfo: true,
    ...createLegacyVillageSections("konduk", "Көңдүк", "Көңдүк", "Konduk"),
    tagline: L(
      "Кулун-Ата багытындагы бийик тоолуу айыл",
      "Высокогорное село на пути к Кулун-Ате",
      "A high-altitude village on the route to Kulun-Ata",
    ),
    intro: L(
      "Көңдүк айылы 2026-жылга карата 1 208 калкы жана 226 кожолугу бар бийик тоолуу айыл. Деңиз деңгээлинен 2 156 метр бийиктикте жайгашкан. Айылдын айланасында тоолор, жайыттар жана жаратылыш аймактары бар. Көңдүк Кулун-Ата мамлекеттик коругу жана Кулун көлүнө кеткен багытка жакын жайгашат.",
      "Көңдүк - высокогорное село, в котором по состоянию на 2026 год проживают 1 208 человек в 226 хозяйствах. Оно расположено на высоте 2 156 метров над уровнем моря. Вокруг села находятся горы, пастбища и природные территории. Көңдүк расположен недалеко от направления к государственному заповеднику Кулун-Ата и озеру Кулун.",
      "Konduk is a high-altitude village with a population of 1,208 and 226 households as of 2026. It is located at an elevation of 2,156 metres above sea level. Mountains, pastures, and natural areas surround the village. Konduk lies near the route to the Kulun-Ata State Nature Reserve and Kulun Lake.",
    ),
    info: [
      { label: INFO_POP, value: L("1 208", "1 208", "1,208") },
      { label: INFO_HOUSEHOLDS, value: L("226", "226", "226") },
      { label: INFO_ABOVE_SEA, value: L("2 156 м", "2 156 м", "2,156 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.460520, 74.116220", "40.460520, 74.116220", "40.460520, 74.116220") },
      { label: INFO_SCHOOL, value: L("Нурмамат уулу Сабыркул атындагы орто мектеп", "Средняя школа имени Сабыркула Нурмамат уулу", "Secondary school named after Sabyrkul Nurmamat uulu") },
      { label: INFO_MEDICAL, value: L("ФАП", "ФАП", "FAP") },
      { label: INFO_PRESCHOOL, value: L("«Көңдүк нуру» балдар бакчасы", "Детский сад «Көңдүк нуру»", "Konduk Nuru kindergarten") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
    ],
    history: L(
      "Көңдүк айылынын тарыхы жергиликтүү санжырада Карабарганын уулдары Эшей, Токтолу жана алардын урпактары менен байланыштуу баяндалат. Айылдын тарыхы боюнча кеңири маалыматтын бир бөлүгү жергиликтүү оозеки тарыхка негизделет.",
      "В местной родословной история села Көңдүк связывается с сыновьями Карабаргана Эшеем, Токтолу и их потомками. Часть подробных сведений об истории села основана на местной устной истории.",
      "Local genealogy connects the history of Konduk village with the sons of Karabargan, Eshey and Toktolu, and their descendants. Part of the broader account of the village history is based on local oral history.",
    ),
    tourism: {
      lead: L(
        "Көңдүктүн Кулун-Ата мамлекеттик коругу жана Кулун көлүнө кеткен багытка жакын жайгашуусу экотуризмди өнүктүрүүгө мүмкүнчүлүк түзөт. Тоолуу ландшафт жөө жүрүү, атчан саякат жана этнотуризм багыттарына ылайыктуу.",
        "Близость Көңдүк к направлению в государственный заповедник Кулун-Ата и к озеру Кулун создаёт возможности для развития экотуризма. Горный ландшафт подходит для пеших прогулок, конных путешествий и этнотуризма.",
        "The proximity of Konduk to the route toward the Kulun-Ata State Nature Reserve and Kulun Lake creates opportunities for ecotourism. The mountain landscape is suitable for hiking, horseback travel, and ethno-tourism.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Көңдүктө сүт жана этти кайра иштетүү, ошондой эле кол өнөрчүлүк жана кийиз буюмдарын өндүрүү багыттарын өнүктүрүүгө мүмкүнчүлүк бар.",
        "В Көңдүк есть возможность развивать переработку молока и мяса, а также производство ремесленных и войлочных изделий.",
        "Konduk has potential to develop milk and meat processing as well as handicraft and felt production.",
      ),
      items: [
        {
          title: L("Сүт жана этти кайра иштетүү", "Переработка молока и мяса", "Milk and meat processing"),
          body: L("Жергиликтүү малчылардан продукция кабыл алып, сүт жана эт азыктарын кайра иштетүүчү чакан борбор түзүүгө мүмкүнчүлүк бар.", "Есть возможность создать небольшой центр, который будет принимать продукцию у местных животноводов и перерабатывать молоко и мясо.", "There is potential to create a small centre that accepts products from local livestock farmers and processes milk and meat."),
        },
        {
          title: L("Кол өнөрчүлүк жана кийиз буюмдары", "Ремесла и изделия из войлока", "Handicrafts and felt products"),
          body: L("Жергиликтүү чеберлердин катышуусунда кийиз буюмдарын, сувенирлерди жана салттуу кол өнөрчүлүк продукцияларын өндүрүү багытын өнүктүрүүгө болот.", "При участии местных мастеров можно развивать производство войлочных изделий, сувениров и традиционной ремесленной продукции.", "With the participation of local craftspeople, felt products, souvenirs, and traditional handicrafts could be developed."),
        },
      ],
    },
    mapNote: L("Көңдүк, Ой-Тал аймагы", "Көңдүк, аймак Ой-Тал", "Konduk, Oi-Tal"),
    related: [],
  },
  {
    slug: "sary-bee",
    name: "Сары-Бээ",
    nameRu: "Сары-Бээ",
    nameEn: "Sary-Bee",
    showInfo: true,
    ...createLegacyVillageSections("sary-bee", "Сары-Бээ", "Сары-Бээ", "Sary-Bee"),
    tagline: L(
      "Ой-Тал айыл аймагынын административдик борбору",
      "Административный центр айыл аймака Ой-Тал",
      "The administrative centre of Oi-Tal Aiyl Aimak",
    ),
    intro: L(
      "Сары-Бээ айылы Ой-Тал айыл аймагынын административдик борбору. 2026-жылга карата калкы 1 143 адам. Айыл деңиз деңгээлинен болжол менен 1 750 метр бийиктикте жайгашкан. Негизги чарба багыттарына мал чарбачылыгы, дыйканчылык, кызмат көрсөтүү, кол өнөрчүлүк жана бал өндүрүү кирет.",
      "Село Сары-Бээ является административным центром айыл аймака Ой-Тал. По состоянию на 2026 год его население составляет 1 143 человека. Село расположено на высоте примерно 1 750 метров над уровнем моря. Основные направления хозяйства включают животноводство, земледелие, услуги, ремесла и производство мёда.",
      "Sary-Bee village is the administrative centre of Oi-Tal Aiyl Aimak. Its population is 1,143 as of 2026. The village is located at approximately 1,750 metres above sea level. Its main livelihoods include livestock farming, crop farming, services, handicrafts, and honey production.",
    ),
    info: [
      { label: INFO_POP, value: L("1 143", "1 143", "1,143") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 1 750 м", "примерно 1 750 м", "approximately 1,750 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.556829, 73.886803", "40.556829, 73.886803", "40.556829, 73.886803") },
      { label: L("Административдик макамы", "Административный статус", "Administrative status"), value: L("Ой-Тал айыл аймагынын борбору", "Центр айыл аймака Ой-Тал", "Centre of Oi-Tal Aiyl Aimak") },
      { label: INFO_SCHOOL, value: L("Абдрахман Бегитаев атындагы «Сары-Бээ» орто мектеби", "Средняя школа «Сары-Бээ» имени Абдрахмана Бегитаева", "Sary-Bee Secondary School named after Abdrakhman Begitaev") },
      { label: L("Медициналык кызмат", "Медицинская служба", "Medical service"), value: L("Үй-бүлөлүк дарыгерлер тобу", "Группа семейных врачей", "Family doctors group") },
      { label: INFO_PRESCHOOL, value: L("«Мөлтүр» бала бакчасы", "Детский сад «Мөлтүр»", "Moltur kindergarten") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы, дыйканчылык, кызмат көрсөтүү, кол өнөрчүлүк жана бал өндүрүү", "Животноводство, земледелие, услуги, ремесла и производство мёда", "Livestock farming, crop farming, services, handicrafts, and honey production") },
    ],
    history: L(
      "Жергиликтүү уламыш боюнча «Сары-Бээ» аталышы ата-бабалардын жоголгон сары бээсин ушул өрөөндөн таап алышы менен байланыштуу. Ошондон кийин өрөөн Сары-Бээ деп аталып калгандыгы айтылат. Айылдын так негизделген жылы боюнча маалымат кошумча тактоону талап кылат.",
      "Согласно местной легенде, название «Сары-Бээ» связано с тем, что предки нашли в этой долине потерявшуюся жёлтую кобылу. Рассказывается, что после этого долину стали называть Сары-Бээ. Сведения о точном годе основания села требуют дополнительного уточнения.",
      "According to a local legend, the name Sary-Bee is connected with ancestors finding their lost yellow mare in this valley. The valley is said to have been called Sary-Bee after that event. Information about the exact year the village was founded requires further clarification.",
    ),
    tourism: {
      lead: L(
        "Сары-Бээнин тоолуу жаратылышы, суу ресурстары, жайыттары жана жайлоолору этнотуризмди, атчан жана жөө маршруттарды өнүктүрүүгө мүмкүнчүлүк берет. Учурда расмий катталган туристтик объект тууралуу так маалымат берилген эмес.",
        "Горная природа, водные ресурсы, пастбища и жайлоо Сары-Бээ создают возможности для развития этнотуризма, конных и пеших маршрутов. Точная информация об официально зарегистрированном туристическом объекте в настоящее время не предоставлена.",
        "The mountain landscape, water resources, pastures, and jailoos of Sary-Bee create opportunities for ethno-tourism and horseback and hiking routes. Precise information about an officially registered tourism site has not currently been provided.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Сары-Бээде конкреттүү энергетикалык долбоор менен катар айыл чарба продукциясын кайра иштетүү жана жергиликтүү экономиканы өнүктүрүү мүмкүнчүлүктөрү бар.",
        "Наряду с конкретным энергетическим проектом в Сары-Бээ есть возможности для переработки сельскохозяйственной продукции и развития местной экономики.",
        "Alongside a specific energy project, Sary-Bee has opportunities for agricultural processing and local economic development.",
      ),
      items: [
        {
          title: L("Чоң-Кааты чакан ГЭС долбоору", "Проект малой ГЭС Чоң-Кааты", "Chon-Kaaty small hydropower project"),
          body: L("Чоң-Кааты участкасында чакан ГЭС куруу долбоору каралууда. Демилгечи - «МТБ Инжиниринг Групп» ЖЧК. Жер аянты 1,26 га, болжолдуу инвестиция көлөмү 1,8 млн АКШ доллары. Ишке ашырылган учурда болжол менен 9 жумуш ордун түзүү мүмкүнчүлүгү көрсөтүлгөн.", "Рассматривается проект строительства малой ГЭС на участке Чоң-Кааты. Инициатор - ОсОО «МТБ Инжиниринг Групп». Площадь земельного участка составляет 1,26 га, предполагаемый объём инвестиций - 1,8 млн долларов США. В случае реализации указана возможность создания примерно 9 рабочих мест.", "A small hydropower plant project is under consideration in the Chon-Kaaty area. The initiator is MTB Engineering Group LLC. The land area is 1.26 ha and the estimated investment is USD 1.8 million. If implemented, the project is indicated as having the potential to create approximately 9 jobs."),
        },
        {
          title: L("Сүт жана эт азыктарын кайра иштетүү", "Переработка молочной и мясной продукции", "Milk and meat processing"),
          body: L("Жергиликтүү мал чарбачылыгынын негизинде сүт жана эт азыктарын кайра иштетүү багытын өнүктүрүүгө мүмкүнчүлүк бар.", "На основе местного животноводства есть возможность развивать переработку молочной и мясной продукции.", "Local livestock farming creates potential to develop milk and meat processing."),
        },
        {
          title: L("Бал жана айыл чарба продукциясы", "Мёд и сельскохозяйственная продукция", "Honey and agricultural products"),
          body: L("Бал өндүрүү, жергиликтүү продукцияны таңгактоо жана рынокко чыгаруу багыттарын өнүктүрүүгө мүмкүнчүлүк бар.", "Есть возможность развивать производство мёда, упаковку местной продукции и её вывод на рынок.", "There is potential to develop honey production, packaging of local products, and market access."),
        },
      ],
    },
    mapNote: L("Сары-Бээ, Ой-Тал аймагы", "Сары-Бээ, аймак Ой-Тал", "Sary-Bee, Oi-Tal"),
    related: [],
  },
  {
    slug: "terek-suu",
    name: "Терек-Суу",
    nameRu: "Терек-Суу",
    nameEn: "Terek-Suu",
    showInfo: true,
    ...createLegacyVillageSections("terek-suu", "Терек-Суу", "Терек-Суу", "Terek-Suu"),
    tagline: L(
      "Тар дарыясынын боюндагы тоолуу айыл",
      "Горное село на берегу реки Тар",
      "A mountain village along the Tar River",
    ),
    intro: L(
      "Терек-Суу айылы 2026-жылга карата 502 калкы бар, Тар дарыясынын боюнда жайгашкан тоолуу айыл. Деңиз деңгээлинен 1 592 метр бийиктикте жайгашат. Айылдын негизги кесиптери - мал чарбачылыгы жана балчылык.",
      "Терек-Суу - горное село с населением 502 человека по состоянию на 2026 год, расположенное на берегу реки Тар. Оно находится на высоте 1 592 метров над уровнем моря. Основные занятия жителей - животноводство и пчеловодство.",
      "Terek-Suu is a mountain village along the Tar River with a population of 502 as of 2026. It is located at an elevation of 1,592 metres above sea level. The main livelihoods are livestock farming and beekeeping.",
    ),
    info: [
      { label: INFO_POP, value: L("502", "502", "502") },
      { label: INFO_ABOVE_SEA, value: L("1 592 м", "1 592 м", "1,592 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.532630, 73.827330", "40.532630, 73.827330", "40.532630, 73.827330") },
      { label: INFO_FORMER_ADMIN, value: L("Капчыгай айыл өкмөтү", "Айыл окмоту Капчыгай", "Kapchygai aiyl okmotu") },
      { label: INFO_SCHOOL, value: L("Акун Турганбаев атындагы «Терек-Суу» орто мектеби", "Средняя школа «Терек-Суу» имени Акуна Турганбаева", "Terek-Suu Secondary School named after Akun Turganbaev") },
      { label: INFO_MEDICAL, value: L("Терек-Суу ФАПы", "ФАП Терек-Суу", "Terek-Suu FAP") },
      { label: INFO_PRESCHOOL, value: L("Жок", "Нет", "None") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана балчылык", "Животноводство и пчеловодство", "Livestock farming and beekeeping") },
    ],
    history: L(
      "Терек-Суу айылы 1930-жылы калыптана баштаган. Айылдын түптөлүшү совет мезгилиндеги көчмөн калкты отурукташтыруу жана алгачкы колхоздорду түзүү процесси менен байланыштуу. Жергиликтүү маалымат боюнча «Терек-Суу» аталышы бул аймакта өскөн бийик теректер жана алардын арасынан аккан тунук суу менен байланышкан.",
      "Село Терек-Суу начало формироваться в 1930 году. Его становление связано с процессом оседания кочевого населения и созданием первых колхозов в советский период. По местным сведениям, название «Терек-Суу» связано с высокими тополями, росшими в этой местности, и чистой водой, протекавшей между ними.",
      "Terek-Suu village began to form in 1930. Its establishment is connected with the settlement of the nomadic population and the creation of the first collective farms during the Soviet period. According to local information, the name Terek-Suu is associated with the tall poplar trees that grew in the area and the clear water that flowed among them.",
    ),
    tourism: {
      lead: L(
        "Терек-Суунун тоолуу жаратылышы, дарыясы жана таза абасы жаратылыш жана айылдык туризмди өнүктүрүүгө мүмкүнчүлүк берет. Жөө жана атчан маршруттарды уюштуруу үчүн табигый шарттар бар.",
        "Горная природа, река и чистый воздух Терек-Суу создают возможности для развития природного и сельского туризма. Есть природные условия для организации пеших и конных маршрутов.",
        "The mountain landscape, river, and clean air of Terek-Suu create opportunities for nature-based and rural tourism. The natural setting is suitable for hiking and horseback routes.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Терек-Суу боюнча конкреттүү инвестициялык долбоор көрсөтүлгөн эмес. Айылдын негизги чарбалык багыттары - мал чарбачылыгы жана балчылык.",
        "Для Терек-Суу конкретный инвестиционный проект не указан. Основные направления хозяйства села - животноводство и пчеловодство.",
        "No specific investment project has been identified for Terek-Suu. The main livelihoods of the village are livestock farming and beekeeping.",
      ),
      items: [],
    },
    mapNote: L("Терек-Суу, Ой-Тал аймагы", "Терек-Суу, аймак Ой-Тал", "Terek-Suu, Oi-Tal"),
    related: [],
  },
  {
    slug: "nichke-suu",
    name: "Ничке-Суу",
    nameRu: "Ничке-Суу",
    nameEn: "Nichke-Suu",
    showInfo: true,
    ...createLegacyVillageSections("nichke-suu", "Ничке-Суу", "Ничке-Суу", "Nichke-Suu"),
    tagline: L(
      "Тар дарыясынын оң жээгиндеги чакан тоолуу айыл",
      "Небольшое горное село на правом берегу реки Тар",
      "A small mountain village on the right bank of the Tar River",
    ),
    intro: L(
      "Ничке-Суу айылы Ой-Тал айыл аймагындагы чакан тоолуу айыл. 2026-жылга карата калкы 303 адам. Тар дарыясынын оң жээгинде, деңиз деңгээлинен болжол менен 1 610 метр бийиктикте жайгашкан. Негизги чарба багыттары - мал чарбачылыгы жана балчылык.",
      "Ничке-Суу - небольшое горное село в айыл аймаке Ой-Тал. По состоянию на 2026 год его население составляет 303 человека. Оно расположено на правом берегу реки Тар на высоте примерно 1 610 метров над уровнем моря. Основные направления хозяйства - животноводство и пчеловодство.",
      "Nichke-Suu is a small mountain village in Oi-Tal Aiyl Aimak. Its population is 303 as of 2026. It is located on the right bank of the Tar River at approximately 1,610 metres above sea level. The main livelihoods are livestock farming and beekeeping.",
    ),
    info: [
      { label: INFO_POP, value: L("303", "303", "303") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 1 610 м", "примерно 1 610 м", "approximately 1,610 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.535630, 73.795700", "40.535630, 73.795700", "40.535630, 73.795700") },
      { label: INFO_SCHOOL, value: L("Айылда өзүнчө орто мектеп жок, окуучулар Терек-Суу айылындагы мектепке барат", "В селе нет отдельной средней школы, ученики посещают школу в селе Терек-Суу", "The village has no separate secondary school, and pupils attend the school in Terek-Suu") },
      { label: INFO_PRESCHOOL, value: L("Ничке-Суу мектепке чейинки билим берүү уюму", "Дошкольная образовательная организация Ничке-Суу", "Nichke-Suu preschool education institution") },
      { label: INFO_MEDICAL, value: L("Жок", "Нет", "None") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана балчылык", "Животноводство и пчеловодство", "Livestock farming and beekeeping") },
    ],
    history: L(
      "Ничке-Суу айылы 1980-жылы түптөлгөн. Айылдын пайда болушуна Терек-Суу айылындагы жер көчкү коркунучу себеп болуп, айрым тургундар коопсуз аймак катары Ничке-Суу участогуна көчүп келип отурукташкан. Жергиликтүү маалымат боюнча азыркы айыл жайгашкан жер мурда «Там-Талаа» деп аталган. Кийин аймактагы ичке агып өткөн сууга байланыштуу «Ничке-Суу» аталышы калыптанган.",
      "Село Ничке-Суу было основано в 1980 году. Причиной его появления стала угроза оползня в селе Терек-Суу, после чего часть жителей переселилась на участок Ничке-Суу как в более безопасное место. По местным сведениям, территория нынешнего села ранее называлась «Там-Талаа». Позднее название «Ничке-Суу» сформировалось в связи с узким водным потоком, протекающим в этой местности.",
      "Nichke-Suu village was established in 1980. The threat of a landslide in Terek-Suu led some residents to settle in the Nichke-Suu area as a safer location. According to local information, the site of the present village was formerly called Tam-Talaa. The name Nichke-Suu later developed in connection with the narrow stream flowing through the area.",
    ),
    tourism: {
      lead: L(
        "Ничке-Суунун Тар дарыясынын оң жээгинде жайгашуусу, тоолору жана таза жаратылышы жөө, атчан, айылдык жана этнотуризмди өнүктүрүүгө мүмкүнчүлүк түзөт.",
        "Расположение Ничке-Суу на правом берегу реки Тар, горы и чистая природа создают возможности для развития пешего, конного, сельского и этнотуризма.",
        "The location of Nichke-Suu on the right bank of the Tar River, its mountains, and its clean natural setting create opportunities for hiking, horseback, rural, and ethno-tourism.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Ничке-Сууда суу системаларын жакшыртуу, балчылык, мал чарбачылыгы, айылдык туризм жана чакан ГЭС мүмкүнчүлүгүн изилдөө өнүгүү багыттары катары каралышы мүмкүн.",
        "В Ничке-Суу улучшение водных систем, пчеловодство, животноводство, сельский туризм и изучение потенциала малой ГЭС могут рассматриваться как направления развития.",
        "Improved water systems, beekeeping, livestock farming, rural tourism, and study of small hydropower potential may be considered as development directions for Nichke-Suu.",
      ),
      items: [
        {
          title: L("Ичүүчү жана сугат суу системасы", "Система питьевой и поливной воды", "Drinking and irrigation water systems"),
          body: L("Суу түтүктөрүн, булактарды жана сугат системаларын жакшыртуу айыл үчүн маанилүү өнүгүү багыты болуп саналат.", "Улучшение водопроводов, источников и оросительных систем является важным направлением развития села.", "Improving water pipes, springs, and irrigation systems is an important development direction for the village."),
        },
        {
          title: L("Балчылык жана балды кайра иштетүү", "Пчеловодство и переработка мёда", "Beekeeping and honey processing"),
          body: L("Тоолуу шартта өндүрүлгөн балды чогултуу, кайра иштетүү, таңгактоо жана рынокко чыгаруу багытын өнүктүрүүгө мүмкүнчүлүк бар.", "Есть возможность развивать сбор, переработку, упаковку и вывод на рынок мёда, произведённого в горных условиях.", "There is potential to develop the collection, processing, packaging, and marketing of honey produced in mountain conditions."),
        },
        {
          title: L("Мал чарбачылыгы", "Животноводство", "Livestock farming"),
          body: L("Жайыттарды натыйжалуу пайдалануу, малдын сапатын жакшыртуу жана айыл чарба продукциясын кайра иштетүү багыттарын өнүктүрүүгө болот.", "Можно развивать эффективное использование пастбищ, улучшение качества скота и переработку сельскохозяйственной продукции.", "Efficient pasture use, improved livestock quality, and agricultural processing could be developed."),
        },
        {
          title: L("Айылдык туризм", "Сельский туризм", "Rural tourism"),
          body: L("Конок үйлөрү, боз үй, атчан маршруттар жана чакан эс алуу кызматтарын өнүктүрүүгө мүмкүнчүлүк бар.", "Есть возможность развивать гостевые дома, юрты, конные маршруты и небольшие услуги отдыха.", "There is potential to develop guesthouses, yurts, horseback routes, and small recreation services."),
        },
        {
          title: L("Чакан ГЭС мүмкүнчүлүгүн изилдөө", "Изучение потенциала малой ГЭС", "Study of small hydropower potential"),
          body: L("Тар дарыясынын энергетикалык мүмкүнчүлүгүн изилдөөгө болот. Мындай долбоор гидрологиялык, техникалык жана экологиялык изилдөөлөрдөн кийин гана каралышы керек.", "Энергетический потенциал реки Тар можно изучить. Такой проект следует рассматривать только после гидрологических, технических и экологических исследований.", "The energy potential of the Tar River could be studied. Any such project should be considered only after hydrological, technical, and environmental studies."),
        },
      ],
    },
    mapNote: L("Ничке-Суу, Ой-Тал аймагы", "Ничке-Суу, аймак Ой-Тал", "Nichke-Suu, Oi-Tal"),
    related: [],
  },
  {
    slug: "kara-tash",
    name: "Кара-Таш",
    nameRu: "Кара-Таш",
    nameEn: "Kara-Tash",
    showInfo: true,
    ...createLegacyVillageSections("kara-tash", "Кара-Таш", "Кара-Таш", "Kara-Tash"),
    tagline: L(
      "Тар дарыясынын боюндагы тоо этегиндеги айыл",
      "Село у подножия гор на берегу реки Тар",
      "A foothill village along the Tar River",
    ),
    intro: L(
      "Кара-Таш айылы 2026-жылга карата 901 калкы жана 171 кожолугу бар тоолуу айыл. Тар дарыясынын боюнда, деңиз деңгээлинен болжол менен 1 754 метр бийиктикте жайгашкан. Айылдын негизги кесиби - мал чарбачылыгы, ошондой эле дыйканчылык жүргүзүлөт.",
      "Кара-Таш - горное село с населением 901 человек и 171 хозяйством по состоянию на 2026 год. Оно расположено на берегу реки Тар на высоте примерно 1 754 метров над уровнем моря. Основное занятие жителей - животноводство, также ведётся земледелие.",
      "Kara-Tash is a mountain village with a population of 901 and 171 households as of 2026. It is located along the Tar River at approximately 1,754 metres above sea level. The main livelihood is livestock farming, and crop farming is also practiced.",
    ),
    info: [
      { label: INFO_POP, value: L("901", "901", "901") },
      { label: INFO_HOUSEHOLDS, value: L("171", "171", "171") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 1 754 м", "примерно 1 754 м", "approximately 1,754 m") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.550460, 73.974870", "40.550460, 73.974870", "40.550460, 73.974870") },
      { label: INFO_SCHOOL, value: L("Ысак Жорокулов атындагы «Кара-Таш» орто мектеби", "Средняя школа «Кара-Таш» имени Ысака Жорокулова", "Kara-Tash Secondary School named after Ysak Jorokulov") },
      { label: INFO_MEDICAL, value: L("Кара-Таш ФАПы", "ФАП Кара-Таш", "Kara-Tash FAP") },
      { label: INFO_PRESCHOOL, value: L("«Кара-Таш» мектепке чейинки билим берүү уюму", "Дошкольная образовательная организация «Кара-Таш»", "Kara-Tash preschool education institution") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
    ],
    history: L(
      "Кара-Таш айылынын тарыхы жергиликтүү малчылардын көчмөн жана жарым көчмөн жашоо образы менен байланыштуу. Совет мезгилинде колхоздор түзүлүп, калк акырындап туруктуу отурукташа баштаган. Жергиликтүү маалымат боюнча «Кара-Таш» аталышы айылдын ортосунда жайгашкан чоң кара ташка байланыштуу келип чыккан.",
      "История села Кара-Таш связана с кочевым и полукочевым образом жизни местных животноводов. В советский период были созданы колхозы, и население постепенно стало переходить к постоянному проживанию. По местным сведениям, название «Кара-Таш» произошло от большого чёрного камня, расположенного в центре села.",
      "The history of Kara-Tash village is connected with the nomadic and semi-nomadic way of life of local herders. Collective farms were established during the Soviet period, and the population gradually began to settle permanently. According to local information, the name Kara-Tash came from a large black stone located in the centre of the village.",
    ),
    tourism: {
      lead: L(
        "Кара-Таштын Тар дарыясынын боюндагы тоолуу жаратылышы экотуризмди, үй-бүлөлүк эс алууну, жайлоо жана этнотуризмди өнүктүрүүгө мүмкүнчүлүк түзөт. Материалда Aska Resort жана «Көчмөндөр» аталышындагы эс алуу жайлары көрсөтүлгөн, алардын так маалыматы кошумча такталууда.",
        "Горная природа Кара-Таша на берегу реки Тар создаёт возможности для развития экотуризма, семейного отдыха, жайлоо и этнотуризма. В материале указаны места отдыха Aska Resort и «Көчмөндөр», точная информация о них дополнительно уточняется.",
        "The mountain landscape of Kara-Tash along the Tar River creates opportunities for ecotourism, family recreation, jailoo tourism, and ethno-tourism. The supplied material lists recreation places called Aska Resort and Kochmondor, while precise information about them is still being clarified.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Кара-Ташта эт жана сүттү кайра иштетүү, туризм жана жергиликтүү продукцияны бирдиктүү бренд менен чыгаруу багыттарын өнүктүрүүгө мүмкүнчүлүк бар.",
        "В Кара-Таше есть возможность развивать переработку мяса и молока, туризм и выпуск местной продукции под единым брендом.",
        "Kara-Tash has potential to develop meat and milk processing, tourism, and local products under a unified brand.",
      ),
      items: [
        {
          title: L("Этти кайра иштетүү", "Переработка мяса", "Meat processing"),
          body: L("Малды союу, муздатуу, таңгактоо жана даяр эт продукциясын чыгаруу боюнча чакан же орто ишкана түзүүгө мүмкүнчүлүк бар.", "Есть возможность создать малое или среднее предприятие по убою скота, охлаждению, упаковке и выпуску готовой мясной продукции.", "There is potential to create a small or medium enterprise for livestock slaughter, chilling, packaging, and production of prepared meat products."),
        },
        {
          title: L("Сүттү кайра иштетүү", "Переработка молока", "Milk processing"),
          body: L("Сүт чогултуу жана курут, каймак, май, сыр сыяктуу продукцияларды өндүрүү багытын өнүктүрүүгө болот.", "Можно развивать сбор молока и производство курута, каймака, масла, сыра и другой продукции.", "Milk collection and production of products such as kurut, kaymak, butter, and cheese could be developed."),
        },
        {
          title: L("Туристтик комплекс", "Туристический комплекс", "Tourism complex"),
          body: L("Боз үй, конок үй, улуттук тамак-аш, ат турлары жана жаратылыш маршруттарын камтыган чакан туристтик комплекс түзүүгө мүмкүнчүлүк бар.", "Есть возможность создать небольшой туристический комплекс с юртами, гостевым домом, национальной кухней, конными турами и природными маршрутами.", "There is potential to create a small tourism complex with yurts, a guesthouse, national cuisine, horseback tours, and nature routes."),
        },
        {
          title: L("Жергиликтүү бренд", "Местный бренд", "Local brand"),
          body: L("Эт, сүт, бал жана башка жергиликтүү продукцияларды бирдиктүү бренд менен таңгактап сатуу багытын өнүктүрүүгө болот.", "Можно развивать упаковку и продажу мяса, молока, мёда и другой местной продукции под единым брендом.", "Meat, milk, honey, and other local products could be packaged and sold under a unified brand."),
        },
      ],
    },
    mapNote: L("Кара-Таш, Ой-Тал аймагы", "Кара-Таш, аймак Ой-Тал", "Kara-Tash, Oi-Tal"),
    related: [],
  },
  {
    slug: "ylai-talaa",
    name: "Ылай-Талаа",
    nameRu: "Ылай-Талаа",
    nameEn: "Ylai-Talaa",
    showInfo: true,
    ...createLegacyVillageSections("ylai-talaa", "Ылай-Талаа", "Ылай-Талаа", "Ylai-Talaa"),
    tagline: L("Тарыхый аталышы - Сөгөт", "Историческое название - Сёгёт", "Historic name - Sogot"),
    intro: L(
      "Ылай-Талаа - Ылай-Талаа айыл аймагынын курамындагы айыл. Калкы 7 130 адам. Негизги чарба багыттары - мал чарбачылыгы жана дыйканчылык.",
      "Ылай-Талаа - село в составе айылного аймака Ылай-Талаа. Население - 7 130 человек. Основные направления хозяйства - животноводство и земледелие.",
      "Ylai-Talaa is a village in the Ylai-Talaa aiyl aimak. Its population is 7,130. Livestock farming and agriculture are the main local livelihoods.",
    ),
    info: [
      { label: INFO_AIMAK, value: L("Ылай-Талаа", "Ылай-Талаа", "Ylai-Talaa") },
      { label: INFO_POP, value: L("7 130", "7 130", "7,130") },
      { label: INFO_FORMER_NAME, value: L("Сөгөт", "Сёгёт", "Sogot") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and agriculture") },
    ],
    history: L(
      "Жергиликтүү тарыхый маалыматтарда Ылай-Талаа айылы мурда «Сөгөт» деп аталганы айтылат. 1955-1956-жылдары Ворошилов, Сталин, Кызыл-Жол, Киров жана Молотов колхоздору бириктирилип, Мариш Баатыровдун жетекчилиги астында Карл Маркс атындагы колхоз уюштурулган.",
      "В местных исторических материалах говорится, что село Ылай-Талаа ранее называлось «Сёгёт». В 1955-1956 годах колхозы имени Ворошилова, Сталина, Кызыл-Жол, Кирова и Молотова были объединены, и под руководством Мариша Баатырова был организован колхоз имени Карла Маркса.",
      "Local historical materials state that Ylai-Talaa was formerly called Sogot. In 1955-1956, the Voroshilov, Stalin, Kyzyl-Zhol, Kirov, and Molotov collective farms were merged to form the Karl Marx collective farm under the leadership of Marish Baatyrov.",
    ),
    mapNote: L("Ылай-Талаа айылы, Кара-Кулжа району", "Село Ылай-Талаа, Кара-Кульджинский район", "Ylai-Talaa village, Kara-Kulja district"),
    related: [],
  },
  {
    slug: "sai",
    name: "Сай",
    nameRu: "Сай",
    nameEn: "Sai",
    showInfo: true,
    ...createLegacyVillageSections("sai", "Сай", "Сай", "Sai"),
    tagline: L("Тар дарыясынын сол жээгиндеги айыл", "Село на левом берегу реки Тар", "A village on the left bank of the Tar River"),
    intro: L(
      "Сай - Тар дарыясынын сол жээгинде жайгашкан айыл. Калкы 2 417 адам. Айыл чарбасы жана мал чарбачылыгы жергиликтүү турмушта маанилүү орунда турат.",
      "Сай - село на левом берегу реки Тар. Население - 2 417 человек. Сельское хозяйство и животноводство занимают важное место в местной жизни.",
      "Sai is a village on the left bank of the Tar River. Its population is 2,417. Agriculture and livestock farming are important parts of local life.",
    ),
    info: [
      { label: INFO_AIMAK, value: L("Ылай-Талаа", "Ылай-Талаа", "Ylai-Talaa") },
      { label: INFO_POP, value: L("2 417", "2 417", "2,417") },
      { label: INFO_RIVER_LOCATION, value: L("Тар дарыясынын сол жээгинде", "На левом берегу реки Тар", "On the left bank of the Tar River") },
      { label: INFO_FROM_KARA_KULJA, value: L("болжол менен 5 км түштүк-чыгышта", "примерно в 5 км к юго-востоку", "Approximately 5 km southeast") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 1 319 м", "примерно 1 319 м", "Approximately 1,319 m") },
      { label: INFO_ECONOMY, value: L("Айыл чарбасы жана мал чарбачылыгы", "Сельское хозяйство и животноводство", "Agriculture and livestock farming") },
      { label: INFO_SCHOOL, value: L("Мариш Баатыров атындагы мектеп", "Школа имени Мариша Баатырова", "Marish Baatyrov School") },
      { label: INFO_SCHOOL_OPENED, value: L("1980-1981-жылдары", "в 1980-1981 годах", "1980-1981") },
      { label: INFO_STUDENTS, value: L("496", "496", "496") },
      { label: INFO_MEDICAL, value: L("ФАП", "ФАП", "FAP") },
      { label: INFO_PRESCHOOL, value: L("Бала бакча", "Детский сад", "Kindergarten") },
    ],
    history: L(
      "Жергиликтүү материалдарда Сай айылынын тарыхы Бөксө, Ток-Өрүк жана Капка Чүңөт сыяктуу мурдагы кыштактар менен байланыштуу экени айтылат. 1949-1950-жылдары Ток-Өрүк айылында Кызыл-Жол мектеби ачылган. 1959-жылдагы колхоздоштуруу мезгилинде бир катар кыштактар Карл Маркс атындагы колхозго кошулуп, Сай айылы катары катталган. Мариш Баатыров атындагы мектеп 1980-1981-жылдары пайдаланууга берилген.",
      "В местных материалах история села Сай связывается с прежними поселениями Бөксө, Ток-Өрүк и Капка Чүңөт. В 1949-1950 годах в Ток-Өрүк была открыта школа Кызыл-Жол. В период укрупнения колхозов в 1959 году ряд поселений вошёл в колхоз имени Карла Маркса и был зарегистрирован как село Сай. Школа имени Мариша Баатырова была введена в эксплуатацию в 1980-1981 годах.",
      "Local materials connect the history of Sai with the former settlements of Bokso, Tok-Oruk, and Kapka Chunot. In 1949-1950, the Kyzyl-Zhol school opened in Tok-Oruk. During collective farm consolidation in 1959, several settlements joined the Karl Marx collective farm and were registered as Sai village. The Marish Baatyrov School opened in 1980-1981.",
    ),
    mapNote: L("Сай айылы, Кара-Кулжа району", "Село Сай, Кара-Кульджинский район", "Sai village, Kara-Kulja district"),
    related: [],
  },
  {
    slug: "tokbay-talaa",
    name: "Токбай-Талаа",
    nameRu: "Токбай-Талаа",
    nameEn: "Tokbay-Talaa",
    showInfo: true,
    ...createLegacyVillageSections("tokbay-talaa", "Токбай-Талаа", "Токбай-Талаа", "Tokbay-Talaa"),
    tagline: L("Тар дарыясынын сол жээгиндеги тоолуу айыл", "Горное село на левом берегу реки Тар", "A mountain village on the left bank of the Tar River"),
    intro: L(
      "Токбай-Талаа - Тар дарыясынын сол жээгинде жайгашкан тоолуу айыл. Калкы 4 647 адам. Мал чарбачылыгы жана жер иштетүү жергиликтүү чарбанын негизги багыттарына кирет.",
      "Токбай-Талаа - горное село на левом берегу реки Тар. Население - 4 647 человек. Животноводство и земледелие входят в основные направления местного хозяйства.",
      "Tokbay-Talaa is a mountain village on the left bank of the Tar River. Its population is 4,647. Livestock farming and cultivation are the main local livelihoods.",
    ),
    info: [
      { label: INFO_AIMAK, value: L("Ылай-Талаа", "Ылай-Талаа", "Ylai-Talaa") },
      { label: INFO_POP, value: L("4 647", "4 647", "4,647") },
      { label: INFO_RIVER_LOCATION, value: L("Тар дарыясынын сол жээгинде", "На левом берегу реки Тар", "On the left bank of the Tar River") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 1 491 м", "примерно 1 491 м", "Approximately 1,491 m") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана жер иштетүү", "Животноводство и земледелие", "Livestock farming and cultivation") },
      { label: INFO_SCHOOL, value: L("Мамыт Абакиров атындагы «Токбай-Талаа» жалпы билим берүү мектеби", "Общеобразовательная школа «Токбай-Талаа» имени Мамыта Абакирова", "Mamyt Abakirov Tokbay-Talaa General Education School") },
      { label: INFO_FORMER_ADMIN, value: L("Чалма айыл округу", "Чалминский айылный округ", "Chalma rural district") },
    ],
    history: L(
      "Токбай-Талаа Кара-Кулжа районунун тоолуу бөлүгүндө, Тар дарыясынын сол жээгинде жайгашкан. Жергиликтүү материалдарда айылдын мурда Чалма айыл округуна караганы көрсөтүлөт. Тоолуу шарт жана жайыттар мал чарбачылыгынын өнүгүшүнө өбөлгө түзгөн.",
      "Токбай-Талаа расположено в горной части Кара-Кульджинского района, на левом берегу реки Тар. В местных материалах указано, что ранее село относилось к Чалминскому айылному округу. Горные условия и пастбища способствовали развитию животноводства.",
      "Tokbay-Talaa is located in the mountainous part of Kara-Kulja District on the left bank of the Tar River. Local materials state that the village formerly belonged to the Chalma rural district. Mountain conditions and pastures supported the development of livestock farming.",
    ),
    mapNote: L("Токбай-Талаа айылы, Кара-Кулжа району", "Село Токбай-Талаа, Кара-Кульджинский район", "Tokbay-Talaa village, Kara-Kulja district"),
    related: [],
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
