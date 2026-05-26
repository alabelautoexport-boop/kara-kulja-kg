import type { Lang } from "@/lib/i18n";

export type Localized<T> = Record<Lang, T>;

export type PersonProfile = {
  name: Localized<string>;
  role: Localized<string>;
  body: Localized<string>;
  image: string;
};

const L = (kg: string, ru: string, en: string): Localized<string> => ({ kg, ru, en });

export const PEOPLE: PersonProfile[] = [
  {
    name: L("Сооронбай Жусуев", "Сооронбай Жусуев", "Sooronbay Jusuev"),
    role: L("Кыргыз Республикасынын Баатыры", "Герой Кыргызской Республики", "Hero of the Kyrgyz Republic"),
    image: "/images/people/Jusuev.jpg",
    body: L(
      "Кыргыз поэзиясынын залкар өкүлдөрүнүн бири, Кыргыз Республикасынын Баатыры. Анын чыгармалары мекенге болгон сүйүүнү, адамдык наркты жана улуттук рухту терең чагылдырган.",
      "Один из выдающихся представителей кыргызской поэзии, Герой Кыргызской Республики. Его произведения глубоко отражали любовь к Родине, человеческие ценности и национальный дух кыргызского народа.",
      "One of the most prominent figures in Kyrgyz poetry and a Hero of the Kyrgyz Republic. His works reflected patriotism, human values, and the national spirit of the Kyrgyz people.",
    ),
  },
  {
    name: L("Рыспай Абдыкадыров", "Рыспай Абдыкадыров", "Ryspai Abdykadyrov"),
    role: L("Обончу, аткаруучу жана композитор", "Композитор, исполнитель и музыкант", "Composer, performer, and musician"),
    image: "/images/people/Abdykadyrov.jpg",
    body: L(
      "Кыргыз музыкасынын легендасына айланган таланттуу обончу, аткаруучу жана композитор. Анын обондору кыргыз маданиятынын алтын мурасына айланып, бүгүнкү күнгө чейин эл арасында сүйүү менен ырдалып келет.",
      "Талантливый композитор, исполнитель и музыкант, ставший легендой кыргызской музыки. Его песни вошли в золотое наследие кыргызской культуры и до сих пор любимы народом.",
      "A talented composer, performer, and musician who became a legend of Kyrgyz music. His songs became part of the golden heritage of Kyrgyz culture and remain beloved by the people to this day.",
    ),
  },
  {
    name: L("Акун Токтосартов", "Акун Токтосартов", "Akun Toktosartov"),
    role: L("Мамлекеттик жана коомдук ишмер", "Государственный и общественный деятель", "Statesman and public figure"),
    image: "/images/people/Akun-Toktosartov.jpg",
    body: L(
      "Кыргызстандын маданият тармагына чоң салым кошкон мамлекеттик жана коомдук ишмер. Акун Токтосартов улуттук маданиятты өнүктүрүүгө жана кыргыз руханий мурасын сактоого өмүрүн арнаган инсандардын бири.",
      "Государственный и общественный деятель, внесший большой вклад в развитие культуры Кыргызстана. Акун Токтосартов посвятил свою жизнь развитию национальной культуры и сохранению духовного наследия кыргызского народа.",
      "A statesman and public figure who made a significant contribution to the cultural development of Kyrgyzstan. Akun Toktosartov devoted his life to the promotion of national culture and the preservation of the spiritual heritage of the Kyrgyz people.",
    ),
  },
  {
    name: L("Сооронбай Жээнбеков", "Сооронбай Жээнбеков", "Sooronbay Jeenbekov"),
    role: L("Мамлекеттик жана саясий ишмер", "Государственный и политический деятель", "Statesman and political figure"),
    image: "/images/people/Jeenbekov.jpg",
    body: L(
      "Кыргыз Республикасынын 5-президенти, мамлекеттик жана саясий ишмер. Өлкөнүн коомдук-саясий турмушунда маанилүү орунду ээлеген белгилүү инсандардын бири.",
      "5-й Президент Кыргызской Республики, государственный и политический деятель. Один из известных уроженцев Кара-Кульджинского района, сыгравший важную роль в общественно-политической жизни страны.",
      "The 5th President of the Kyrgyz Republic, statesman, and political figure. One of the well-known natives of Kara-Kulja who played an important role in the country's public and political life.",
    ),
  },
];

export const pick = <T,>(loc: Localized<T>, lang: Lang): T => loc[lang] ?? loc.kg;
