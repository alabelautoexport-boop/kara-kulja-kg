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
const INFO_TRAVEL_TIME = L("Жол жүрүү убактысы", "Время в пути", "Travel time");
const INFO_ROAD = L("Жолу", "Дорога", "Road");
const INFO_UTILITIES = L("Коммуналдык кызматтар", "Коммунальные услуги", "Utilities");
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
    slug: "kara-kochkor", name: "Кара-Кочкор", nameRu: "Кара-Кочкор", nameEn: "Kara-Kochkor", showInfo: true,
    ...createLegacyVillageSections("kara-kochkor", "Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor"),
    tagline: L("Районго кире бериште жайгашкан, жолу ыңгайлуу айыл", "Село с удобным сообщением у въезда в район", "A well-connected village near the entrance to the district"),
    intro: L(
      "Кара-Кочкор айылында 4 836 адам жана 927 кожолук жашайт. Айыл райондун кире беришине жакын жайгашып, мал чарбачылыгы жана дыйканчылык менен алектенет. Асфальт жолу, ичүүчү суусу, электр энергиясы жана интернети бар. Көчө жарыгы, тротуар жана суу агызуучу каналдар жакшыртылып, спорт зал менен жабык кичи футбол жайы курулууда.",
      "В селе Кара-Кочкор проживают 4 836 человек в 927 хозяйствах. Оно расположено у въезда в район; основные занятия - животноводство и земледелие. Есть асфальтированная дорога, питьевая вода, электричество и интернет. Улучшены освещение, тротуары и водоотводные каналы, строятся спортивный зал и крытая площадка для мини-футбола.",
      "Kara-Kochkor has 4,836 residents and 927 households. Near the district entrance, its main livelihoods are livestock and crop farming. It has an asphalt road, drinking water, electricity, and internet. Lighting, sidewalks, and drainage have improved, while a sports hall and indoor mini-football facility are under construction."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("4 836", "4 836", "4,836") }, { label: INFO_HOUSEHOLDS, value: L("927", "927", "927") },
      { label: INFO_ABOVE_SEA, value: L("1 254 м", "1 254 м", "1,254 m") }, { label: INFO_FROM_KARA_KULJA, value: L("8 км", "8 км", "8 km") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6661306, 73.4951583", "40.6661306, 73.4951583", "40.6661306, 73.4951583") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock and crop farming") },
      { label: INFO_ROAD, value: L("Асфальт жол, транспорттук байланыш жакшы", "Асфальтированная дорога, хорошее сообщение", "Asphalt road with good connections") },
      { label: INFO_UTILITIES, value: L("Ичүүчү суу, электр энергиясы жана интернет бар", "Есть питьевая вода, электричество и интернет", "Drinking water, electricity, and internet are available") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Кара-Кочкор айылы, Кара-Кулжа району", "Село Кара-Кочкор, Кара-Кульджинский район", "Kara-Kochkor village, Kara-Kulja District"), related: [],
  },
  {
    slug: "ak-kyya", name: "Ак-Кыя", nameRu: "Ак-Кыя", nameEn: "Ak-Kyya", showInfo: true,
    ...createLegacyVillageSections("ak-kyya", "Ак-Кыя", "Ак-Кыя", "Ak-Kyya"),
    tagline: L("Дарыясы, кең жайыттары жана таза абасы бар айыл", "Село с рекой, пастбищами и чистым воздухом", "A village with a river, broad pastures, and clean air"),
    intro: L(
      "Ак-Кыя айылында 2 952 адам жана 614 кожолук жашайт. Айыл район борборуна жакын, дарыянын боюнда жана кең жайыттарга жакын жайгашкан. Негизги тиричилик багыты - мал чарбачылыгы. Асфальт жолу, электр энергиясы жана интернети бар.",
      "В селе Ак-Кыя проживают 2 952 человека в 614 хозяйствах. Оно расположено недалеко от районного центра, у реки и обширных пастбищ. Основное занятие - животноводство. Есть асфальтированная дорога, электричество и интернет.",
      "Ak-Kyya has 2,952 residents and 614 households. It lies near the district centre, beside a river and broad pastures. Livestock farming is the main livelihood. It has an asphalt road, electricity, and internet."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("2 952", "2 952", "2,952") }, { label: INFO_HOUSEHOLDS, value: L("614", "614", "614") },
      { label: INFO_ABOVE_SEA, value: L("1 500 м", "1 500 м", "1,500 m") }, { label: INFO_FROM_KARA_KULJA, value: L("6 км", "6 км", "6 km") }, { label: INFO_TRAVEL_TIME, value: L("15 мүнөт", "15 минут", "15 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6669583, 73.6123333", "40.6669583, 73.6123333", "40.6669583, 73.6123333") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") }, { label: INFO_ROAD, value: L("Асфальт жол, транспорттук байланыш жакшы", "Асфальтированная дорога, хорошее сообщение", "Asphalt road with good connections") },
      { label: INFO_UTILITIES, value: L("Электр энергиясы жана интернет бар", "Есть электричество и интернет", "Electricity and internet are available") },
    ],
    history: L(
      "Айылдын негизделген так датасы белгисиз. Жергиликтүү материалда айыл мурда Көк-Жаңгак деп аталганы айтылат: тескей тарабында калың жаңгак токою өскөн. Токойдун көбү жоголгондон кийин конуш чыгыш тарабындагы ак түстүү кыяга жана жолго байланыштуу Ак-Кыя деп атала баштаган. Бүгүн жаңгак токою токой чарбасы аркылуу кайра калыбына келтирилүүдө.",
      "Точная дата основания неизвестна. Согласно местному материалу, раньше село называлось Көк-Жаңгак из-за густого орехового леса на теневой стороне. После исчезновения большей части леса его стали называть Ак-Кыя по светлому склону и дороге с восточной стороны. Сейчас ореховый лес восстанавливается лесным хозяйством.",
      "The exact establishment date is unknown. Local material says the village was formerly called Kok-Jangak because of a dense walnut forest on its shaded side. After much of it disappeared, the settlement became Ak-Kyya after the light-coloured eastern slope and road. Forestry work is now restoring the walnut forest."
    ),
    tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Ак-Кыя айылы, Кара-Кулжа району", "Село Ак-Кыя, Кара-Кульджинский район", "Ak-Kyya village, Kara-Kulja District"), related: [],
  },
  {
    slug: "sary-bulak-kara-kochkor", name: "Сары-Булак", nameRu: "Сары-Булак", nameEn: "Sary-Bulak", showInfo: true,
    ...createLegacyVillageSections("sary-bulak-kara-kochkor", "Сары-Булак", "Сары-Булак", "Sary-Bulak"),
    tagline: L("Негизги жолдун боюндагы айыл", "Село вдоль главной дороги", "A village along the main road"),
    intro: L(
      "Сары-Булак айылында 1 981 адам жана 478 кожолук жашайт. Айыл район борборуна жакын, негизги жолдун боюнда жайгашкан. Мал чарбачылыгы жана дыйканчылык өнүккөн. Кошумча скважина жана суу сактагыч аркылуу таза суу менен толук камсыздалган; асфальт жол, көчө жарыгы, тротуар жана жаңы ачык футбол аянтчасы бар.",
      "В селе Сары-Булак проживают 1 981 человек в 478 хозяйствах. Оно расположено вдоль главной дороги недалеко от районного центра. Развиты животноводство и земледелие. Дополнительная скважина и резервуар обеспечили село чистой водой; есть асфальтированная дорога, освещение, тротуары и новое открытое футбольное поле.",
      "Sary-Bulak has 1,981 residents and 478 households. It lies along the main road near the district centre. Livestock and crop farming are developed. A borehole and reservoir provide full clean-water coverage, and it has an asphalt road, lighting, sidewalks, and a new outdoor football pitch."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("1 981", "1 981", "1,981") }, { label: INFO_HOUSEHOLDS, value: L("478", "478", "478") },
      { label: INFO_ABOVE_SEA, value: L("1 300 м", "1 300 м", "1,300 m") }, { label: INFO_FROM_KARA_KULJA, value: L("4 км", "4 км", "4 km") }, { label: INFO_TRAVEL_TIME, value: L("10 мүнөт", "10 минут", "10 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6524944, 73.5406722", "40.6524944, 73.5406722", "40.6524944, 73.5406722") }, { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock and crop farming") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Сары-Булак айылы, Кара-Кулжа району", "Село Сары-Булак, Кара-Кульджинский район", "Sary-Bulak village, Kara-Kulja District"), related: [],
  },
  {
    slug: "zhany-talap", name: "Жаңы-Талап", nameRu: "Жаңы-Талап", nameEn: "Jany-Talap", showInfo: true,
    ...createLegacyVillageSections("zhany-talap", "Жаңы-Талап", "Жаңы-Талап", "Jany-Talap"),
    tagline: L("Айдоо жана мал чарбасы айкалышкан айыл", "Село земледелия и животноводства", "A village of crop and livestock farming"),
    intro: L(
      "Жаңы-Талап айылында 1 873 адам жана 365 кожолук жашайт. Негизги чарбалык багыттары - дыйканчылык жана мал чарбачылыгы. Айылга асфальт жол жетет, транспорттук байланыш жакшы; ичүүчү суу, электр энергиясы жана интернет бар. Көчө жарыгы орнотулуп, ички жолдорго шагыл төшөлгөн.",
      "В селе Жаңы-Талап проживают 1 873 человека в 365 хозяйствах. Основные направления - земледелие и животноводство. К селу ведёт асфальтированная дорога, сообщение хорошее; доступны питьевая вода, электричество и интернет. Установлено освещение, внутренние дороги покрыты гравием.",
      "Jany-Talap has 1,873 residents and 365 households. Its main livelihoods are crop and livestock farming. It has asphalt access, good connections, drinking water, electricity, and internet. Street lighting is installed and internal roads are surfaced with gravel."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("1 873", "1 873", "1,873") }, { label: INFO_HOUSEHOLDS, value: L("365", "365", "365") },
      { label: INFO_ABOVE_SEA, value: L("1 170 м", "1 170 м", "1,170 m") }, { label: INFO_FROM_KARA_KULJA, value: L("20 км", "20 км", "20 km") }, { label: INFO_TRAVEL_TIME, value: L("30 мүнөт", "30 минут", "30 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6865194, 73.4094139", "40.6865194, 73.4094139", "40.6865194, 73.4094139") }, { label: INFO_ECONOMY, value: L("Дыйканчылык жана мал чарбачылыгы", "Земледелие и животноводство", "Crop and livestock farming") },
      { label: INFO_ROAD, value: L("Асфальт жол, транспорттук байланыш жакшы", "Асфальтированная дорога, хорошее сообщение", "Asphalt road with good connections") }, { label: INFO_UTILITIES, value: L("Ичүүчү суу, электр энергиясы жана интернет бар", "Есть питьевая вода, электричество и интернет", "Drinking water, electricity, and internet are available") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Жаңы-Талап айылы, Кара-Кулжа району", "Село Жаңы-Талап, Кара-Кульджинский район", "Jany-Talap village, Kara-Kulja District"), related: [],
  },
  {
    slug: "zhiyde",
    name: "Жийде", nameRu: "Жийде", nameEn: "Jiide", showInfo: true,
    ...createLegacyVillageSections("zhiyde", "Жийде", "Жийде", "Jiide"),
    tagline: L("Өзгөн району менен чектешкен дыйканчылык айылы", "Земледельческое село на границе с Узгенским районом", "A farming village bordering Uzgen District"),
    intro: L(
      "Жийде айылында 1 244 адам жана 281 кожолук жашайт. Айыл Өзгөн району менен чектешет. Дыйканчылык жакшы өнүккөн, мал чарбачылыгы да жергиликтүү тиричиликтин негизги багыттарынын бири.",
      "В селе Жийде проживают 1 244 человека в 281 хозяйстве. Село граничит с Узгенским районом. Здесь хорошо развито земледелие, а животноводство также остаётся одним из основных занятий жителей.",
      "Jiide has 1,244 residents and 281 households. The village borders Uzgen District. Crop farming is well developed, while livestock farming is also one of the main local livelihoods."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") },
      { label: INFO_POP, value: L("1 244", "1 244", "1,244") },
      { label: INFO_HOUSEHOLDS, value: L("281", "281", "281") },
      { label: INFO_ABOVE_SEA, value: L("1 117 м", "1 117 м", "1,117 m") },
      { label: INFO_FROM_KARA_KULJA, value: L("21 км", "21 км", "21 km") },
      { label: INFO_TRAVEL_TIME, value: L("30 мүнөт", "30 минут", "30 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6723389, 73.3904500", "40.6723389, 73.3904500", "40.6723389, 73.3904500") },
      { label: INFO_ECONOMY, value: L("Дыйканчылык жана мал чарбачылыгы", "Земледелие и животноводство", "Crop and livestock farming") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] },
    people: [], gallery: [], mapNote: L("Жийде айылы, Кара-Кулжа району", "Село Жийде, Кара-Кульджинский район", "Jiide village, Kara-Kulja District"), related: [],
  },
  {
    slug: "oktyabr", name: "Октябрь", nameRu: "Октябрь", nameEn: "Oktyabr", showInfo: true,
    ...createLegacyVillageSections("oktyabr", "Октябрь", "Октябрь", "Oktyabr"),
    tagline: L("Сугат дыйканчылыгы өнүккөн айыл", "Село с развитым орошаемым земледелием", "A village with developed irrigated agriculture"),
    intro: L(
      "Октябрь айылында 2 746 адам жана 621 кожолук жашайт. Мал чарбачылыгы жана дыйканчылык негизги багыттарды түзөт. Айылдын сугат айдоо жерлери кең. Асфальт жол жаңыланып, көчө жарыгы орнотулган; спорт зал курулууда.",
      "В селе Октябрь проживают 2 746 человек в 621 хозяйстве. Основные направления - животноводство и земледелие. Село располагает значительными орошаемыми землями. Асфальтированная дорога обновлена, установлено освещение; строится спортивный зал.",
      "Oktyabr has 2,746 residents and 621 households. Livestock and crop farming are the main activities, with extensive irrigated land. Its asphalt access road is renewed and street lighting installed, while a sports hall is under construction."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("2 746", "2 746", "2,746") }, { label: INFO_HOUSEHOLDS, value: L("621", "621", "621") },
      { label: INFO_ABOVE_SEA, value: L("1 220 м", "1 220 м", "1,220 m") }, { label: INFO_FROM_KARA_KULJA, value: L("14 км", "14 км", "14 km") }, { label: INFO_TRAVEL_TIME, value: L("25 мүнөт", "25 минут", "25 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6827778, 73.4397222", "40.6827778, 73.4397222", "40.6827778, 73.4397222") }, { label: INFO_ECONOMY, value: L("Мал чарбачылыгы, дыйканчылык жана сугат дыйканчылыгы", "Животноводство, земледелие и орошаемое земледелие", "Livestock, crop farming, and irrigated agriculture") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Октябрь айылы, Кара-Кулжа району", "Село Октябрь, Кара-Кульджинский район", "Oktyabr village, Kara-Kulja District"), related: [],
  },
  {
    slug: "togotoy", name: "Тоготой", nameRu: "Тоготой", nameEn: "Togotoy", showInfo: true,
    ...createLegacyVillageSections("togotoy", "Тоготой", "Тоготой", "Togotoy"),
    tagline: L("Эс алуу жайы жана тарыхый мурасы бар айыл", "Село с зоной отдыха и историческим наследием", "A village with recreation and historical heritage"),
    intro: L(
      "Тоготой айылында 2 551 адам жана 585 кожолук жашайт. Негизги чарбалык багыттары - мал чарбачылыгы жана дыйканчылык. Айылдын жанында Тогуз-Булак эс алуу жайы жана Кара-Дарыя тарыхый-маданий мурас объектиси бар.",
      "В селе Тоготой проживает 2 551 человек в 585 хозяйствах. Основные направления - животноводство и земледелие. Рядом расположены зона отдыха Тогуз-Булак и объект историко-культурного наследия Кара-Дарья.",
      "Togotoy has 2,551 residents and 585 households. Its main livelihoods are livestock and crop farming. The Toguz-Bulak recreation area and Kara-Darya historical-cultural heritage site are nearby."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("2 551", "2 551", "2,551") }, { label: INFO_HOUSEHOLDS, value: L("585", "585", "585") },
      { label: INFO_ABOVE_SEA, value: L("1 220 м", "1 220 м", "1,220 m") }, { label: INFO_FROM_KARA_KULJA, value: L("17 км", "17 км", "17 km") }, { label: INFO_TRAVEL_TIME, value: L("25 мүнөт", "25 минут", "25 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.6650000, 73.4325000", "40.6650000, 73.4325000", "40.6650000, 73.4325000") }, { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock and crop farming") },
    ],
    history: L(
      "Кара-Дарыя шаарчасы - Тоготой айылынын жанындагы тарыхый-маданий мурас объектиси. Жергиликтүү материалда ал болжол менен биздин заманга чейинки IV-III кылымдарга таандык экени айтылат. Объектти археолог жана тарыхчы Ф. А. Заднепровский 1950-жылдары изилдеп, анын эмгеги 1960-жылы жарыяланган. Материалда шаарчанын өлчөмү болжол менен 330 х 320 метр деп көрсөтүлгөн.",
      "Городище Кара-Дарья - объект историко-культурного наследия возле села Тоготой. В местном материале оно датируется приблизительно IV-III веками до нашей эры. Объект исследовал археолог и историк Ф. А. Заднепровский в 1950-х годах; его работа была опубликована в 1960 году. Размеры составляют примерно 330 х 320 метров.",
      "The Kara-Darya settlement is a historical-cultural heritage site near Togotoy. Local material dates it approximately to the fourth-third centuries BCE. Archaeologist and historian F. A. Zadneprovskiy studied it in the 1950s, and the material refers to publication of his work in 1960. The site measures approximately 330 by 320 metres."
    ),
    tourism: { lead: L("Тогуз-Булак - Тоготой айылынын жанындагы аталышы жана координаты такталган эс алуу жайы.", "Тогуз-Булак - зона отдыха возле села Тоготой с подтверждённым названием и координатами.", "Toguz-Bulak is a named recreation area near Togotoy with a supplied verified location."), items: [] },
    investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Тоготой айылы, Кара-Кулжа району", "Село Тоготой, Кара-Кульджинский район", "Togotoy village, Kara-Kulja District"), related: [],
  },
  {
    slug: "yntymak", name: "Ынтымак", nameRu: "Ынтымак", nameEn: "Yntymak", showInfo: true,
    ...createLegacyVillageSections("yntymak", "Ынтымак", "Ынтымак", "Yntymak"),
    tagline: L("Өзгөн районуна жакын мал чарбачылык айылы", "Животноводческое село рядом с Узгенским районом", "A livestock village near Uzgen District"),
    intro: L(
      "Ынтымак айылында 757 адам жана 130 кожолук жашайт. Айыл Өзгөн району менен чектешип, Өзгөн шаарына салыштырмалуу жакын жайгашкан. Негизги тиричилик багыты - мал чарбачылыгы.",
      "В селе Ынтымак проживают 757 человек в 130 хозяйствах. Оно граничит с Узгенским районом и расположено сравнительно близко к городу Узген. Основное занятие - животноводство.",
      "Yntymak has 757 residents and 130 households. It borders Uzgen District and is comparatively close to the city of Uzgen. Livestock farming is the main livelihood."
    ),
    info: [
      { label: INFO_AIMAK, value: L("Кара-Кочкор", "Кара-Кочкор", "Kara-Kochkor") }, { label: INFO_POP, value: L("757", "757", "757") }, { label: INFO_HOUSEHOLDS, value: L("130", "130", "130") },
      { label: INFO_ABOVE_SEA, value: L("1 144 м", "1 144 м", "1,144 m") }, { label: INFO_FROM_KARA_KULJA, value: L("23 км", "23 км", "23 km") }, { label: INFO_TRAVEL_TIME, value: L("30 мүнөт", "30 минут", "30 minutes") },
      { label: INFO_VILLAGE_COORDINATES, value: L("40.7109361, 73.4145444", "40.7109361, 73.4145444", "40.7109361, 73.4145444") }, { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
    ],
    history: L("", "", ""), tourism: { lead: L("", "", ""), items: [] }, investment: { lead: L("", "", ""), items: [] }, people: [], gallery: [],
    mapNote: L("Ынтымак айылы, Кара-Кулжа району", "Село Ынтымак, Кара-Кульджинский район", "Yntymak village, Kara-Kulja District"), related: [],
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
    slug: "zhele-dobo",
    name: "Желе-Дөбө",
    nameRu: "Желе-Дөбө",
    nameEn: "Zhele-Dobo",
    showInfo: true,
    ...createLegacyVillageSections("zhele-dobo", "Желе-Дөбө", "Желе-Дөбө", "Zhele-Dobo"),
    tagline: L(
      "Көк-Арттын чыгышындагы чакан бийик тоолуу айыл",
      "Небольшое высокогорное село к востоку от Көк-Арта",
      "A small high-altitude village east of Kok-Art",
    ),
    intro: L(
      "Желе-Дөбө - Көк-Арттан болжол менен 3 км чыгышта жайгашкан чакан бийик тоолуу айыл. 2019-жылы айыл макамы берилген конушта 237 адам жана 50 кожолук бар. Тоолуу чөйрөдөгү жергиликтүү жашоонун негизин мал чарбачылыгы түзөт.",
      "Желе-Дөбө - небольшое высокогорное село примерно в 3 км к востоку от Көк-Арта. Поселение получило статус села в 2019 году, здесь проживают 237 человек и насчитывается 50 хозяйств. Основу местной жизни в горной среде составляет животноводство.",
      "Zhele-Dobo is a small high-altitude village approximately 3 km east of Kok-Art. The settlement received village status in 2019 and has a population of 237 with 50 households. Livestock farming forms the basis of local life in its mountain setting.",
    ),
    info: [
      { label: INFO_POP, value: L("237", "237", "237") },
      { label: INFO_HOUSEHOLDS, value: L("50", "50", "50") },
      { label: INFO_ABOVE_SEA, value: L("2 403 м", "2 403 м", "2,403 m") },
      { label: L("Айыл макамы берилген жыл", "Год получения статуса села", "Village status granted"), value: L("2019", "2019", "2019") },
      { label: INFO_LOC, value: L("Көк-Арттан болжол менен 3 км чыгышта", "Примерно в 3 км к востоку от Көк-Арта", "Approximately 3 km east of Kok-Art") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
      { label: L("Билим берүү жана медицина", "Образование и медицина", "Education and healthcare"), value: L("Айылда мектеп, бала бакча жана ФАП жок, окуучулар Көк-Арттагы мектепке барышат", "В селе нет школы, детского сада и ФАП, ученики посещают школу в Көк-Арте", "The village has no school, kindergarten, or FAP, and pupils attend school in Kok-Art") },
    ],
    history: L(
      "Желе-Дөбөгө 2019-жылы айыл макамы берилген. Конушту пландоо жана башкы план боюнча иштер материалдарда белгиленет. Мал чарбачылыгы айылдын негизги тиричилик багыты бойдон калууда.",
      "Желе-Дөбө получил статус села в 2019 году. В материалах упоминаются планирование поселения и работа над генеральным планом. Животноводство остаётся основным направлением местной жизни.",
      "Zhele-Dobo received village status in 2019. The source materials mention settlement planning and work on a general plan. Livestock farming remains the village's main livelihood.",
    ),
    tourism: {
      lead: L(
        "Бийик тоолуу көрүнүштөр, тынч айыл чөйрөсү, жайлоо туризми, атчан саякат, жаратылышты сүрөткө тартуу жана салттуу мал чарба турмушу Желе-Дөбөнүн келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Высокогорные пейзажи, спокойная сельская среда, джайлоо-туризм, конные путешествия, природная фотография и традиционный животноводческий уклад формируют будущий туристический потенциал Желе-Дөбө.",
        "High-altitude landscapes, a quiet rural setting, jailoo tourism, horseback travel, nature photography, and traditional livestock life form Zhele-Dobo's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, айылдык конок жайлары, чакан туристтик кызматтар жана жергиликтүү кызмат көрсөтүү ишканалары инвестициялык мүмкүнчүлүк катары каралат.",
        "Животноводство, сельское гостевое размещение, небольшие туристические услуги и местные сервисные предприятия рассматриваются как инвестиционный потенциал.",
        "Livestock farming, rural guest accommodation, small tourism services, and local service businesses are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Желе-Дөбө, Алайку аймагы", "Желе-Дөбө, аймак Алайку", "Zhele-Dobo, Alaykuu"),
    related: [],
  },
  {
    slug: "kan-korgon",
    name: "Кан-Коргон",
    nameRu: "Кан-Коргон",
    nameEn: "Kan-Korgon",
    showInfo: true,
    ...createLegacyVillageSections("kan-korgon", "Кан-Коргон", "Кан-Коргон", "Kan-Korgon"),
    tagline: L(
      "Алайку өрөөнүндөгү бийик тоолуу мал чарба айылы",
      "Высокогорное животноводческое село в долине Алайку",
      "A high-altitude livestock village in the Alaykuu Valley",
    ),
    intro: L(
      "Кан-Коргон - Алайку суусуна жакын жайгашкан бийик тоолуу айыл. Айылда 2 080 адам жашап, 329 кожолук бар. Жылкы, кой-эчки жана бодо мал багуу, эт жана сүт өндүрүү, жайыттарды пайдалануу жана чөп даярдоо жергиликтүү экономиканын негизги багыттарын түзөт.",
      "Кан-Коргон - высокогорное село, расположенное недалеко от реки Алайку. Здесь проживают 2 080 человек и насчитывается 329 хозяйств. Коневодство, разведение овец, коз и крупного скота, производство мяса и молока, пастбищное животноводство и заготовка сена составляют основные направления местной экономики.",
      "Kan-Korgon is a high-altitude village near the Alaykuu River. It has a population of 2,080 and 329 households. Horse, sheep, goat, and cattle farming, meat and milk production, pasture-based livestock farming, and hay preparation shape the local economy.",
    ),
    info: [
      { label: INFO_POP, value: L("2 080", "2 080", "2,080") },
      { label: INFO_HOUSEHOLDS, value: L("329", "329", "329") },
      { label: INFO_ABOVE_SEA, value: L("болжол менен 2 291 м", "примерно 2 291 м", "approximately 2,291 m") },
      { label: INFO_LOC, value: L("Алайку өрөөнүндө, Алайку суусуна жакын", "В долине Алайку, недалеко от реки Алайку", "In the Alaykuu Valley near the Alaykuu River") },
      { label: L("Кара-Кулжадан түз сызык боюнча", "От Кара-Кульджи по прямой линии", "Straight-line reference from Kara-Kulja"), value: L("болжол менен 70 км", "примерно 70 км", "approximately 70 km") },
      { label: INFO_FORMER_NAME, value: L("XXII Партсъезд", "XXII Партсъезд", "XXII Party Congress") },
      { label: INFO_ECONOMY, value: L("Жылкы, кой-эчки жана бодо мал багуу, эт жана сүт өндүрүү, жайыт мал чарбачылыгы, чөп даярдоо", "Коневодство, разведение овец, коз и крупного скота, производство мяса и молока, пастбищное животноводство, заготовка сена", "Horse, sheep, goat, and cattle farming, meat and milk production, pasture livestock farming, and hay preparation") },
      { label: L("Билим берүү", "Образование", "Education"), value: L("Жусуп Мамыр атындагы орто мектеп, 2024-жылы ачылган 225 орундуу жаңы мектеп, Кан-Коргон бала бакчасы", "Средняя школа имени Жусупа Мамыра, новая школа на 225 мест, открытая в 2024 году, детский сад Кан-Коргон", "Jusup Mamyr Secondary School, a new 225-seat school opened in 2024, and Kan-Korgon Kindergarten") },
      { label: INFO_MEDICAL, value: L("Кан-Коргон ФАПы", "ФАП Кан-Коргон", "Kan-Korgon FAP") },
      { label: L("Маалыматтык кызмат", "Информационная служба", "Information service"), value: L("Кан-Коргон маалыматтык борбору", "Информационный центр Кан-Коргон", "Kan-Korgon Information Centre") },
    ],
    history: L(
      "Айыл мурда XXII Партсъезд деп аталып, Кан-Коргон аталышы 2002-жылы берилген. Анын тарыхы Алайку өрөөнүнүн бийик тоолуу жайыттары жана мал чарба турмушу менен байланышкан. Жергиликтүү оозеки уламыштарда аталыш мурдагы калмак ханынын коргону менен байланыштырылып, Кара-Сакал жанындагы үңкүр жана андагы тамчылаган суу ыйык жер катары айтылат, бирок бул баяндар академиялык жактан тастыкталган тарых эмес.",
      "Ранее село называлось XXII Партсъезд, а название Кан-Коргон было присвоено в 2002 году. Его история связана с высокогорными пастбищами и животноводческим укладом долины Алайку. В местных устных преданиях название связывают с укреплением бывшего калмыцкого хана, а пещеру возле Кара-Сакала и капающую в ней воду считают священным местом, однако эти рассказы не являются академически подтверждённой историей.",
      "The village was formerly called XXII Party Congress and received the name Kan-Korgon in 2002. Its history is connected with the high-altitude pastures and livestock culture of the Alaykuu Valley. Local oral traditions link the name to a former Kalmyk khan's fortification and describe a cave near Kara-Sakal with dripping water as sacred, but these accounts are not academically verified history.",
    ),
    tourism: {
      lead: L(
        "Атчан саякат, жайлоо туризми, кымыз, салттуу тамак-аш, улуттук оюндар, тоолуу көрүнүштөр жана жергиликтүү оозеки тарых Кан-Коргондун келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Конные путешествия, джайлоо-туризм, кумыс, традиционная кухня, национальные игры, горные пейзажи и местная устная история формируют будущий туристический потенциал Кан-Коргона.",
        "Horseback travel, jailoo tourism, kumys, traditional food, national games, mountain landscapes, and local oral history form Kan-Korgon's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарба продукциясын жана этти кайра иштетүү, сүт жана кымыз өндүрүү, айылдык туризм, конок жайлар, жергиликтүү тамак-аш жана кызматтар инвестициялык мүмкүнчүлүк катары каралат.",
        "Переработка животноводческой и мясной продукции, производство молока и кумыса, сельский туризм, гостевое размещение, местные продукты питания и услуги рассматриваются как инвестиционный потенциал.",
        "Livestock and meat processing, dairy and kumys production, rural tourism, guest accommodation, local food products, and services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Кан-Коргон, Алайку аймагы", "Кан-Коргон, аймак Алайку", "Kan-Korgon, Alaykuu"),
    related: [],
  },
  {
    slug: "sai-talaa",
    name: "Сай-Талаа",
    nameRu: "Сай-Талаа",
    nameEn: "Sai-Talaa",
    showInfo: true,
    ...createLegacyVillageSections("sai-talaa", "Сай-Талаа", "Сай-Талаа", "Sai-Talaa"),
    tagline: L(
      "Алайку суусуна жакын бийик тоолуу айыл",
      "Высокогорное село у реки Алайку",
      "A high-altitude village near the Alaykuu River",
    ),
    intro: L(
      "Сай-Талаа - Алайку өрөөнүндө, Алайку суусуна жакын жайгашкан бийик тоолуу айыл. 2003-жылдан бери өзүнчө айыл макамына ээ. Жергиликтүү экономика мал чарбачылыгына таянып, жылкы багуу, кымыз жана сүт азыктарын өндүрүү үчүн табигый мүмкүнчүлүктөр бар.",
      "Сай-Талаа - высокогорное село в долине Алайку, расположенное недалеко от реки Алайку. С 2003 года оно имеет статус отдельного села. Местная экономика опирается на животноводство, а природные условия создают потенциал для коневодства, производства кумыса и молочной продукции.",
      "Sai-Talaa is a high-altitude village in the Alaykuu Valley near the Alaykuu River. It has held separate village status since 2003. The local economy is based on livestock farming, with natural potential for horse breeding, kumys, and dairy production.",
    ),
    info: [
      { label: L("Айыл макамы берилген жыл", "Год получения статуса села", "Village status granted"), value: L("2003", "2003", "2003") },
      { label: INFO_LOC, value: L("Алайку өрөөнүндө, Алайку суусуна жакын", "В долине Алайку, недалеко от реки Алайку", "In the Alaykuu Valley near the Alaykuu River") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
      { label: L("Билим берүү", "Образование", "Education"), value: L("Сооронбай Жусуев атындагы орто мектеп, Биби Нур бала бакчасы", "Средняя школа имени Сооронбая Жусуева, детский сад Биби Нур", "Sooronbay Jusuev Secondary School and Bibi Nur Kindergarten") },
      { label: L("Спорт", "Спорт", "Sport"), value: L("Жабык спорттук аянтча", "Крытая спортивная площадка", "Indoor sports ground") },
      { label: L("Жергиликтүү экономика", "Местная экономика", "Local economy"), value: L("«Алайку» сүт цехи", "Молочный цех «Алайку»", "Alaykuu milk workshop") },
    ],
    history: L(
      "Сай-Талаага 2003-жылы өзүнчө айыл макамы берилген. Айыл Алайку өрөөнүндөгү суу боюнда жайгашып, жергиликтүү тиричилик мал чарбачылыгы менен байланышкан.",
      "Сай-Талаа получил статус отдельного села в 2003 году. Село расположено у реки в долине Алайку, а местная жизнь связана с животноводством.",
      "Sai-Talaa received separate village status in 2003. The village lies by the river in the Alaykuu Valley, and local life is connected with livestock farming.",
    ),
    tourism: {
      lead: L(
        "Дарыя өрөөнүнүн көрүнүштөрү, жайлоо, атчан саякат, кымыз, салттуу мал чарба турмушу жана жаратылыш туризми Сай-Талаанын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Пейзажи речной долины, джайлоо, конные путешествия, кумыс, традиционный животноводческий уклад и природный туризм формируют будущий туристический потенциал Сай-Талаа.",
        "River-valley landscapes, jailoo, horseback travel, kumys, traditional livestock life, and nature tourism form Sai-Talaa's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, сүттү кайра иштетүү, кымыз жана сүт азыктары, айылдык туризм жана жергиликтүү кызматтар инвестициялык мүмкүнчүлүк катары каралат.",
        "Животноводство, переработка молока, производство кумыса и молочной продукции, сельский туризм и местные услуги рассматриваются как инвестиционный потенциал.",
        "Livestock farming, milk processing, kumys and dairy products, rural tourism, and local services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Сай-Талаа, Алайку аймагы", "Сай-Талаа, аймак Алайку", "Sai-Talaa, Alaykuu"),
    related: [],
  },
  {
    slug: "chychyrkanak",
    name: "Чычырганак",
    nameRu: "Чычырганак",
    nameEn: "Chychyrganak",
    showInfo: false,
    ...createLegacyVillageSections("chychyrkanak", "Чычырганак", "Чычырганак", "Chychyrganak"),
    tagline: L(
      "Алайку айыл аймагындагы айыл",
      "Село айыл аймака Алайку",
      "A village of Alaykuu Aiyl Aimak",
    ),
    intro: L(
      "Чычырганак - Алайку айыл аймагынын расмий курамындагы 12 айылдын бири.",
      "Чычырганак - одно из 12 сёл, официально входящих в айыл аймак Алайку.",
      "Chychyrganak is one of the 12 villages officially included in Alaykuu Aiyl Aimak.",
    ),
    info: [],
    history: L("", "", ""),
    tourism: { lead: L("", "", ""), items: [] },
    investment: { lead: L("", "", ""), items: [] },
    people: [],
    gallery: [],
    mapNote: L("Чычырганак, Алайку аймагы", "Чычырганак, аймак Алайку", "Chychyrganak, Alaykuu"),
    related: [],
  },

  {
    slug: "kyzyl-zhar",
    name: "Кызыл-Жар",
    nameRu: "Кызыл-Жар",
    nameEn: "Kyzyl-Zhar",
    showInfo: true,
    ...createLegacyVillageSections("kyzyl-zhar", "Кызыл-Жар", "Кызыл-Жар", "Kyzyl-Zhar"),
    tagline: L(
      "Алайкунун түштүгүндөгү бийик тоолуу айыл",
      "Высокогорное село на юге Алайку",
      "A high-altitude village in southern Alaykuu",
    ),
    intro: L(
      "Кызыл-Жар - Алайку айыл аймагынын түштүк бөлүгүндөгү бийик тоолуу айыл. Айылда 682 адам жашап, 115 кожолук бар. Тоолуу шартта жергиликтүү турмуштун негизин мал чарбачылыгы жана дыйканчылык түзөт.",
      "Кызыл-Жар - высокогорное село в южной части айыл аймака Алайку. Здесь проживают 682 человека и насчитывается 115 хозяйств. Основу местной жизни в горных условиях составляют животноводство и земледелие.",
      "Kyzyl-Zhar is a high-altitude village in the southern part of Alaykuu Aiyl Aimak. It has a population of 682 and 115 households. Livestock and crop farming form the basis of local life in its mountain setting.",
    ),
    info: [
      { label: INFO_POP, value: L("682", "682", "682") },
      { label: INFO_HOUSEHOLDS, value: L("115", "115", "115") },
      { label: INFO_ABOVE_SEA, value: L("2 200 м", "2 200 м", "2,200 m") },
      { label: INFO_LOC, value: L("Алайку айыл аймагынын түштүк бөлүгү", "Южная часть айыл аймака Алайку", "Southern Alaykuu Aiyl Aimak") },
      { label: L("Ош шаарынан аралык", "Расстояние от Оша", "Distance from Osh"), value: L("210 км", "210 км", "210 km") },
      { label: L("Кара-Суу темир жол станциясынан аралык", "Расстояние от железнодорожной станции Кара-Суу", "Distance from Kara-Suu railway station"), value: L("203 км", "203 км", "203 km") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
    ],
    history: L(
      "Кызыл-Жар аймагы мурда сезондук мал чарбачылыгы үчүн пайдаланылып, туруктуу конуш бара-бара калыптанган. Совет мезгилинде жамааттык айыл чарба өнүгүп, кийин электр, байланыш жана башка инфраструктура кеңейген. Электр инфраструктурасы 1979-1980-жылдары жетип, мобилдик байланыш жана интернет 2009-2010-жылдары өнүгө баштаган, ал эми ичүүчү суу инфраструктурасы 2022-жылы киргизилген.",
      "Территория Кызыл-Жара прежде использовалась для сезонного животноводства, а постоянное поселение формировалось постепенно. В советский период развивалось коллективное сельское хозяйство, позднее расширялись электрическая, коммуникационная и другая инфраструктура. Электричество появилось примерно в 1979-1980 годах, мобильная связь и интернет начали развиваться в 2009-2010 годах, а инфраструктура питьевого водоснабжения была введена в 2022 году.",
      "The Kyzyl-Zhar area was once used for seasonal livestock farming, and permanent settlement developed gradually. Collective agriculture expanded during the Soviet period, followed by electricity, communications, and other infrastructure. Electricity arrived around 1979-1980, mobile and internet connectivity began developing around 2009-2010, and drinking-water infrastructure was introduced in 2022.",
    ),
    tourism: {
      lead: L(
        "Бийик тоолуу көрүнүштөр, жайлоо жашоосу, атчан саякат, салттуу айыл турмушу жана жаратылышты сүрөткө тартуу Кызыл-Жардын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Высокогорные пейзажи, жизнь на джайлоо, конные путешествия, традиционный сельский уклад и природная фотография формируют будущий туристический потенциал Кызыл-Жара.",
        "High-altitude landscapes, jailoo life, horseback travel, traditional rural life, and nature photography form Kyzyl-Zhar's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, эт жана сүттү кайра иштетүү, айылдык меймандостук, жергиликтүү айыл чарба продукциясы жана туристтик кызматтар инвестициялык мүмкүнчүлүк катары каралат.",
        "Животноводство, переработка мяса и молока, сельское гостеприимство, местная сельскохозяйственная продукция и туристические услуги рассматриваются как инвестиционный потенциал.",
        "Livestock, meat and dairy processing, rural hospitality, local agricultural products, and tourism services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Кызыл-Жар, Алайку аймагы", "Кызыл-Жар, аймак Алайку", "Kyzyl-Zhar, Alaykuu"),
    related: [],
  },
  {
    slug: "kok-art",
    name: "Көк-Арт",
    nameRu: "Көк-Арт",
    nameEn: "Kok-Art",
    showInfo: true,
    ...createLegacyVillageSections("kok-art", "Көк-Арт", "Көк-Арт", "Kok-Art"),
    tagline: L(
      "Кытай чек арасына жакын бийик тоолуу айыл",
      "Высокогорное село вблизи границы с Китаем",
      "A high-altitude village near the China border",
    ),
    intro: L(
      "Көк-Арт - Алайкунун чыгышындагы, Кытай чек арасына жакын Сөөк жана Көк-Арт сууларынын аймагында жайгашкан бийик тоолуу айыл. Айылда 2 487 адам жашайт. Таза тоо чөйрөсү, кең жайыттары жана жылкы, кымыз, сүт азыктары менен байланышкан мал чарба салттары жергиликтүү жашоонун өзөгүн түзөт.",
      "Көк-Арт - высокогорное село на востоке Алайку, расположенное в районе рек Сөөк и Көк-Арт недалеко от границы с Китаем. Здесь проживают 2 487 человек. Чистая горная среда, просторные пастбища и животноводческие традиции, связанные с лошадьми, кумысом и молочной продукцией, составляют основу местной жизни.",
      "Kok-Art is a high-altitude village in eastern Alaykuu, around the Sook and Kok-Art rivers near the China border. It has a population of 2,487. Its clean mountain environment, broad pastures, and livestock traditions linked to horses, kumys, and dairy products shape local life.",
    ),
    info: [
      { label: INFO_POP, value: L("2 487", "2 487", "2,487") },
      { label: INFO_ABOVE_SEA, value: L("2 400 м", "2 400 м", "2,400 m") },
      { label: INFO_LOC, value: L("Алайкунун чыгышында, Сөөк жана Көк-Арт сууларынын аймагында, Кытай чек арасына жакын", "На востоке Алайку, в районе рек Сөөк и Көк-Арт, недалеко от границы с Китаем", "Eastern Alaykuu, around the Sook and Kok-Art rivers near the China border") },
      { label: L("Кара-Кулжа айылынан аралык", "Расстояние от села Кара-Кульджа", "Distance from Kara-Kulja village"), value: L("болжол менен 122 км", "примерно 122 км", "approximately 122 km") },
      { label: L("Ош шаарынан аралык", "Расстояние от Оша", "Distance from Osh"), value: L("болжол менен 222 км", "примерно 222 км", "approximately 222 km") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы, жылкы багуу, кымыз, сүт азыктары жана тоют өндүрүү", "Животноводство, коневодство, кумыс, молочная продукция и производство кормов", "Livestock farming, horse breeding, kumys, dairy products, and fodder production") },
      { label: L("Билим берүү", "Образование", "Education"), value: L("Жутаң Субанов атындагы орто мектеп, Токтомаметов Даткабек атындагы бала бакча", "Средняя школа имени Жутана Субанова, детский сад имени Даткабека Токтомаметова", "Jutan Subanov Secondary School and Datkabek Toktomametov Kindergarten") },
      { label: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"), value: L("Райымкулов Тагай атындагы ФАП", "ФАП имени Тагая Райымкулова", "Tagai Raiymkulov FAP") },
      { label: L("Маданият", "Культура", "Culture"), value: L("Касымакунов Моңолбай атындагы китепкана", "Библиотека имени Монолбая Касымакунова", "Monolbai Kasymakunov Library") },
      { label: L("Спорт", "Спорт", "Sport"), value: L("Сыдыков Койгелди атындагы спорт зал, Токтошев Кылычбек атындагы стадион, ат майдан", "Спортивный зал имени Койгелди Сыдыкова, стадион имени Кылычбека Токтошева, ипподром", "Koigeldi Sydykov Sports Hall, Kylychbek Toktoshev Stadium, and a horse-racing ground") },
      { label: L("Жергиликтүү кызматтар", "Местные услуги", "Local services"), value: L("Дүкөндөр жана мончо", "Магазины и баня", "Shops and a bathhouse") },
    ],
    history: L(
      "Көк-Арт аймагы Алайку өрөөнүндөгү узак мезгилдүү жайыт пайдалануу салты менен байланышкан. Совет мезгилинде жамааттык айыл чарба уюштурулуп, 1990-жылдардагы реформалардан кийин чарбалар жаңы шарттарга өткөн. Бүгүн айылдын экономикасында мал чарбачылыгы негизги орунду сактап келет.",
      "История Көк-Арта связана с давней традицией пастбищного использования долины Алайку. В советский период было организовано коллективное сельское хозяйство, а после реформ 1990-х годов хозяйства перешли к новым условиям. Животноводство продолжает занимать основное место в экономике села.",
      "Kok-Art is connected with the Alaykuu Valley's long tradition of pastoral use. Collective agriculture was organized during the Soviet period, and farms adapted to new conditions after the reforms of the 1990s. Livestock farming continues to lead the village economy.",
    ),
    tourism: {
      lead: L(
        "Тоолуу көрүнүштөр, дарыялар, жайлоо, жылкы маданияты, кымыз, салттуу кыргыз айыл турмушу жана жаратылышты сүрөткө тартуу Көк-Арттын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Горные пейзажи, реки, джайлоо, культура коневодства, кумыс, традиционная кыргызская сельская жизнь и природная фотография формируют будущий туристический потенциал Көк-Арта.",
        "Mountain landscapes, rivers, jailoo, horse culture, kumys, traditional Kyrgyz village life, and nature photography form Kok-Art's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарба продукциясын кайра иштетүү, сүт жана кымыз азыктары, жергиликтүү бренд, айылдык меймандостук, атчан туризм жана жол боюндагы кызматтар инвестициялык мүмкүнчүлүк катары каралат.",
        "Переработка животноводческой продукции, молочные продукты и кумыс, местный бренд, сельское гостеприимство, конный туризм и придорожные услуги рассматриваются как инвестиционный потенциал.",
        "Livestock processing, dairy and kumys products, local branding, rural hospitality, horseback tourism, and roadside services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Көк-Арт, Алайку аймагы", "Көк-Арт, аймак Алайку", "Kok-Art, Alaykuu"),
    related: [],
  },
  {
    slug: "ara-bulak",
    name: "Ара-Булак",
    nameRu: "Ара-Булак",
    nameEn: "Ara-Bulak",
    showInfo: true,
    ...createLegacyVillageSections("ara-bulak", "Ара-Булак", "Ара-Булак", "Ara-Bulak"),
    tagline: L(
      "Көк-Арттын түндүгүндөгү чакан бийик тоолуу айыл",
      "Небольшое высокогорное село к северу от Көк-Арта",
      "A small high-altitude village north of Kok-Art",
    ),
    intro: L(
      "Ара-Булак - Көк-Арттан болжол менен 8 км түндүктө жайгашкан чакан бийик тоолуу айыл. 2019-жылы айыл макамы берилген конушта 177 адам жана 40 кожолук бар. Тоо шартындагы жергиликтүү жашоо негизинен мал чарбачылыгына таянат.",
      "Ара-Булак - небольшое высокогорное село примерно в 8 км к северу от Көк-Арта. Поселение получило статус села в 2019 году, здесь проживают 177 человек и насчитывается 40 хозяйств. Местная жизнь в горной среде опирается преимущественно на животноводство.",
      "Ara-Bulak is a small high-altitude village approximately 8 km north of Kok-Art. The settlement received village status in 2019 and has a population of 177 with 40 households. Local life in its mountain setting is based mainly on livestock farming.",
    ),
    info: [
      { label: INFO_POP, value: L("177", "177", "177") },
      { label: INFO_HOUSEHOLDS, value: L("40", "40", "40") },
      { label: INFO_ABOVE_SEA, value: L("2 579 м", "2 579 м", "2,579 m") },
      { label: L("Айыл макамы берилген жыл", "Год получения статуса села", "Village status granted"), value: L("2019", "2019", "2019") },
      { label: INFO_LOC, value: L("Көк-Арттан болжол менен 8 км түндүктө", "Примерно в 8 км к северу от Көк-Арта", "Approximately 8 km north of Kok-Art") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
      { label: L("Билим берүү жана медицина", "Образование и медицина", "Education and healthcare"), value: L("Айылда мектеп, бала бакча жана ФАП жок, окуучулар Көк-Арттагы мектепке барышат", "В селе нет школы, детского сада и ФАП, ученики посещают школу в Көк-Арте", "The village has no school, kindergarten, or FAP, and pupils attend school in Kok-Art") },
    ],
    history: L(
      "Ара-Булакка 2019-жылы айыл макамы берилген. Конушту пландоо жана башкы план боюнча иштер материалдарда белгиленет. Айылдын негизги тиричилик багыты мал чарбачылыгы бойдон калууда.",
      "Ара-Булак получил статус села в 2019 году. В материалах упоминаются планирование поселения и работа над генеральным планом. Животноводство остаётся основным направлением местной жизни.",
      "Ara-Bulak received village status in 2019. The source materials mention settlement planning and work on a general plan. Livestock farming remains the village's main livelihood.",
    ),
    tourism: {
      lead: L(
        "Алыскы бийик тоолуу көрүнүштөр, тынч айыл чөйрөсү, жайлоо туризми, атчан саякат жана жаратылышты сүрөткө тартуу Ара-Булактын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Удалённые высокогорные пейзажи, спокойная сельская среда, джайлоо-туризм, конные путешествия и природная фотография формируют будущий туристический потенциал Ара-Булака.",
        "Remote high-altitude landscapes, a quiet rural experience, jailoo tourism, horseback travel, and nature photography form Ara-Bulak's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Айылдык меймандостук, чакан туристтик кызматтар, мал чарбачылыгы жана жергиликтүү кызматтар келечектеги инвестициялык мүмкүнчүлүктөргө кирет.",
        "Сельское гостеприимство, небольшие туристические услуги, животноводство и местные сервисы относятся к потенциальным направлениям для инвестиций.",
        "Rural hospitality, small tourism services, livestock farming, and local services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Ара-Булак, Алайку аймагы", "Ара-Булак, аймак Алайку", "Ara-Bulak, Alaykuu"),
    related: [],
  },
  {
    slug: "boru-tokoy",
    name: "Бөрү-Токой",
    nameRu: "Бөрү-Токой",
    nameEn: "Boru-Tokoi",
    showInfo: true,
    ...createLegacyVillageSections("boru-tokoy", "Бөрү-Токой", "Бөрү-Токой", "Boru-Tokoi"),
    tagline: L(
      "Көк-Арттын батышындагы чакан бийик тоолуу айыл",
      "Небольшое высокогорное село к западу от Көк-Арта",
      "A small high-altitude village west of Kok-Art",
    ),
    intro: L(
      "Бөрү-Токой - Көк-Арттан болжол менен 7,5 км батышта жайгашкан чакан бийик тоолуу айыл. 2019-жылы айыл макамы берилген конушта 177 адам жана 40 кожолук бар. Тоолуу чөйрөдө жергиликтүү жашоонун негизин мал чарбачылыгы түзөт.",
      "Бөрү-Токой - небольшое высокогорное село примерно в 7,5 км к западу от Көк-Арта. Поселение получило статус села в 2019 году, здесь проживают 177 человек и насчитывается 40 хозяйств. Основу местной жизни в горной среде составляет животноводство.",
      "Boru-Tokoi is a small high-altitude village approximately 7.5 km west of Kok-Art. The settlement received village status in 2019 and has a population of 177 with 40 households. Livestock farming forms the basis of local life in its mountain setting.",
    ),
    info: [
      { label: INFO_POP, value: L("177", "177", "177") },
      { label: INFO_HOUSEHOLDS, value: L("40", "40", "40") },
      { label: INFO_ABOVE_SEA, value: L("2 250 м", "2 250 м", "2,250 m") },
      { label: L("Айыл макамы берилген жыл", "Год получения статуса села", "Village status granted"), value: L("2019", "2019", "2019") },
      { label: INFO_LOC, value: L("Көк-Арттан болжол менен 7,5 км батышта", "Примерно в 7,5 км к западу от Көк-Арта", "Approximately 7.5 km west of Kok-Art") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы", "Животноводство", "Livestock farming") },
      { label: L("Билим берүү", "Образование", "Education"), value: L("Башталгыч мектеп, жогорку класстын окуучулары Кан-Коргондогу мектепке барышат", "Начальная школа, ученики старших классов посещают школу в Кан-Коргоне", "Primary school, with pupils above primary grades attending school in Kan-Korgon") },
      { label: INFO_MEDICAL, value: L("ФАП", "ФАП", "FAP") },
    ],
    history: L(
      "Бөрү-Токойго 2019-жылы айыл макамы берилген. Конушту пландоо жана башкы план боюнча иштер материалдарда белгиленет. Мал чарбачылыгы айылдын негизги тиричилик багыты бойдон калууда.",
      "Бөрү-Токой получил статус села в 2019 году. В материалах упоминаются планирование поселения и работа над генеральным планом. Животноводство остаётся основным направлением местной жизни.",
      "Boru-Tokoi received village status in 2019. The source materials mention settlement planning and work on a general plan. Livestock farming remains the village's main livelihood.",
    ),
    tourism: {
      lead: L(
        "Тоолуу көрүнүштөр, жайлоо туризми, атчан саякат, салттуу мал чарба турмушу жана жаратылыш туризми Бөрү-Токойдун келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Горные пейзажи, джайлоо-туризм, конные путешествия, традиционный животноводческий уклад и природный туризм формируют будущий туристический потенциал Бөрү-Токоя.",
        "Mountain scenery, jailoo tourism, horseback travel, traditional livestock life, and nature tourism form Boru-Tokoi's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, айылдык конок жайлары, жергиликтүү туристтик кызматтар жана чакан кызмат көрсөтүү ишканалары инвестициялык мүмкүнчүлүк катары каралат.",
        "Животноводство, сельское гостевое размещение, местные туристические услуги и малые сервисные предприятия рассматриваются как инвестиционный потенциал.",
        "Livestock farming, rural accommodation, local tourism services, and small local service businesses are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Бөрү-Токой, Алайку аймагы", "Бөрү-Токой, аймак Алайку", "Boru-Tokoi, Alaykuu"),
    related: [],
  },

  {
    slug: "koo-chaty",
    name: "Коо-Чаты",
    nameRu: "Коо-Чаты",
    nameEn: "Koo-Chaty",
    showInfo: true,
    ...createLegacyVillageSections("koo-chaty", "Коо-Чаты", "Коо-Чаты", "Koo-Chaty"),
    tagline: L(
      "Алайку өрөөнүнүн чыгышындагы бийик тоолуу айыл",
      "Высокогорное село на востоке долины Алайку",
      "A high-altitude village in the eastern Alaykuu Valley",
    ),
    intro: L(
      "Коо-Чаты - Алайку айыл аймагынын чыгыш тарабында жайгашкан бийик тоолуу айыл. 2025-жылдагы маалымат боюнча айылда 2 106 адам жашап, 497 кожолук бар. Калктын негизги тиричилиги мал чарбачылыгы жана дыйканчылык менен байланышкан.",
      "Коо-Чаты - высокогорное село в восточной части айыл аймака Алайку. По данным за 2025 год, здесь проживают 2 106 человек и насчитывается 497 хозяйств. Основные занятия жителей связаны с животноводством и земледелием.",
      "Koo-Chaty is a high-altitude village in the eastern part of Alaykuu Aiyl Aimak. According to 2025 data, it has a population of 2,106 and 497 households. The main local livelihoods are livestock and crop farming.",
    ),
    info: [
      { label: INFO_POP, value: L("2 106", "2 106", "2,106") },
      { label: INFO_HOUSEHOLDS, value: L("497", "497", "497") },
      { label: INFO_ABOVE_SEA, value: L("2 300 м", "2 300 м", "2,300 m") },
      { label: INFO_LOC, value: L("Алайку айыл аймагынын чыгыш тарабы", "Восточная часть айыл аймака Алайку", "Eastern Alaykuu Aiyl Aimak") },
      { label: L("Ош шаарынан аралык", "Расстояние от Оша", "Distance from Osh"), value: L("211 км", "211 км", "211 km") },
      { label: L("Кара-Суу темир жол станциясынан аралык", "Расстояние от железнодорожной станции Кара-Суу", "Distance from Kara-Suu railway station"), value: L("200 км", "200 км", "200 km") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
      {
        label: L("Билим берүү", "Образование", "Education"),
        value: L(
          "Сагындык атындагы орто мектеби, Айдың-Көл орто мектеби, «Үмүт-Нуру» мектепке чейинки билим берүү уюму, К. Калдарова атындагы балдар жана өспүрүмдөр чыгармачылык борбору",
          "Средняя школа имени Сагындыка, средняя школа Айдың-Көл, дошкольная образовательная организация «Үмүт-Нуру», центр творчества детей и подростков имени К. Калдаровой",
          "Sagyndyk Secondary School, Aidyn-Kol Secondary School, Umit-Nuru preschool institution, and the K. Kaldarova children and youth creative centre",
        ),
      },
      {
        label: L("Маданият", "Культура", "Culture"),
        value: L(
          "Айылдык китепкана, маданият үйү, Ж. Шамшиев атындагы музыкалык мектеп, Улуу Ата Мекендик согуштун катышуучуларына арналган эстелик",
          "Сельская библиотека, дом культуры, музыкальная школа имени Ж. Шамшиева, памятник участникам Великой Отечественной войны",
          "Village library, house of culture, J. Shamshiev Music School, and a monument to participants of the Great Patriotic War",
        ),
      },
      { label: L("Спорт", "Спорт", "Sport"), value: L("Балдар-өспүрүмдөр спорт клубу", "Детско-юношеский спортивный клуб", "Children and youth sports club") },
    ],
    history: L(
      "Коо-Чаты аймагы мурда көчмөн мал чарбачылыгы менен байланышкан кыштоо жана жайлоо катары пайдаланылып келген. XX кылымдын биринчи жарымында туруктуу отурукташуу күчөп, совет мезгилинде айыл чарба бирикмелери түзүлгөн. 1950-1960-жылдары айыл туруктуу социалдык жана административдик конуш катары калыптанып, мектеп, медициналык жана башка инфраструктура өнүгө баштаган.",
      "Территория Коо-Чаты прежде использовалась как зимовье и летнее пастбище, связанное с кочевым животноводством. В первой половине XX века постоянное заселение усилилось, а в советский период были созданы сельскохозяйственные объединения. В 1950-1960-х годах село сформировалось как постоянный социальный и административный населённый пункт, где начали развиваться школа, медицинская и другая инфраструктура.",
      "The Koo-Chaty area was once used as winter and summer pasture connected with nomadic livestock farming. Permanent settlement increased during the first half of the twentieth century, and agricultural associations were established in the Soviet period. In the 1950s and 1960s, the village developed as a permanent social and administrative settlement with school, medical, and other infrastructure.",
    ),
    tourism: {
      lead: L(
        "Коо-Чатыда жайлоо туризмин, атчан саякаттарды жана этномаданий тажрыйбаларды өнүктүрүүгө мүмкүнчүлүк бар. Бул багыттар аймактын келечектеги туристтик потенциалы катары гана көрсөтүлөт.",
        "В Коо-Чаты есть потенциал для развития джайлоо-туризма, конных путешествий и этнокультурных программ. Эти направления представлены только как будущий туристический потенциал территории.",
        "Koo-Chaty has potential for jailoo tourism, horseback travel, and ethnocultural experiences. These themes are presented only as future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарба продукциясын кайра иштетүү, эт жана сүт азыктарын өндүрүү, конок үй жана жайлоо туризми, атчан маршруттар жана жергиликтүү продукцияны бренддөө келечектеги инвестициялык мүмкүнчүлүктөргө кирет.",
        "К перспективным направлениям относятся переработка животноводческой продукции, производство мясных и молочных продуктов, гостевые дома и джайлоо-туризм, конные маршруты и брендинг местной продукции.",
        "Potential investment directions include livestock processing, meat and dairy products, guesthouses and jailoo tourism, horseback routes, and local product branding.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Коо-Чаты, Алайку аймагы", "Коо-Чаты, аймак Алайку", "Koo-Chaty, Alaykuu"),
    related: [],
  },
  {
    slug: "kuyotash",
    name: "Күйө-Таш",
    nameRu: "Күйө-Таш",
    nameEn: "Kuyo-Tash",
    showInfo: true,
    ...createLegacyVillageSections("kuyotash", "Күйө-Таш", "Күйө-Таш", "Kuyo-Tash"),
    tagline: L(
      "Чычырканак суусунун жанындагы бийик тоолуу айыл",
      "Высокогорное село у водотока Чычырканак",
      "A high-altitude village near the Chychyrkanak watercourse",
    ),
    intro: L(
      "Күйө-Таш - Алайку дарыя системасынын оң куймасы болгон Чычырканак суусуна жакын жайгашкан бийик тоолуу айыл. Айылда 1 019 адам жана 200 кожолук бар, деңиз деңгээлинен 2 234 метр бийиктикте жайгашкан. Негизги тиричилик булагы - жылкы, бодо мал жана майда мал багууга негизделген мал чарбачылыгы.",
      "Күйө-Таш - высокогорное село у водотока Чычырканак, относящегося к правобережной приточной системе реки Алайку. В селе проживают 1 019 человек и насчитывается 200 хозяйств, оно расположено на высоте 2 234 метра. Основное занятие жителей - животноводство, особенно разведение лошадей, крупного и мелкого скота.",
      "Kuyo-Tash is a high-altitude village near the Chychyrkanak watercourse in the right-bank tributary system of the Alaykuu River. It has a population of 1,019 and 200 households and lies at 2,234 metres above sea level. Livestock farming, especially horses, cattle, and small livestock, is the main livelihood.",
    ),
    info: [
      { label: INFO_POP, value: L("1 019", "1 019", "1,019") },
      { label: INFO_HOUSEHOLDS, value: L("200", "200", "200") },
      { label: INFO_ABOVE_SEA, value: L("2 234 м", "2 234 м", "2,234 m") },
      { label: INFO_LOC, value: L("Чычырканак суусунун жанында, Алайку дарыя системасынын оң куймасы тарабында", "У водотока Чычырканак в правобережной приточной системе реки Алайку", "Near the Chychyrkanak watercourse in the right-bank tributary system of the Alaykuu River") },
      { label: INFO_ECONOMY, value: L("Жылкы, бодо мал жана майда мал багуу", "Разведение лошадей, крупного и мелкого скота", "Horse, cattle, and small livestock farming") },
      {
        label: L("Билим берүү", "Образование", "Education"),
        value: L(
          "А. Жаңыбаев атындагы орто мектеби, Күйө-Таш бала бакчасы, Амантур Каракозуев атындагы №109 кесиптик лицей",
          "Средняя школа имени А. Жаныбаева, детский сад Күйө-Таш, профессиональный лицей №109 имени Амантура Каракозуева",
          "A. Janybaev Secondary School, Kuyo-Tash kindergarten, and Amantur Karakozuev Vocational Lyceum No. 109",
        ),
      },
      { label: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"), value: L("Кызыл-Жар аймактык ооруканасы, №14 ҮДБ / ҮДТ", "Кызыл-Жарская территориальная больница, ЦСМ / ГСВ №14", "Kyzyl-Jar territorial hospital and family medicine centre / family doctor group No. 14") },
      { label: L("Маданият", "Культура", "Culture"), value: L("И. Одонов атындагы №16 айылдык китепкана, маданият үйү, Улуу Ата Мекендик согуштун катышуучуларына арналган эстелик", "Сельская библиотека №16 имени И. Одонова, дом культуры, памятник участникам Великой Отечественной войны", "I. Odonov Village Library No. 16, house of culture, and a monument to participants of the Great Patriotic War") },
    ],
    history: L(
      "Күйө-Таштын аймагы мурда сезондук мал чарбачылыгы үчүн пайдаланылган. Туруктуу отурукташуу бара-бара күчөп, совет мезгилинде айылдык конуш жана жамааттык чарба калыптанган. Кийин мектеп, медициналык кызмат жана электр инфраструктурасы өнүккөн.",
      "Территория Күйө-Таша прежде использовалась для сезонного скотоводства. Постоянное заселение постепенно усиливалось, а в советский период сформировались сельское поселение и коллективное хозяйство. Позднее развивались школа, медицинские услуги и электрическая инфраструктура.",
      "The Kuyo-Tash area was once used for seasonal pastoralism. Permanent settlement developed gradually, and a village settlement and collective agriculture took shape during the Soviet period. School, medical services, and electricity infrastructure developed later.",
    ),
    tourism: {
      lead: L(
        "Тоолуу көрүнүштөр, жайлоо жашоосу, атчан саякат жана салттуу мал чарба маданияты Күйө-Таштын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Горные пейзажи, жизнь на джайлоо, конные путешествия и традиционная животноводческая культура формируют будущий туристический потенциал Күйө-Таша.",
        "Mountain landscapes, jailoo life, horseback travel, and traditional livestock culture form Kuyo-Tash's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгын, эт жана сүттү кайра иштетүүнү, жергиликтүү кызматтарды жана айылдык меймандостукту өнүктүрүү инвестициялык мүмкүнчүлүк катары каралат.",
        "Развитие животноводства, переработки мяса и молока, местных услуг и сельского гостеприимства рассматривается как инвестиционный потенциал.",
        "Livestock, meat and dairy processing, local services, and rural hospitality are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Күйө-Таш, Алайку аймагы", "Күйө-Таш, аймак Алайку", "Kuyo-Tash, Alaykuu"),
    related: [],
  },
  {
    slug: "terek",
    name: "Терек",
    nameRu: "Терек",
    nameEn: "Terek",
    showInfo: true,
    ...createLegacyVillageSections("terek", "Терек", "Терек", "Terek"),
    tagline: L(
      "Алайку өрөөнүндөгү бийик тоолуу айыл",
      "Высокогорное село в долине Алайку",
      "A high-altitude village in the Alaykuu Valley",
    ),
    intro: L(
      "Терек - Ош шаарынан болжол менен 205 км чыгышта жайгашкан бийик тоолуу айыл. Айылда 1 197 адам жана 248 кожолук бар, деңиз деңгээлинен 2 240 метр бийиктикте орун алган. Жергиликтүү тиричиликтин негизин мал чарбачылыгы жана дыйканчылык түзөт.",
      "Терек - высокогорное село примерно в 205 км к востоку от Оша. Здесь проживают 1 197 человек и насчитывается 248 хозяйств, село расположено на высоте 2 240 метров. Основу местной жизни составляют животноводство и земледелие.",
      "Terek is a high-altitude village approximately 205 km east of Osh. It has a population of 1,197 and 248 households and lies at 2,240 metres above sea level. Livestock and crop farming form the basis of local livelihoods.",
    ),
    info: [
      { label: INFO_POP, value: L("1 197", "1 197", "1,197") },
      { label: INFO_HOUSEHOLDS, value: L("248", "248", "248") },
      { label: INFO_ABOVE_SEA, value: L("2 240 м", "2 240 м", "2,240 m") },
      { label: L("Ош шаарынан аралык", "Расстояние от Оша", "Distance from Osh"), value: L("болжол менен 205 км", "примерно 205 км", "approximately 205 km") },
      { label: L("Кара-Суу темир жол станциясынан аралык", "Расстояние от железнодорожной станции Кара-Суу", "Distance from Kara-Suu railway station"), value: L("болжол менен 200 км", "примерно 200 км", "approximately 200 km") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
    ],
    history: L(
      "Терек аймагы тарыхта сезондук жайыт жана кыштоо катары пайдаланылган, кийин туруктуу конуш акырындап калыптанган. Совет мезгилинде жамааттык айыл чарба өнүгүп, кийинки жылдары мектеп, медициналык кызмат жана электр инфраструктурасы кеңейген. Жергиликтүү түшүндүрмөдө айылдын аталышы суу бойлорунда жана өрөөндөрдө өскөн терек дарактары менен байланыштырылат.",
      "Территория Терека исторически использовалась как сезонное пастбище и зимовье, а постоянное поселение складывалось постепенно. В советский период развивалось коллективное сельское хозяйство, а позднее расширялись школа, медицинские услуги и электрическая инфраструктура. По местному объяснению, название села связывают с тополями, росшими вдоль водотоков и в долинах.",
      "The Terek area was historically used for seasonal pasture and wintering, with permanent settlement developing gradually. Collective agriculture grew during the Soviet period, followed by the expansion of school, medical, and electricity infrastructure. Local tradition connects the village name with poplar trees that grew along watercourses and valleys.",
    ),
    tourism: {
      lead: L(
        "Бийик тоолуу айыл көрүнүштөрү, жайыт турмушу, атчан саякат жана жергиликтүү жашоо менен таанышуу Теректин келечектеги туристтик мүмкүнчүлүктөрүнө кирет.",
        "Высокогорные сельские пейзажи, пастушеская жизнь, конные путешествия и знакомство с местным укладом входят в будущий туристический потенциал Терека.",
        "High-altitude village landscapes, pastoral life, horseback travel, and local lifestyle experiences are part of Terek's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, эт жана сүттү кайра иштетүү, айылдык туризм жана жергиликтүү айыл чарба кызматтары инвестициялык потенциалга ээ.",
        "Животноводство, переработка мяса и молока, сельский туризм и местные сельскохозяйственные услуги обладают инвестиционным потенциалом.",
        "Livestock farming, meat and dairy processing, rural tourism, and local agricultural services have investment potential.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Терек, Алайку аймагы", "Терек, аймак Алайку", "Terek, Alaykuu"),
    related: [],
  },
  {
    slug: "kaiyn-talaa",
    name: "Кайың-Талаа",
    nameRu: "Кайың-Талаа",
    nameEn: "Kaiyn-Talaa",
    showInfo: true,
    ...createLegacyVillageSections("kaiyn-talaa", "Кайың-Талаа", "Кайың-Талаа", "Kaiyn-Talaa"),
    tagline: L(
      "Алайкунун түштүгүндөгү бийик тоолуу айыл",
      "Высокогорное село на юге Алайку",
      "A high-altitude village in southern Alaykuu",
    ),
    intro: L(
      "Кайың-Талаа - Алайку айыл аймагынын түштүк бөлүгүндө жайгашкан бийик тоолуу айыл. Айылда 1 228 адам жана 240 кожолук бар, деңиз деңгээлинен 2 200 метр бийиктикте орун алган. Негизги тиричилик мал чарбачылыгы жана дыйканчылык менен байланышкан.",
      "Кайың-Талаа - высокогорное село в южной части айыл аймака Алайку. Здесь проживают 1 228 человек и насчитывается 240 хозяйств, село расположено на высоте 2 200 метров. Основные занятия жителей связаны с животноводством и земледелием.",
      "Kaiyn-Talaa is a high-altitude village in the southern part of Alaykuu Aiyl Aimak. It has a population of 1,228 and 240 households and lies at 2,200 metres above sea level. The main local livelihoods are livestock and crop farming.",
    ),
    info: [
      { label: INFO_POP, value: L("1 228", "1 228", "1,228") },
      { label: INFO_HOUSEHOLDS, value: L("240", "240", "240") },
      { label: INFO_ABOVE_SEA, value: L("2 200 м", "2 200 м", "2,200 m") },
      { label: INFO_LOC, value: L("Алайку айыл аймагынын түштүк бөлүгү", "Южная часть айыл аймака Алайку", "Southern Alaykuu Aiyl Aimak") },
      { label: L("Ош шаарынан аралык", "Расстояние от Оша", "Distance from Osh"), value: L("210 км", "210 км", "210 km") },
      { label: L("Кара-Суу темир жол станциясынан аралык", "Расстояние от железнодорожной станции Кара-Суу", "Distance from Kara-Suu railway station"), value: L("203 км", "203 км", "203 km") },
      { label: INFO_ECONOMY, value: L("Мал чарбачылыгы жана дыйканчылык", "Животноводство и земледелие", "Livestock farming and crop farming") },
      {
        label: L("Билим берүү", "Образование", "Education"),
        value: L(
          "Кебек Мамаеев атындагы орто мектеби, «Кайың-Талаа» мектепке чейинки билим берүү уюму",
          "Средняя школа имени Кебека Мамаева, дошкольная образовательная организация «Кайың-Талаа»",
          "Kebek Mamaev Secondary School and Kaiyn-Talaa preschool institution",
        ),
      },
      { label: L("Маданият", "Культура", "Culture"), value: L("Айылдык китепкана, маданият үйү, Улуу Ата Мекендик согуштун катышуучуларына арналган эстелик", "Сельская библиотека, дом культуры, памятник участникам Великой Отечественной войны", "Village library, house of culture, and a monument to participants of the Great Patriotic War") },
    ],
    history: L(
      "Кайың-Талаа аймагы мурда сезондук мал чарбачылыгы үчүн пайдаланылып, туруктуу конуш акырындап калыптанган. Совет мезгилинде жамааттык айыл чарба өнүгүп, мектеп жана башка инфраструктура түзүлгөн. Электр инфраструктурасы айылга 1979-1980-жылдары жетип, мобилдик байланыш жана интернет 2009-2010-жылдары өнүгө баштаган. Тарыхта тургундар ичүүчү сууга жетүүдө олуттуу кыйынчылык көрүшкөн.",
      "Территория Кайың-Талаа прежде использовалась для сезонного животноводства, а постоянное поселение формировалось постепенно. В советский период развивалось коллективное сельское хозяйство, создавались школа и другая инфраструктура. Электрическая инфраструктура появилась в селе примерно в 1979-1980 годах, а мобильная связь и интернет начали развиваться в 2009-2010 годах. Исторически жители испытывали серьёзные трудности с доступом к питьевой воде.",
      "The Kaiyn-Talaa area was once used for seasonal livestock farming, and permanent settlement developed gradually. Collective agriculture expanded during the Soviet period, along with school and other infrastructure. Electricity infrastructure reached the village around 1979-1980, while mobile and internet connectivity began developing around 2009-2010. Historically, residents faced significant difficulty accessing drinking water.",
    ),
    tourism: {
      lead: L(
        "Тоолуу көрүнүштөр, жайлоо туризми, атчан маршруттар жана салттуу айыл турмушу Кайың-Талаанын келечектеги туристтик мүмкүнчүлүктөрүн түзөт.",
        "Горные пейзажи, джайлоо-туризм, конные маршруты и традиционная сельская жизнь формируют будущий туристический потенциал Кайың-Талаа.",
        "Mountain scenery, jailoo tourism, horseback routes, and traditional village life form Kaiyn-Talaa's future tourism potential.",
      ),
      items: [],
    },
    investment: {
      lead: L(
        "Мал чарбачылыгы, айыл чарба продукциясын кайра иштетүү, айылдык конок жайлары, жергиликтүү инфраструктура жана кызматтар инвестициялык мүмкүнчүлүк катары каралат.",
        "Животноводство, переработка сельскохозяйственной продукции, сельское гостевое размещение, местная инфраструктура и услуги рассматриваются как инвестиционный потенциал.",
        "Livestock, agricultural processing, rural guest accommodation, local infrastructure, and services are potential directions for investment.",
      ),
      items: [],
    },
    people: [],
    gallery: [],
    mapNote: L("Кайың-Талаа, Алайку аймагы", "Кайың-Талаа, аймак Алайку", "Kaiyn-Talaa, Alaykuu"),
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
