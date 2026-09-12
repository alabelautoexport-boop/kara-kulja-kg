import type { Lang } from "@/lib/i18n";

export type Localized<T> = Record<Lang, T>;

export type PersonProfile = {
  slug: string;
  name: Localized<string>;
  role: Localized<string>;
  body: Localized<string>;
  image?: string;
  territorySlugs?: string[];
  villageSlugs?: string[];
  featuredOnHome?: boolean;
  featuredInPeople?: boolean;
};

const L = (kg: string, ru: string, en: string): Localized<string> => ({ kg, ru, en });

export const PEOPLE: PersonProfile[] = [
  {
    slug: "sooronbay-jusuev",
    name: L("Сооронбай Жусуев", "Сооронбай Жусуев", "Sooronbay Jusuev"),
    role: L("Кыргыз Республикасынын Баатыры жана Эл акыны.", "Герой Кыргызской Республики. Народный писатель.", "Hero of the Kyrgyz Republic. People’s Writer."),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Jusuev.jpg",
    territorySlugs: ["alaikuu"],
    villageSlugs: ["kyzyl-zhar"],
    body: L(
      "Кыргыз поэзиясынын залкар өкүлдөрүнүн бири, Кыргыз Республикасынын Баатыры жана Эл акыны. Анын чыгармалары мекенге болгон сүйүүнү, адамдык наркты жана улуттук рухту терең чагылдырган.",
      "Один из выдающихся представителей кыргызской поэзии, Герой Кыргызской Республики и Народный писатель Кыргызстана. Его произведения глубоко отражали любовь к Родине, человеческие ценности и национальный дух кыргызского народа.",
      "One of the most prominent figures in Kyrgyz poetry, a Hero of the Kyrgyz Republic, and a People’s Poet of Kyrgyzstan. His works deeply reflected patriotism, human values, and the national spirit of the Kyrgyz people.",
    ),
  },
  {
    slug: "kurmanaly-matikeev",
    name: L("Курманалы Матикеев", "Курманалы Матикеев", "Kurmanaly Matikeev"),
    role: L(
      "География илимдеринин доктору, профессор",
      "Доктор географических наук, профессор",
      "Doctor of Geographical Sciences, professor",
    ),
    territorySlugs: ["alaikuu"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1941-жылы Кызыл-Жар айылында төрөлгөн географ окумуштуу, география илимдеринин доктору жана профессор. Кыргызстандагы тоо процесстерин, кар, жер, таш көчкү жана сел кубулуштарын изилдөөгө чоң салым кошкон.",
      "Учёный-географ, доктор географических наук и профессор, родился в 1941 году в селе Кызыл-Жар. Внёс большой вклад в изучение горных процессов Кыргызстана, включая снежные лавины, оползни, камнепады и сели.",
      "A geographer, Doctor of Geographical Sciences, and professor born in 1941 in Kyzyl-Zhar. He made a major contribution to research on mountain processes in Kyrgyzstan, including snow avalanches, landslides, rockfalls, and mudflows.",
    ),
  },
  {
    slug: "kozhogeldi-kuluev",
    name: L("Кожогелди Кулуев", "Кожогелди Кулуев", "Kozhogeldi Kuluev"),
    role: L(
      "Акын, драматург жана котормочу",
      "Поэт, драматург и переводчик",
      "Poet, playwright and translator",
    ),
    territorySlugs: ["alaikuu"],
    villageSlugs: ["kok-art"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1960-жылы Көк-Арт айылында төрөлгөн акын, драматург жана котормочу. Кыргыз Республикасынын эл акыны, ТҮРКСОЙдун алтын медалынын ээси. Кыргыз адабияты менен котормо өнөрүнүн өнүгүшүнө чоң салым кошкон.",
      "Поэт, драматург и переводчик, родился в 1960 году в селе Көк-Арт. Народный поэт Кыргызской Республики, обладатель золотой медали ТЮРКСОЙ. Внёс большой вклад в развитие кыргызской литературы и искусства перевода.",
      "A poet, playwright, and translator born in 1960 in Kok-Art. He is a People's Poet of the Kyrgyz Republic and a recipient of the TURKSOY Gold Medal. He made a major contribution to Kyrgyz literature and the art of translation.",
    ),
  },
  {
    slug: "osmonakun-ibraimov",
    name: L("Осмонакун Ибраимов", "Осмонакун Ибраимов", "Osmonakun Ibraimov"),
    role: L(
      "Адабиятчы, окумуштуу жана мамлекеттик ишмер",
      "Литературовед, учёный и государственный деятель",
      "Literary scholar, academic and statesman",
    ),
    territorySlugs: ["alaikuu"],
    villageSlugs: ["kan-korgon"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1954-жылы Кан-Коргон айылында төрөлгөн адабиятчы, окумуштуу жана мамлекеттик ишмер. Филология илимдеринин доктору, профессор, Кыргыз УИАнын корреспондент-мүчөсү. Илим, адабият жана мамлекеттик кызмат тармактарында көрүнүктүү эмгек өтөгөн.",
      "Литературовед, учёный и государственный деятель, родился в 1954 году в селе Кан-Коргон. Доктор филологических наук, профессор, член-корреспондент Национальной академии наук Кыргызской Республики. Внёс заметный вклад в науку, литературу и государственную службу.",
      "A literary scholar, academic, and statesman born in 1954 in Kan-Korgon. He is a Doctor of Philological Sciences, professor, and corresponding member of the National Academy of Sciences of the Kyrgyz Republic. He made a notable contribution to scholarship, literature, and public service.",
    ),
  },
  {
    slug: "ryspai-abdykadyrov",
    name: L("Рыспай Абдыкадыров", "Рыспай Абдыкадыров", "Ryspai Abdykadyrov"),
    role: L("Обончу, аткаруучу жана композитор", "Композитор, исполнитель и музыкант", "Composer, performer, and musician"),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Abdykadyrov.jpg",
    body: L(
      "Кыргыз музыкасынын легендасына айланган таланттуу обончу, аткаруучу жана композитор. Анын обондору кыргыз маданиятынын алтын мурасына айланып, бүгүнкү күнгө чейин эл арасында сүйүү менен ырдалып келет.",
      "Талантливый композитор, исполнитель и музыкант, ставший легендой кыргызской музыки. Его песни вошли в золотое наследие кыргызской культуры и до сих пор любимы народом.",
      "A talented composer, performer, and musician who became a legend of Kyrgyz music. His songs became part of the golden heritage of Kyrgyz culture and remain beloved by the people to this day.",
    ),
  },
  {
    slug: "torobek-abakirov",
    name: L("Төрөбек Абакиров", "Торобек Абакиров", "Torobek Abakirov"),
    role: L("Кыргыз балбаны", "Кыргызский силач", "Kyrgyz strongman"),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Abakirov.jpg",
    body: L(
      "1910-жылы Кара-Кулжа районунун Ылай-Талаа айылында төрөлгөн, Орто Азияга таанылган кыргыз балбаны. Ал күрөш жана ат үстүндөгү оодарыш өнөрүндө өзгөчө чеберчилиги менен элге кеңири белгилүү болгон.",
      "Родился в 1910 году в селе Ылай-Талаа Кара-Кулжинского района. Известный кыргызский силач, прославившийся мастерством в борьбе и конном состязании оодарыш далеко за пределами Кыргызстана.",
      "Born in 1910 in Ylay-Talaa village of the Kara-Kulja District. A renowned Kyrgyz strongman widely known for his exceptional skill in traditional wrestling and the horseback contest known as oodarysh.",
    ),
  },
  {
    slug: "akun-toktosartov",
    name: L("Акун Токтосартов", "Акун Токтосартов", "Akun Toktosartov"),
    role: L("Мамлекеттик жана коомдук ишмер", "Государственный и общественный деятель", "Statesman and public figure"),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Akun-Toktosartov.jpg",
    body: L(
      "Кыргызстандын маданият тармагына чоң салым кошкон мамлекеттик жана коомдук ишмер. Акун Токтосартов улуттук маданиятты өнүктүрүүгө жана кыргыз руханий мурасын сактоого өмүрүн арнаган инсандардын бири.",
      "Государственный и общественный деятель, внесший большой вклад в развитие культуры Кыргызстана. Акун Токтосартов посвятил свою жизнь развитию национальной культуры и сохранению духовного наследия кыргызского народа.",
      "A statesman and public figure who made a significant contribution to the cultural development of Kyrgyzstan. Akun Toktosartov devoted his life to the promotion of national culture and the preservation of the spiritual heritage of the Kyrgyz people.",
    ),
  },
  {
    slug: "jenishbek-shamshiev",
    name: L("Жеңишбек Шамшиев", "Женишбек Шамшиев", "Jenishbek Shamshiev"),
    role: L(
      "Обончу, аткаруучу жана коомдук ишмер",
      "Композитор, исполнитель и общественный деятель",
      "Composer, performer, and public figure",
    ),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Shamshiev.jpg",
    body: L(
      "Кыргыз музыка өнөрүндө өзгөчө орунду ээлеген белгилүү обончу, аткаруучу жана коомдук ишмер, Кыргыз Республикасынын эмгек сиңирген артисти. Анын 30дан ашуун обону кыргыз музыкасынын алтын фондуна кирип, эл арасында кеңири таанылган.",
      "Известный кыргызский композитор, исполнитель и общественный деятель, заслуженный артист Кыргызской Республики. Более 30 его произведений вошли в золотой фонд кыргызской музыки и получили широкое признание среди слушателей.",
      "A prominent Kyrgyz composer, performer, and public figure, Honored Artist of the Kyrgyz Republic. More than 30 of his musical works have become part of the golden collection of Kyrgyz music and are widely recognized by audiences.",
    ),
  },
  {
    slug: "marish-baatyrov",
    name: L("Мариш Баатыров", "Мариш Баатыров", "Marish Baatyrov"),
    role: L(
      "Мамлекеттик жана коомдук ишмер",
      "Государственный и общественный деятель",
      "Statesman and public figure",
    ),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Baatyrov.jpg",
    territorySlugs: ["ylai-talaa"],
    villageSlugs: ["ylai-talaa"],
    featuredOnHome: true,
    featuredInPeople: true,
    body: L(
      "1922-жылы Ылай-Талаа айылында төрөлгөн мамлекеттик жана коомдук ишмер. Карл Маркс атындагы колхозду дээрлик 25 жыл жетектеп, айылдын өнүгүшүнө салым кошкон. Кыргыз ССР Жогорку Советине эки жолу депутат болуп шайланган. Ленин, Эмгек Кызыл Туу жана Ардак Белгиси ордендери менен сыйланган.",
      "Государственный и общественный деятель, родился в 1922 году в селе Ылай-Талаа. Почти 25 лет руководил колхозом имени Карла Маркса, внес вклад в развитие села. Дважды избирался депутатом Верховного Совета Киргизской ССР. Награжден орденами Ленина, Трудового Красного Знамени и «Знак Почёта».",
      "A statesman and public figure born in 1922 in the village of Ylai-Talaa. He led the Karl Marx collective farm for nearly 25 years, contributing to the village’s development. He was twice elected to the Supreme Soviet of the Kirghiz SSR and received the Orders of Lenin, the Red Banner of Labour, and the Badge of Honour.",
    ),
  },
  {
    slug: "bedelbay-isaev",
    name: L("Беделбай Исаев", "Беделбай Исаев", "Bedelbay Isaev"),
    role: L(
      "Колхоз жетекчиси, Социалисттик Эмгектин Баатыры",
      "Руководитель колхоза, Герой Социалистического Труда",
      "Collective farm leader, Hero of Socialist Labour",
    ),
    territorySlugs: ["ylai-talaa"],
    villageSlugs: ["tokbay-talaa"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1911-жылы Токбай-Талаа айылында төрөлгөн колхоз жетекчиси, Социалисттик Эмгектин Баатыры. Ленинчи-Жаш колхозун 18 жыл жетектеп, айылдын өнүгүшүнө салым кошкон. Электрлештирүү, суу менен камсыздоо жана оорукананын курулушуна көмөктөшкөн. Ленин ордени, ардак грамоталар жана медалдар менен сыйланган.",
      "Руководитель колхоза, Герой Социалистического Труда, родился в 1911 году в селе Токбай-Талаа. Возглавлял колхоз «Ленинчи-Жаш» 18 лет, способствовал развитию села, электрификации, водоснабжению и строительству больницы. Награжден орденом Ленина, почётными грамотами и медалями.",
      "A collective farm leader and Hero of Socialist Labour, born in 1911 in Tokbay-Talaa. He headed the Leninchi-Zhash collective farm for 18 years, supporting village development, electrification, water supply, and hospital construction. He received the Order of Lenin, honorary certificates, and medals.",
    ),
  },
  {
    slug: "mamyt-abakirov",
    name: L("Мамыт Абакиров", "Мамыт Абакиров", "Mamyt Abakirov"),
    role: L(
      "Согуш ардагери, Социалисттик Эмгектин Баатыры",
      "Ветеран войны, Герой Социалистического Труда",
      "War veteran, Hero of Socialist Labour",
    ),
    territorySlugs: ["ylai-talaa"],
    villageSlugs: ["tokbay-talaa"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1912-жылы Токбай-Талаа айылында төрөлгөн согуш ардагери, Социалисттик Эмгектин Баатыры. Экинчи дүйнөлүк согушта сапер болуп кызмат өтөп, кийин жылкы чарбасын жетектеген. Ленин, Кызыл Жылдыз жана 3-даражадагы Даңк ордендери менен сыйланган. Токбай-Талаа мектеби анын ысымын алып жүрөт.",
      "Ветеран войны, Герой Социалистического Труда, родился в 1912 году в селе Токбай-Талаа. Во Второй мировой войне служил сапером, затем руководил коневодческим хозяйством. Награжден орденами Ленина, Красной Звезды и Славы III степени. Школа в Токбай-Талаа носит его имя.",
      "A war veteran and Hero of Socialist Labour, born in 1912 in Tokbay-Talaa. He served as a combat engineer during World War II and later managed a horse farm. He received the Orders of Lenin, the Red Star, and Glory, Third Class. The school in Tokbay-Talaa bears his name.",
    ),
  },
  {
    slug: "kadyrali-konkobaev",
    name: L("Кадырали Конкобаев", "Кадырали Конкобаев", "Kadyrali Konkobaev"),
    role: L(
      "Белгилүү түрколог, профессор",
      "Известный тюрколог, профессор",
      "Prominent Turkologist and professor",
    ),
    territorySlugs: ["alaikuu"],
    villageSlugs: ["koo-chaty"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "Белгилүү түрколог, филология илимдеринин кандидаты, профессор. 1948-жылы Коо-Чаты айылында төрөлгөн. Бишкек гуманитардык университетинин негиздөөчү-ректору болуп, кыргыз жана түрк тил илиминин өнүгүшүнө чоң салым кошкон.",
      "Известный тюрколог, кандидат филологических наук и профессор, родился в 1948 году в селе Коо-Чаты. Был основателем и ректором Бишкекского гуманитарного университета. Внёс большой вклад в развитие кыргызского и тюркского языкознания.",
      "A prominent Turkologist, Candidate of Philological Sciences, and professor born in 1948 in Koo-Chaty. He was the founder and rector of Bishkek Humanities University. He made a major contribution to Kyrgyz and Turkic linguistics.",
    ),
  },
  {
    slug: "emil-toktoshev",
    name: L("Эмил Токтошев", "Эмил Токтошев", "Emil Toktoshev"),
    role: L(
      "Мамлекеттик жана коомдук ишмер",
      "Государственный и общественный деятель",
      "Statesman and public figure",
    ),
    territorySlugs: ["alaikuu"],
    villageSlugs: ["kuyotash"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1974-жылы Күйө-Таш айылында төрөлгөн мамлекеттик жана коомдук ишмер. Кыргыз Республикасынын Жогорку Кеңешинин депутаты болуп иштеп, парламенттик жана коомдук ишмердүүлүккө активдүү катышкан.",
      "Государственный и общественный деятель, родился в 1974 году в селе Күйө-Таш. Работал депутатом Жогорку Кенеша Кыргызской Республики и активно участвовал в парламентской и общественной деятельности.",
      "A statesman and public figure born in 1974 in Kuyo-Tash. He served as a member of the Jogorku Kenesh of the Kyrgyz Republic and took an active part in parliamentary and public life.",
    ),
  },
  {
    slug: "shaken-kadyrov",
    name: L("Шакен Кадыров", "Шакен Кадыров", "Shaken Kadyrov"),
    role: L(
      "Обончу, аткаруучу жана коомдук ишмер",
      "Композитор, исполнитель и общественный деятель",
      "Composer, performer and public figure",
    ),
    territorySlugs: ["alaikuu"],
    villageSlugs: ["terek"],
    featuredOnHome: false,
    featuredInPeople: false,
    body: L(
      "1946-жылы Терек айылында төрөлгөн обончу, аткаруучу жана коомдук ишмер. Көп жылдар бою Кара-Кулжа районунун маданият тармагында эмгектенип, аймактагы маданий турмуштун өнүгүшүнө олуттуу салым кошкон.",
      "Композитор, исполнитель и общественный деятель, родился в 1946 году в селе Терек. Много лет работал в сфере культуры Кара-Кулжинского района и внёс значительный вклад в развитие культурной жизни региона.",
      "A composer, performer and public figure born in 1946 in Terek. He worked for many years in the cultural sector of Kara-Kulja District and made a significant contribution to the region's cultural life.",
    ),
  },
  {
    slug: "sooronbay-jeenbekov",
    name: L("Сооронбай Жээнбеков", "Сооронбай Жээнбеков", "Sooronbay Jeenbekov"),
    role: L("Мамлекеттик жана коомдук ишмер", "Государственный и общественный деятель", "Statesman and public figure"),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Jeenbekov.jpg",
    body: L(
      "Кыргыз Республикасынын 5-президенти, мамлекеттик жана коомдук ишмер. Өлкөнүн коомдук-саясий турмушунда маанилүү орунду ээлеген белгилүү инсандардын бири.",
      "5-й Президент Кыргызской Республики, государственный и общественный деятель. Один из известных уроженцев Кара-Кульджинского района, сыгравший важную роль в общественно-политической жизни страны.",
      "The 5th President of the Kyrgyz Republic, statesman, and public figure. One of the well-known natives of Kara-Kulja District who played an important role in the country’s public and political life.",
    ),
  },
  {
    slug: "maksatbek-azhy-toktomushev",
    name: L("Максатбек Ажы Токтомушев", "Максатбек Ажы Токтомушев", "Maksatbek Azhy Toktomushev"),
    role: L(
      "Мурдагы Азирети Муфтий, диний жана коомдук ишмер",
      "Бывший Азирети Муфтий, религиозный и общественный деятель",
      "Former Azireti Mufti, religious and public figure",
    ),
    image: "https://media.kara-kulja.kg/general/insandar/photos/Toktomushev.jpg",
    body: L(
      "Кыргыз Республикасынын мурдагы Азирети Муфтийи, белгилүү диний жана коомдук ишмер. Ал көп жылдар бою өлкөнүн диний турмушунда активдүү кызмат өтөп, ислам дининин баалуулуктарын, руханий тарбияны жана адеп-ахлак принциптерин жайылтууга олуттуу салым кошуп келет.",
      "Бывший Азирети Муфтий Кыргызской Республики, известный религиозный и общественный деятель. На протяжении многих лет он активно участвует в религиозной жизни страны, внося значительный вклад в распространение исламских ценностей, духовного воспитания и нравственных принципов.",
      "Former Azireti Mufti of the Kyrgyz Republic and a prominent religious and public figure. For many years, he has played an active role in the country’s religious life, making a significant contribution to promoting Islamic values, spiritual education, and moral principles.",
    ),
  },
];

export const pick = <T,>(loc: Localized<T>, lang: Lang): T => loc[lang] ?? loc.kg;

export const getPersonBySlug = (slug: string) => PEOPLE.find((person) => person.slug === slug);

export const getPeopleForTerritory = (territorySlug: string) =>
  PEOPLE.filter((person) => person.territorySlugs?.includes(territorySlug));

export const getPeopleForVillage = (villageSlug: string) =>
  PEOPLE.filter((person) => person.villageSlugs?.includes(villageSlug));
