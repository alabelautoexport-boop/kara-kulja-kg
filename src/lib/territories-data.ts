import type { Lang } from "@/lib/i18n";
import { getR2Url } from "@/lib/r2";

const territoryCardImg = (aimakSlug: string) =>
  getR2Url(`territories/${aimakSlug}/general/photos/card.jpg`);

export type Localized<T> = Record<Lang, T>;

export type TerritoryVillage = {
  name: string;
  nameRu: string;
  nameEn: string;
  slug: string;
  population: number | null;
  order: number;
};

export type TerritoryLinkValue = {
  label: Localized<string>;
  slug?: string;
};

export type TerritoryTextValue = {
  label: Localized<string>;
  value: Localized<string>;
  links?: TerritoryLinkValue[];
};

export type TerritoryHeroStat = TerritoryTextValue;

export type TerritoryScenicPlace = {
  name: Localized<string>;
  filename: string;
  alt: Localized<string>;
};

export type TerritoryProfileGroup = {
  title: Localized<string>;
  items: TerritoryTextValue[];
};

export type TerritoryInfrastructureGroup = {
  title: Localized<string>;
  primary: Localized<string>[];
  secondary: Localized<string>[];
  detail?: Localized<string>[];
};

export type TerritoryEconomyProfileItem = {
  label: Localized<string>;
  values: Localized<string>[];
};

export type TerritoryGalleryImage = {
  filename: string;
  alt: Localized<string>;
  caption: Localized<string>;
  layout: "wide" | "standard" | "tall";
};

export type TerritoryDetail = {
  heroStats?: TerritoryHeroStat[];
  heroDarkOverlay?: boolean;
  villageCardVisual?: "neutral";
  passport?: {
    title: Localized<string>;
    reference: Localized<string>;
    groups: TerritoryProfileGroup[];
  };
  nature?: {
    title: Localized<string>;
    intro: Localized<string>;
    places: TerritoryScenicPlace[];
  };
  infrastructure?: {
    title: Localized<string>;
    groups: TerritoryInfrastructureGroup[];
  };
  economy?: {
    title: Localized<string>;
    body: Localized<string>;
    profile: TerritoryEconomyProfileItem[];
  };
  history?: {
    title: Localized<string>;
    body: Localized<string>;
  };
  gallery?: {
    title: Localized<string>;
    images: TerritoryGalleryImage[];
  };
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
  detail?: TerritoryDetail;
};

const L = (kg: string, ru: string, en: string): Localized<string> => ({ kg, ru, en });

const territoryCopy = (name: string, nameEn: string, tone: string): Localized<string> =>
  L(
    `${name} - ${tone}. Айылдар өрөөндүн ыргагы менен жай ачылат.`,
    `${name} - ${tone}. Сёла раскрываются в ритме долины.`,
    `${nameEn} - villages unfold at the pace of the valley.`,
  );


const KARA_KOCHKOR_DETAIL: TerritoryDetail = {
  villageCardVisual: "neutral",
  heroStats: [
    { value: L("18 940", "18 940", "18,940"), label: L("калк", "население", "population") },
    { value: L("8", "8", "8"), label: L("айыл", "сёл", "villages") },
    { value: L("4 001", "4 001", "4,001"), label: L("кожолук", "хозяйств", "households") },
    { value: L("", "", ""), label: L("жалпы аянт", "общая площадь", "total area") },
  ],
  passport: {
    title: L("Айыл аймагы жөнүндө", "Об айыл аймаке", "About the aiyl aimak"),
    reference: L("Негизги маалымат - 2026-жыл", "Основная информация - 2026 год", "Key information - 2026"),
    groups: [{
      title: L("Негизги маалымат", "Основная информация", "Key information"),
      items: [
        { label: L("Облусу", "Область", "Region"), value: L("Ош облусу", "Ошская область", "Osh Region") },
        { label: L("Району", "Район", "District"), value: L("Кара-Кулжа району", "Кара-Кульджинский район", "Kara-Kulja District") },
        { label: L("Калкы", "Население", "Population"), value: L("18 940", "18 940", "18,940") },
        { label: L("Айылдары", "Сёла", "Villages"), value: L("8", "8", "8") },
        { label: L("Кожолуктар", "Хозяйства", "Households"), value: L("4 001", "4 001", "4,001") },
      ],
    }],
  },
  nature: {
    title: L("Жаратылыш жана туризм", "Природа и туризм", "Nature and tourism"),
    intro: L(
      "Кара-Кочкор айыл аймагында айылдык жана тоо этегиндеги көрүнүштөр, айдоо жерлери, жайыттар, дарыялар жана суу булактары бар. Тоготой айылынын жанындагы Тогуз-Булак эс алуу жайы жана Кара-Дарыя тарыхый-маданий мурас объектиси аймактын таанымдык жана эс алуу багытын өнүктүрүүгө негиз түзөт.",
      "В айыл аймаке Кара-Кочкор сочетаются сельские и предгорные ландшафты, сельскохозяйственные земли, пастбища, реки и водные источники. Зона отдыха Тогуз-Булак и объект историко-культурного наследия Кара-Дарья возле села Тоготой создают основу для развития познавательного туризма и отдыха.",
      "Kara-Kochkor Aiyl Aimak combines rural and foothill landscapes, farmland, pastures, rivers, and water sources. The Toguz-Bulak recreation area and the Kara-Darya historical-cultural heritage site near Togotoy provide a foundation for educational visits and recreation.",
    ),
    places: [],
  },
  infrastructure: {
    title: L("Социалдык инфраструктура", "Социальная инфраструктура", "Social infrastructure"),
    groups: [
      { title: L("Билим берүү", "Образование", "Education"), primary: [L("8 мектеп", "8 школ", "8 schools"), L("10 мектепке чейинки мекеме", "10 дошкольных учреждений", "10 preschool institutions")], secondary: [] },
      { title: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"), primary: [L("Айылдарда ҮДТ жана ФАПтар иштейт", "В сёлах работают ГСВ и ФАПы", "Family doctor groups and feldsher-obstetric points serve the villages")], secondary: [] },
      { title: L("Маданият", "Культура", "Culture"), primary: [L("Маданият үйлөрү жана айылдык китепканалар бар", "Работают дома культуры и сельские библиотеки", "Houses of culture and village libraries are present")], secondary: [L("Тарыхый-маданий мурас объекттери бар", "Имеются объекты историко-культурного наследия", "Historical-cultural heritage sites are present")] },
      { title: L("Спорт", "Спорт", "Sport"), primary: [L("Айылдарда спорт аянтчалары бар", "В сёлах имеются спортивные площадки", "Sports grounds are available in the villages")], secondary: [] },
    ],
  },
  economy: {
    title: L("Экономика", "Экономика", "Economy"),
    body: L(
      "Кара-Кочкор айыл аймагынын экономикасынын негизги багыттары - мал чарбачылыгы жана дыйканчылык. Айрым айылдарда сугат дыйканчылыгы өнүккөн. Жергиликтүү айыл чарба өндүрүшү үй-бүлөлүк чарбаларга, айдоо жерлерине жана жайыттарга таянат.",
      "Основные направления экономики айыл аймака Кара-Кочкор - животноводство и земледелие. В отдельных сёлах развито орошаемое земледелие. Местное сельскохозяйственное производство опирается на семейные хозяйства, пашни и пастбища.",
      "The main economic activities in Kara-Kochkor Aiyl Aimak are livestock and crop farming. Irrigated agriculture is developed in some villages. Local agricultural production is based on family farms, cultivated land, and pastures.",
    ),
    profile: [
      { label: L("Негизги багыттар", "Основные направления", "Main activities"), values: [L("Мал чарбачылыгы", "Животноводство", "Livestock farming"), L("Дыйканчылык", "Земледелие", "Crop farming")] },
      { label: L("Айрым айылдарда", "В отдельных сёлах", "In some villages"), values: [L("Сугат дыйканчылыгы", "Орошаемое земледелие", "Irrigated agriculture")] },
    ],
  },
};

const ALAYKUU_DETAIL: TerritoryDetail = {
  villageCardVisual: "neutral",
  heroStats: [
    { value: L("12 073", "12 073", "12,073"), label: L("калк", "население", "population") },
    { value: L("12", "12", "12"), label: L("айыл", "сёл", "villages") },
    { value: L("", "", ""), label: L("кожолук", "хозяйств", "households") },
    { value: L("188 271 га", "188 271 га", "188,271 ha"), label: L("жалпы аянт", "общая площадь", "total area") },
  ],
  passport: {
    title: L("Айыл аймагы жөнүндө", "Об айыл аймаке", "About the aiyl aimak"),
    reference: L("Негизги маалымат", "Основная информация", "Key information"),
    groups: [
      {
        title: L("Жайгашуусу", "Расположение", "Location"),
        items: [
          { label: L("Облусу", "Область", "Region"), value: L("Ош облусу", "Ошская область", "Osh Region") },
          { label: L("Району", "Район", "District"), value: L("Кара-Кулжа району", "Кара-Кульджинский район", "Kara-Kulja District") },
          {
            label: L("Географиялык жайгашуусу", "Географическое положение", "Geographic location"),
            value: L(
              "Кара-Кулжа районунун чыгышында, Кытай менен чектешкен аймак",
              "В восточной части Кара-Кулжинского района, на границе с Китаем",
              "Eastern Kara-Kulja District, bordering China",
            ),
          },
        ],
      },
      {
        title: L("Негизги маалымат", "Основная информация", "Key information"),
        items: [
          { label: L("Кайра уюшулган жылы", "Год реорганизации", "Year reorganized"), value: L("2024", "2024", "2024") },
          { label: L("Деңиз деңгээлинен", "Высота над уровнем моря", "Elevation above sea level"), value: L("болжол менен 2 000-3 000 м", "примерно 2 000-3 000 м", "approximately 2,000-3,000 m") },
          { label: L("Климаты", "Климат", "Climate"), value: L("Бийик тоолуу континенттик климат", "Высокогорный континентальный климат", "High-altitude continental climate") },
          { label: L("Негизги экономикалык багыт", "Основное экономическое направление", "Main economic focus"), value: L("Айыл чарба жана мал чарбачылыгы", "Сельское хозяйство и животноводство", "Agriculture and livestock farming") },
        ],
      },
    ],
  },
  nature: {
    title: L("Жаратылыш", "Природа", "Nature"),
    intro: L(
      "Алайку бийик тоолор, кең жайлоолор, тоо дарыялары жана алыскы өрөөндөр менен айырмаланган өзгөчө аймак. Өрөөндүн бийик тоолуу жаратылышы мал чарбачылыгы, жайлоо туризми, атчан саякат, жөө маршруттар жана жаратылыш туризми үчүн кең мүмкүнчүлүк түзөт.",
      "Алайку отличается высокими горами, просторными пастбищами, горными реками и удалёнными долинами. Высокогорная природа создаёт условия для традиционного животноводства, джайлоо-туризма, конных путешествий, пеших маршрутов и природного туризма.",
      "Alaykuu is defined by high mountains, broad pastures, mountain rivers and remote valleys. Its high-altitude environment provides strong potential for traditional livestock farming, jailoo tourism, horseback travel, hiking and nature-based tourism.",
    ),
    places: [],
  },
  infrastructure: {
    title: L("Социалдык инфраструктура", "Социальная инфраструктура", "Social infrastructure"),
    groups: [
      {
        title: L("Билим берүү", "Образование", "Education"),
        primary: [L("8 мектеп", "8 школ", "8 schools"), L("7 мектепке чейинки мекеме", "7 дошкольных учреждений", "7 preschool institutions")],
        secondary: [L("1 кесиптик лицей", "1 профессиональный лицей", "1 vocational lyceum")],
      },
      {
        title: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"),
        primary: [L("1 оорукана", "1 больница", "1 hospital"), L("2 үй-бүлөлүк медицина борбору", "2 центра семейной медицины", "2 family medicine centres"), L("2 үй-бүлөлүк дарыгерлер тобу", "2 группы семейных врачей", "2 family doctor groups"), L("5 ФАП", "5 ФАП", "5 feldsher-obstetric points")],
        secondary: [L("1 тез жардам бөлүмү", "1 отделение скорой помощи", "1 ambulance department"), L("2 тез жардам унаасы", "2 машины скорой помощи", "2 ambulances"), L("1 дарыкана", "1 аптека", "1 pharmacy")],
      },
      {
        title: L("Маданият", "Культура", "Culture"),
        primary: [L("5 маданият үйү", "5 домов культуры", "5 houses of culture"), L("6 китепкана", "6 библиотек", "6 libraries")],
        secondary: [L("1 музей", "1 музей", "1 museum"), L("6 археологиялык жана архитектуралык эстелик", "6 археологических и архитектурных памятников", "6 archaeological and architectural monuments")],
      },
      {
        title: L("Спорт", "Спорт", "Sport"),
        primary: [L("1 стадион", "1 стадион", "1 stadium"), L("7 жабык спорт зал", "7 крытых спортивных залов", "7 indoor sports halls")],
        secondary: [L("6 кичи футбол аянтчасы", "6 мини-футбольных площадок", "6 mini-football pitches"), L("2 ачык спорт аянтчасы", "2 открытые спортивные площадки", "2 outdoor sports grounds")],
      },
    ],
  },
  economy: {
    title: L("Экономика", "Экономика", "Economy"),
    body: L(
      "Алайку айыл аймагынын экономикасынын негизин мал чарбачылыгы түзөт. Тоолуу жайыттарда кой-эчки, бодо мал, жылкы жана топоз багылат. Айрым айылдарда кымыз жана сүт азыктары өндүрүлөт. Климаттык шарттарга байланыштуу дыйканчылык чектелүү болгону менен тоют өсүмдүктөрү жана жергиликтүү керектөөгө ылайык айыл чарба продукциясы өстүрүлөт.",
      "Основу экономики айыл аймака Алайку составляет животноводство. На горных пастбищах разводят овец и коз, крупный рогатый скот, лошадей и яков. В отдельных сёлах производят кумыс и молочную продукцию. Из-за высокогорного климата земледелие ограничено и в основном связано с кормовыми культурами и продукцией для местного потребления.",
      "Livestock farming forms the foundation of Alaykuu's economy. Sheep and goats, cattle, horses and yaks are raised on its mountain pastures. Some villages produce kumys and dairy products. Crop farming is limited by the high-altitude climate and is mainly focused on fodder crops and production for local use.",
    ),
    profile: [
      { label: L("Негизги багыт", "Основное направление", "Main focus"), values: [L("Айыл чарба", "Сельское хозяйство", "Agriculture"), L("Мал чарбачылыгы", "Животноводство", "Livestock farming")] },
      {
        label: L("Чарбалык багыттар", "Направления хозяйства", "Livelihoods"),
        values: [
          L("Кой-эчки багуу", "Разведение овец и коз", "Sheep and goat farming"),
          L("Бодо мал багуу", "Разведение крупного рогатого скота", "Cattle farming"),
          L("Жылкы чарбачылыгы", "Коневодство", "Horse breeding"),
          L("Топоз багуу", "Разведение яков", "Yak farming"),
          L("Кымыз жана сүт азыктары", "Кумыс и молочная продукция", "Kumys and dairy products"),
          L("Чектелүү дыйканчылык", "Ограниченное земледелие", "Limited crop farming"),
        ],
      },
    ],
  },
  history: {
    title: L("Тарых", "История", "History"),
    body: L(
      "Алайку өрөөнү кылымдар бою бийик тоолуу жайыттары жана көчмөн мал чарбачылыгы менен байланышкан. Өрөөндөгү азыркы айылдардын көбү XX кылымдын биринчи жарымында туруктуу калктуу конуш катары калыптана баштаган. 2024-жылдагы административдик-аймактык реформанын негизинде Алайку айыл аймагы ирилештирилип, анын курамына 12 айыл кирген.",
      "История Алайку на протяжении многих поколений была связана с высокогорными пастбищами и кочевым животноводством. Большинство современных сёл долины начали формироваться как постоянные населённые пункты в первой половине XX века. После административно-территориальной реформы 2024 года укрупнённый айыл аймак Алайку объединил 12 сёл.",
      "For generations, the history of Alaykuu has been closely connected with high-altitude pastures and nomadic livestock farming. Most of today's villages developed into permanent settlements during the first half of the twentieth century. Following the 2024 administrative-territorial reform, the enlarged Alaykuu Aiyl Aimak brought together 12 villages.",
    ),
  },
};

const OI_TAL_DETAIL: TerritoryDetail = {
  villageCardVisual: "neutral",
  heroStats: [
    { value: L("6 134", "6 134", "6,134"), label: L("калк", "население", "population") },
    { value: L("6", "6", "6"), label: L("айыл", "сёл", "villages") },
    { value: L("1 145", "1 145", "1,145"), label: L("кожолук", "хозяйств", "households") },
    { value: L("", "", ""), label: L("жалпы аянт", "общая площадь", "total area") },
  ],
  passport: {
    title: L("Айыл аймагы жөнүндө", "Об айыл аймаке", "About the aiyl aimak"),
    reference: L("Негизги маалымат - 2026-жыл", "Основная информация - 2026 год", "Key information - 2026"),
    groups: [
      {
        title: L("Жайгашуусу", "Расположение", "Location"),
        items: [
          { label: L("Облусу", "Область", "Region"), value: L("Ош облусу", "Ошская область", "Osh Region") },
          { label: L("Району", "Район", "District"), value: L("Кара-Кулжа району", "Кара-Кульджинский район", "Kara-Kulja District") },
          { label: L("Административдик борбору", "Административный центр", "Administrative centre"), value: L("Сары-Бээ айылы", "село Сары-Бээ", "Sary-Bee village") },
          { label: L("Район борборунан аралык", "Расстояние от районного центра", "Distance from district centre"), value: L("45 км", "45 км", "45 km") },
          { label: L("Облус борборунан аралык", "Расстояние от областного центра", "Distance from regional centre"), value: L("145 км", "145 км", "145 km") },
          { label: L("Жакынкы темир жол станциясына чейин", "До ближайшей железнодорожной станции", "To the nearest railway station"), value: L("135 км", "135 км", "135 km") },
          { label: L("Жакынкы аэропортко чейин", "До ближайшего аэропорта", "To the nearest airport"), value: L("157 км", "157 км", "157 km") },
        ],
      },
      {
        title: L("Негизги маалымат", "Основная информация", "Key information"),
        items: [
          { label: L("Уюшулган жылы", "Год образования", "Year established"), value: L("2024", "2024", "2024") },
          { label: L("Климаты", "Климат", "Climate"), value: L("Мээлүүн", "Умеренный", "Temperate") },
          { label: L("Деңиз деңгээлинен", "Высота над уровнем моря", "Elevation above sea level"), value: L("болжол менен 2 000 м", "примерно 2 000 м", "approximately 2,000 m") },
        ],
      },
    ],
  },
  infrastructure: {
    title: L("Социалдык инфраструктура", "Социальная инфраструктура", "Social infrastructure"),
    groups: [
      {
        title: L("Билим берүү", "Образование", "Education"),
        primary: [
          L("5 мектеп", "5 школ", "5 schools"),
          L("987 окуучу", "987 учеников", "987 pupils"),
        ],
        secondary: [L("5 мектепке чейинки мекеме", "5 дошкольных учреждений", "5 preschool institutions")],
      },
      {
        title: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"),
        primary: [
          L("3 ФАП", "3 ФАП", "3 feldsher-obstetric points"),
          L("2 ҮДТ", "2 ГСВ", "2 family doctors groups"),
        ],
        secondary: [],
      },
      {
        title: L("Маданият", "Культура", "Culture"),
        primary: [
          L("5 клуб", "5 клубов", "5 clubs"),
          L("5 китепкана", "5 библиотек", "5 libraries"),
        ],
        secondary: [],
      },
    ],
  },
  economy: {
    title: L("Экономика", "Экономика", "Economy"),
    body: L(
      "Ой-Тал айыл аймагынын негизги экономикалык багыты - айыл чарба. Айылдарда мал чарбачылыгы, дыйканчылык жана айрым жерлерде балчылык өнүккөн. Тоолуу жайыттар жана жергиликтүү чарба тажрыйбасы айыл экономикасынын негизин түзөт.",
      "Основное экономическое направление айыл аймака Ой-Тал - сельское хозяйство. В сёлах развиты животноводство, земледелие и в отдельных местах пчеловодство. Горные пастбища и местный хозяйственный опыт составляют основу экономики сёл.",
      "The main economic focus of Oi-Tal Aiyl Aimak is agriculture. Livestock farming, crop farming, and beekeeping in some areas are developed across its villages. Mountain pastures and local farming experience form the basis of the village economy.",
    ),
    profile: [
      { label: L("Негизги багыт", "Основное направление", "Main focus"), values: [L("Айыл чарба", "Сельское хозяйство", "Agriculture")] },
      {
        label: L("Чарбалык багыттар", "Направления хозяйства", "Livelihoods"),
        values: [
          L("Мал чарбачылыгы", "Животноводство", "Livestock farming"),
          L("Дыйканчылык", "Земледелие", "Crop farming"),
          L("Балчылык", "Пчеловодство", "Beekeeping"),
        ],
      },
    ],
  },
  history: {
    title: L("Тарых", "История", "History"),
    body: L(
      "Ой-Тал айыл аймагы 2024-жылдагы административдик-аймактык реформанын негизинде уюшулган. Анын курамына Ой-Тал, Көңдүк, Сары-Бээ, Кара-Таш, Терек-Суу жана Ничке-Суу айылдары кирет. Айыл өкмөтүнүн административдик борбору Сары-Бээ айылында жайгашкан.",
      "Айыл аймак Ой-Тал был образован на основе административно-территориальной реформы 2024 года. В его состав входят сёла Ой-Тал, Көңдүк, Сары-Бээ, Кара-Таш, Терек-Суу и Ничке-Суу. Административный центр айыл окмоту расположен в селе Сары-Бээ.",
      "Oi-Tal Aiyl Aimak was established through the 2024 administrative-territorial reform. It includes the villages of Oi-Tal, Konduk, Sary-Bee, Kara-Tash, Terek-Suu, and Nichke-Suu. The administrative centre of the aiyl okmotu is located in Sary-Bee village.",
    ),
  },
};

const YLAI_NATURE_CAPTION = L(
  "Ылай-Талаа айыл аймагынын жаратылышы",
  "Природа айыл аймака Ылай-Талаа",
  "Nature of Ylai-Talaa Aiyl Aimak",
);

const YLAI_TALAA_DETAIL: TerritoryDetail = {
  heroDarkOverlay: true,
  villageCardVisual: "neutral",
  heroStats: [
    { value: L("17 501", "17 501", "17,501"), label: L("калк", "население", "population") },
    { value: L("9", "9", "9"), label: L("айыл", "сёл", "villages") },
    { value: L("3 394", "3 394", "3,394"), label: L("кожолук", "хозяйства", "households") },
    { value: L("85 815 га", "85 815 га", "85,815 ha"), label: L("жалпы аянт", "общая площадь", "total area") },
  ],
  passport: {
    title: L("Айыл аймагы жөнүндө", "Об айыл аймаке", "About the aiyl aimak"),
    reference: L("Негизги маалымат - 2026-жылдын 1-январына карата", "Основная информация - по состоянию на 1 января 2026 года", "Key information - as of 1 January 2026"),
    groups: [
      {
        title: L("Жайгашуусу", "Расположение", "Location"),
        items: [
          { label: L("Облусу", "Область", "Region"), value: L("Ош облусу", "Ошская область", "Osh Region") },
          { label: L("Району", "Район", "District"), value: L("Кара-Кулжа району", "Кара-Кульджинский район", "Kara-Kulja District") },
          { label: L("Уюшулган жылы", "Год образования", "Year established"), value: L("2024", "2024", "2024") },
          { label: L("Район борборунан аралык", "Расстояние от районного центра", "Distance from district centre"), value: L("12 км", "12 км", "12 km") },
          { label: L("Облус борборунан аралык", "Расстояние от областного центра", "Distance from regional centre"), value: L("112 км", "112 км", "112 km") },
          { label: L("Жакынкы темир жол станциясына чейин", "До ближайшей железнодорожной станции", "To the nearest railway station"), value: L("90 км", "90 км", "90 km") },
        ],
      },
      {
        title: L("Жер жана чарба", "Земля и хозяйство", "Land and economy"),
        items: [
          { label: L("Айыл чарба багытындагы жерлер", "Земли сельскохозяйственного назначения", "Agricultural land"), value: L("2 242,2 га", "2 242,2 га", "2,242.2 ha") },
          { label: L("Деңиз деңгээлинен", "Высота над уровнем моря", "Above sea level"), value: L("болжол менен 1 200 м", "примерно 1 200 м", "approximately 1,200 m") },
          { label: L("Негизги экономикалык багыт", "Основное экономическое направление", "Main economic focus"), value: L("Айыл чарба", "Сельское хозяйство", "Agriculture") },
          {
            label: L("Чектеш аймактар", "Соседние территории", "Neighbouring territories"),
            value: L("Сары-Булак, Кара-Кулжа жана Кара-Гуз айыл аймактары", "айыльные аймаки Сары-Булак, Кара-Кульджа и Кара-Гуз", "Sary-Bulak, Kara-Kulja and Kara-Guz aiyl aimaks"),
            links: [
              { label: L("Сары-Булак", "Сары-Булак", "Sary-Bulak") },
              { label: L("Кара-Кулжа", "Кара-Кульджа", "Kara-Kulja"), slug: "kara-kulja" },
              { label: L("Кара-Гуз", "Кара-Гуз", "Kara-Guz"), slug: "kara-guz" },
            ],
          },
        ],
      },
    ],
  },
  nature: {
    title: L("Жаратылыш жана кооз жерлер", "Природа и живописные места", "Nature and scenic places"),
    intro: L(
      "Ылай-Талаа айыл аймагы тоолуу өрөөндөрү, жайыттары, дарыялары жана табигый көрүнүштөрү менен айырмаланат. Бул сүрөттөр аймактын жаратылышын тааныштырат.",
      "Айыльный аймак Ылай-Талаа отличается горными долинами, пастбищами, реками и природными видами. Эти фотографии знакомят с природой территории.",
      "Ylai-Talaa Aiyl Aimak is distinguished by mountain valleys, pastures, rivers and natural scenery. These photographs introduce the nature of the territory.",
    ),
    places: [
      { name: L("Үч-Көл", "Уч-Кёль", "Uch-Kol"), filename: "uch-kol.webp", alt: L("Үч-Көлдүн тоолуу жаратылыш көрүнүшү", "Горный природный вид Уч-Кёля", "Mountain nature view of Uch-Kol") },
      { name: L("Кадырулуу-Ашуу", "Кадырулуу-Ашуу", "Kadyruluu-Ashuu"), filename: "kadyrluu-ashuu.webp", alt: L("Кадырулуу-Ашуудагы тоо көрүнүшү", "Горный вид в Кадырулуу-Ашуу", "Mountain view at Kadyruluu-Ashuu") },
      { name: L("Кызыл-Белес", "Кызыл-Белес", "Kyzyl-Beles"), filename: "kyzyl-beles-ashuu.webp", alt: L("Кызыл-Белестин табигый көрүнүшү", "Природный вид Кызыл-Белеса", "Natural view of Kyzyl-Beles") },
      { name: L("Кум-Бел", "Кум-Бел", "Kum-Bel"), filename: "kum-bel.webp", alt: L("Кум-Белдин тоолуу көрүнүшү", "Горный вид Кум-Беля", "Mountain view of Kum-Bel") },
      { name: L("Качуура", "Качуура", "Kachuura"), filename: "kachuura4.webp", alt: L("Качууранын жаратылыш көрүнүшү", "Природный вид Качууры", "Natural view of Kachuura") },
      { name: L("Беш-Тал", "Беш-Тал", "Besh-Tal"), filename: "besh-tal2.webp", alt: L("Беш-Талдагы табигый көрүнүш", "Природный вид в Беш-Тале", "Natural view at Besh-Tal") },
      { name: L("Шимек", "Шимек", "Shimek"), filename: "shimek.webp", alt: L("Шимектин жаратылыш көрүнүшү", "Природный вид Шимека", "Natural view of Shimek") },
      { name: L("Тогуз-Булак", "Тогуз-Булак", "Toguz-Bulak"), filename: "toguz-bulak1.webp", alt: L("Тогуз-Булактын табигый көрүнүшү", "Природный вид Тогуз-Булака", "Natural view of Toguz-Bulak") },
    ],
  },
  infrastructure: {
    title: L("Социалдык инфраструктура", "Социальная инфраструктура", "Social infrastructure"),
    groups: [
      {
        title: L("Билим берүү", "Образование", "Education"),
        primary: [
          L("10 мектеп", "10 школ", "10 schools"),
          L("2 982 окуучу", "2 982 ученика", "2,982 pupils"),
        ],
        secondary: [
          L("8 мектепке чейинки мекеме", "8 дошкольных учреждений", "8 preschool institutions"),
        ],
        detail: [
          L("707 мектепке чейинки орун", "707 дошкольных мест", "707 preschool places"),
          L("1 575 мектептик орун", "1 575 школьных мест", "1,575 school places"),
        ],
      },
      {
        title: L("Саламаттык сактоо", "Здравоохранение", "Healthcare"),
        primary: [
          L("3 ҮДТ", "3 ГСВ", "3 family doctors groups"),
          L("7 ФАП", "7 ФАП", "7 feldsher-obstetric points"),
        ],
        secondary: [
          L("2 тез жардам унаасы", "2 машины скорой помощи", "2 ambulances"),
          L("1 дарыкана", "1 аптека", "1 pharmacy"),
        ],
      },
      {
        title: L("Маданият", "Культура", "Culture"),
        primary: [
          L("2 маданият үйү", "2 дома культуры", "2 houses of culture"),
          L("3 китепкана", "3 библиотеки", "3 libraries"),
        ],
        secondary: [],
        detail: [
          L("15 маданият кызматкери", "15 работников культуры", "15 culture workers"),
        ],
      },
      {
        title: L("Спорт", "Спорт", "Sports"),
        primary: [
          L("2 жабык спорт зал", "2 крытых спортивных зала", "2 indoor sports halls"),
        ],
        secondary: [
          L("1 кичи футбол аянтчасы", "1 площадка для мини-футбола", "1 mini-football pitch"),
          L("1 ачык спорт аянтчасы", "1 открытая спортивная площадка", "1 outdoor sports ground"),
        ],
        detail: [
          L("10 дене тарбия жана спорт кызматкери", "10 работников физической культуры и спорта", "10 physical culture and sports workers"),
        ],
      },
    ],
  },
  economy: {
    title: L("Экономика жана чарба", "Экономика и хозяйство", "Economy and livelihoods"),
    body: L(
      "Айыл аймагынын негизги экономикалык багыты - айыл чарба. Калк негизинен мал чарбачылыгы жана дыйканчылык менен алектенет. Айрым чарбаларда багбанчылык жана балчылык да жүргүзүлөт.",
      "Основное экономическое направление айыл аймака - сельское хозяйство. Население в основном занимается животноводством и земледелием. В отдельных хозяйствах также развиты садоводство и пчеловодство.",
      "The main economic activity of the aiyl aimak is agriculture. The population is mainly engaged in livestock farming and crop farming. Some farms also practice horticulture and beekeeping.",
    ),
    profile: [
      { label: L("Негизги багыт", "Основное направление", "Main focus"), values: [L("Айыл чарба", "Сельское хозяйство", "Agriculture")] },
      {
        label: L("Негизги чарба түрлөрү", "Основные виды хозяйства", "Main livelihoods"),
        values: [
          L("Мал чарбачылыгы", "Животноводство", "Livestock breeding"),
          L("Дыйканчылык", "Земледелие", "Crop farming"),
          L("Багбанчылык жана балчылык", "Садоводство и пчеловодство", "Horticulture and beekeeping"),
        ],
      },
      { label: L("Муниципалдык ишкана", "Муниципальное предприятие", "Municipal enterprise"), values: [L("1", "1", "1")] },
    ],
  },
  history: {
    title: L("Тарых", "История", "History"),
    body: L(
      "Ылай-Талаа айыл аймагы 2024-жылы уюшулган. Ылай-Талаа айылы тууралуу жергиликтүү тарыхый маалыматтарда бул жер мурда «Сөгөт» деп аталганы айтылат. 1955–1956-жылдары Ворошилов, Сталин, Кызыл-Жол, Киров жана Молотов колхоздору бириктирилип, Мариш Баатыровдун жетекчилиги астында Карл Маркс атындагы колхоз уюштурулган.",
      "Айыльный аймак Ылай-Талаа был образован в 2024 году. В местных исторических сведениях о селе Ылай-Талаа говорится, что раньше это место называлось «Сёгёт». В 1955–1956 годах колхозы имени Ворошилова, Сталина, Кызыл-Жол, Кирова и Молотова были объединены, и под руководством Мариша Баатырова был создан колхоз имени Карла Маркса.",
      "Ylai-Talaa Aiyl Aimak was established in 2024. Local historical information about Ylai-Talaa village says that this place was formerly called Sogot. In 1955–1956, the Voroshilov, Stalin, Kyzyl-Jol, Kirov and Molotov collective farms were merged, and the Karl Marx collective farm was organized under the leadership of Marish Baatyrov.",
    ),
  },
  gallery: {
    title: L("Галерея", "Галерея", "Gallery"),
    images: [
      { filename: "ajike-toguz-bulak.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "wide" },
      { filename: "besh-tal2.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "besh-tal3.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "tall" },
      { filename: "besh-tal4.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "dunguromo.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "wide" },
      { filename: "kachuura4.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "kachuura5.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "kadyrluu-ashuu.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "tall" },
      { filename: "kum-bel.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "wide" },
      { filename: "kyzyl-beles-ashuu.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "shimek.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "toguz-bulak1.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "wide" },
      { filename: "uch-kol.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
      { filename: "uch-kol1.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "tall" },
      { filename: "uch-kol4.webp", alt: YLAI_NATURE_CAPTION, caption: YLAI_NATURE_CAPTION, layout: "standard" },
    ],
  },
};

export const TERRITORIES: Territory[] = [
  {
    slug: "kara-kulja",
    name: "Кара-Кулжа",
    nameRu: "Кара-Кульджа",
    nameEn: "Kara-Kulja",
    subtitle: L("Райондун жүрөгү жана жолдор түйүнү", "Сердце района и узел дорог", "The district heart and meeting of roads"),
    description: territoryCopy("Кара-Кулжа", "Kara-Kulja", "борбордук дем менен тоо тынчтыгы кошулган аймак"),
    population: 26077,
    image: territoryCardImg("kara-kulja"),
    villages: [
      { name: "Кара-Кулжа", nameRu: "Кара-Кульджа", nameEn: "Kara-Kulja", slug: "kara-kulja", population: 13917, order: 1 },
      { name: "Бий-Мырза", nameRu: "Бий-Мырза", nameEn: "Biy-Myrza", slug: "biy-myrza", population: 4741, order: 2 },
      { name: "Биринчи Май", nameRu: "Биринчи Май", nameEn: "Birinchi May", slug: "birinchi-may", population: 6401, order: 3 },
      { name: "Сары-Камыш", nameRu: "Сары-Камыш", nameEn: "Sary-Kamysh", slug: "sary-kamysh", population: 1018, order: 4 },
    ],
  },
  {
    slug: "alaikuu",
    name: "Алайку",
    nameRu: "Алайку",
    nameEn: "Alaykuu",
    subtitle: L(
      "Кара-Кулжа районунун эң алыскы жана бийик тоолуу аймактарынын бири",
      "Один из самых отдалённых и высокогорных аймаков Кара-Кулжинского района",
      "One of the most remote and high-altitude areas of Kara-Kulja District",
    ),
    description: L(
      "Алайку - Кара-Кулжа районунун чыгышында, Кытай менен чектешкен бийик тоолуу өрөөн. Аймак 12 айылды бириктирип, анда 12 073 адам жашайт. Кең жайлоолору, тоолору, тунук суулары, салттуу мал чарбачылыгы жана өзгөчө жаратылышы Алайкуну туризм, айыл чарба жана инвестиция үчүн кызыктуу аймакка айлантат.",
      "Алайку - высокогорная долина на востоке Кара-Кулжинского района, граничащая с Китаем. Айыл аймак объединяет 12 сёл, где проживает 12 073 человека. Просторные пастбища, горы, чистые воды, традиционное животноводство и самобытная природа создают здесь хорошие возможности для туризма, сельского хозяйства и инвестиций.",
      "Alaykuu is a high-altitude valley in the eastern part of Kara-Kulja District, bordering China. The aiyl aimak brings together 12 villages with a population of 12,073. Its broad pastures, mountains, clear waters, traditional livestock farming and distinctive landscapes create strong potential for tourism, agriculture and investment.",
    ),
    population: 12073,
    image: territoryCardImg("alaikuu"),
    villages: [
      { name: "Көк-Арт", nameRu: "Көк-Арт", nameEn: "Kok-Art", slug: "kok-art", population: 2487, order: 1 },
      { name: "Кан-Коргон", nameRu: "Кан-Коргон", nameEn: "Kan-Korgon", slug: "kan-korgon", population: 2080, order: 2 },
      { name: "Бөрү-Токой", nameRu: "Бөрү-Токой", nameEn: "Boru-Tokoi", slug: "boru-tokoy", population: 177, order: 3 },
      { name: "Желе-Дөбө", nameRu: "Желе-Дөбө", nameEn: "Zhele-Dobo", slug: "zhele-dobo", population: 237, order: 4 },
      { name: "Ара-Булак", nameRu: "Ара-Булак", nameEn: "Ara-Bulak", slug: "ara-bulak", population: 177, order: 5 },
      { name: "Сай-Талаа", nameRu: "Сай-Талаа", nameEn: "Sai-Talaa", slug: "sai-talaa", population: null, order: 6 },
      { name: "Кайың-Талаа", nameRu: "Кайың-Талаа", nameEn: "Kaiyn-Talaa", slug: "kaiyn-talaa", population: 1228, order: 7 },
      { name: "Кызыл-Жар", nameRu: "Кызыл-Жар", nameEn: "Kyzyl-Zhar", slug: "kyzyl-zhar", population: 682, order: 8 },
      { name: "Күйө-Таш", nameRu: "Күйө-Таш", nameEn: "Kuyo-Tash", slug: "kuyotash", population: 1019, order: 9 },
      { name: "Чычырганак", nameRu: "Чычырганак", nameEn: "Chychyrganak", slug: "chychyrkanak", population: null, order: 10 },
      { name: "Коо-Чаты", nameRu: "Коо-Чаты", nameEn: "Koo-Chaty", slug: "koo-chaty", population: 2106, order: 11 },
      { name: "Терек", nameRu: "Терек", nameEn: "Terek", slug: "terek", population: 1197, order: 12 },
    ],
    detail: ALAYKUU_DETAIL,
  },
  {
    slug: "kara-guz",
    name: "Кара Гуз",
    nameRu: "Кара Гуз",
    nameEn: "Kara-Guz",
    subtitle: L("Дыйкан жерлер жана жылуу өрөөн", "Земледельческие земли и тёплая долина", "Farmland and a warm valley"),
    description: territoryCopy("Кара Гуз", "Kara-Guz", "айдоо талаалары менен эл эмгегинин аймагы"),
    population: 10306,
    image: territoryCardImg("kara-guz"),
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
    subtitle: L(
      "Район борборуна жакын дыйканчылык жана мал чарбачылык аймагы",
      "Территория земледелия и животноводства рядом с районным центром",
      "A farming territory close to the district centre",
    ),
    description: L(
      "Кара-Кочкор айыл аймагы Кара-Кулжа районунун борборуна жакын жайгашкан айыл аймактарынын бири. Аймак 8 айылды бириктирип, анда 18 940 адам жашайт. Негизги чарбалык багыттары - мал чарбачылыгы жана дыйканчылык. Айыл аймакта социалдык инфраструктураны, айыл чарбасын, тарыхый-маданий мурасты жана эс алуу багыттарын өнүктүрүүгө мүмкүнчүлүктөр бар.",
      "Кара-Кочкор - один из айыл аймаков, расположенных недалеко от районного центра Кара-Кульджинского района. Он объединяет 8 сёл с населением 18 940 человек. Основные направления хозяйства - животноводство и земледелие. Здесь имеются возможности для развития социальной инфраструктуры, сельского хозяйства, историко-культурного наследия и отдыха.",
      "Kara-Kochkor is one of the aiyl aimaks located near the centre of Kara-Kulja District. It brings together 8 villages with a population of 18,940. Its main livelihoods are livestock and crop farming. The territory has opportunities to develop social infrastructure, agriculture, historical-cultural heritage, and recreation.",
    ),
    population: 18940,
    image: territoryCardImg("kara-kochkor"),
    villages: [
      { name: "Кара-Кочкор", nameRu: "Кара-Кочкор", nameEn: "Kara-Kochkor", slug: "kara-kochkor", population: 4836, order: 1 },
      { name: "Ак-Кыя", nameRu: "Ак-Кыя", nameEn: "Ak-Kyya", slug: "ak-kyya", population: 2952, order: 2 },
      { name: "Сары-Булак", nameRu: "Сары-Булак", nameEn: "Sary-Bulak", slug: "sary-bulak-kara-kochkor", population: 1981, order: 3 },
      { name: "Жаңы-Талап", nameRu: "Жаңы-Талап", nameEn: "Jany-Talap", slug: "zhany-talap", population: 1873, order: 4 },
      { name: "Жийде", nameRu: "Жийде", nameEn: "Jiide", slug: "zhiyde", population: 1244, order: 5 },
      { name: "Октябрь", nameRu: "Октябрь", nameEn: "Oktyabr", slug: "oktyabr", population: 2746, order: 6 },
      { name: "Тоготой", nameRu: "Тоготой", nameEn: "Togotoy", slug: "togotoy", population: 2551, order: 7 },
      { name: "Ынтымак", nameRu: "Ынтымак", nameEn: "Yntymak", slug: "yntymak", population: 757, order: 8 },
    ],
    detail: KARA_KOCHKOR_DETAIL,
  },
  {
    slug: "oy-tal",
    name: "Ой-Тал",
    nameRu: "Ой-Тал",
    nameEn: "Oi-Tal",
    subtitle: L(
      "Кара-Кулжа районунун чыгышындагы тоолуу айыл аймак",
      "Горный айыл аймак в восточной части Кара-Кульджинского района",
      "A mountainous aiyl aimak in the eastern part of Kara-Kulja District",
    ),
    description: L(
      "Ой-Тал - Кара-Кулжа районунун чыгыш бөлүгүндө жайгашкан тоолуу айыл аймак. Аймак 6 айылды бириктирип, анда 6 134 адам жашайт. Калктын негизги чарбасы мал чарбачылыгы жана дыйканчылык менен байланышкан, ал эми тоолуу жаратылышы туризмди өнүктүрүүгө мүмкүнчүлүк түзөт.",
      "Ой-Тал - горный айыл аймак, расположенный в восточной части Кара-Кульджинского района. Аймак объединяет 6 сёл, в которых проживают 6 134 человека. Основные занятия населения связаны с животноводством и земледелием, а горная природа создаёт возможности для развития туризма.",
      "Oi-Tal is a mountainous aiyl aimak located in the eastern part of Kara-Kulja District. The aimak unites 6 villages with a population of 6,134. The main livelihoods are livestock farming and agriculture, while its mountain landscape creates opportunities for tourism development.",
    ),
    population: 6134,
    image: territoryCardImg("oy-tal"),
    villages: [
      { name: "Сары-Бээ", nameRu: "Сары-Бээ", nameEn: "Sary-Bee", slug: "sary-bee", population: 1143, order: 1 },
      { name: "Кара-Таш", nameRu: "Кара-Таш", nameEn: "Kara-Tash", slug: "kara-tash", population: 901, order: 2 },
      { name: "Терек-Суу", nameRu: "Терек-Суу", nameEn: "Terek-Suu", slug: "terek-suu", population: 502, order: 3 },
      { name: "Ничке-Суу", nameRu: "Ничке-Суу", nameEn: "Nichke-Suu", slug: "nichke-suu", population: 303, order: 4 },
      { name: "Ой-Тал", nameRu: "Ой-Тал", nameEn: "Oi-Tal", slug: "oy-tal", population: 2077, order: 5 },
      { name: "Көңдүк", nameRu: "Көңдүк", nameEn: "Konduk", slug: "konduk", population: 1208, order: 6 },
    ],
    detail: OI_TAL_DETAIL,
  },
  {
    slug: "ryspai-abdykadyrov",
    name: "Рыспай Абдыкадыров",
    nameRu: "Рыспай Абдыкадыров",
    nameEn: "Ryspai Abdykadyrov",
    subtitle: L("Булактар жана жашыл ойдуңдар", "Родники и зелёные низины", "Springs and green hollows"),
    description: territoryCopy("Рыспай Абдыкадыров", "Ryspai Abdykadyrov", "суунун үнү айылдарды бириктирген аймак"),
    population: 4968,
    image: territoryCardImg("ryspai-abdykadyrov"),
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
    subtitle: L("Тар дарыясынын өрөөнүндөгү тоолуу аймак", "Горная территория в долине реки Тар", "Mountain territory in the Tar River valley"),
    description: L(
      "Ылай-Талаа - Тар дарыясынын өрөөнүндө жайгашкан тоолуу аймак. Тоолуу жаратылышы туризмди өнүктүрүүгө, ал эми айыл чарба мүмкүнчүлүктөрү агрардык долбоорлорго шарт түзөт. Ылай-Талаа 9 айылды бириктирип, анда 17 501 адам жашайт.",
      "Ылай-Талаа - горная территория, расположенная в долине реки Тар. Горная природа создает возможности для развития туризма, а сельскохозяйственный потенциал - для аграрных проектов. Ылай-Талаа объединяет 9 сёл, здесь проживает 17 501 человек.",
      "Ylai-Talaa - a mountainous territory located in the Tar River valley. Its mountain landscape creates opportunities for tourism development, while its agricultural potential supports agrarian projects. Ylai-Talaa brings together 9 villages and has a population of 17,501.",
    ),
    population: 17501,
    image: territoryCardImg("ylai-talaa"),
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
    detail: YLAI_TALAA_DETAIL,
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
