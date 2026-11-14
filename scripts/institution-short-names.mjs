// One-time import preparation, not runtime display logic or a translation service.
// Abbreviate names already present in the approved KG/RU/EN workbook.
const initial = (word) => {
  const match = /^(Zh|Sh|Ch|Kh|Ts|Yu|Ya)/i.exec(word);
  return `${match ? match[0] : Array.from(word)[0]}.`;
};

export function schoolShortName(name, lang, number) {
  const own =
    lang === "kg"
      ? name
          .split(" атындагы")[0]
          .replace(/ жалпы.*$/, "")
          .replace(/ мектеп$/, "")
      : lang === "ru"
        ? name.replace(
            /^(?:Авторская общеобразовательная школа|Общеобразовательная школа(?: Жаңы-Талап| Ак-Кыя| Карагуз| Токбай-Талаа| Терек-Суу| Сары-Бээ| Көңдүк| Сай-Талаа)?|Школа-интернат|Средняя школа|Основная школа|Начальная школа|Школа)\s*(?:им\.\s*)?/,
            "",
          )
        : name.replace(
            / (?:General Education|Secondary|Basic|Primary|Boarding|Author)?\s*School$/,
            "",
          );
  if ([1, 2, 17, 21, 22, 47, 48, 53].includes(number)) return own.trim();
  if (number === 16) return lang === "en" ? "Suban uulu Almas" : "Субан уулу Алмас";
  if (number === 44) return lang === "en" ? "Nurmamat uulu Sabyrkul" : "Нурмамат уулу Сабыркул";
  if (number === 30) return lang === "en" ? "Zh. Ibraimov" : "Ж. Ибраимов";
  if (number === 37) return lang === "en" ? "K. Chargynov" : "К. Чаргынов";
  if (number === 9) return lang === "en" ? "O. Saydilkanov" : "О. Сайдилканов";
  const [first, family] = own.trim().split(/\s+/);
  if (!first || !family) throw new Error(`Cannot prepare school short name ${number}/${lang}`);
  return `${initial(first)} ${family}`;
}

export function kindergartenShortName(name, lang, number) {
  if (number === 3) return lang === "en" ? "Sulayka azhy ene" : "«Сулайка ажы эне»";
  if (number === 27 && lang === "en") return "№5 «Balapan»";
  if (number === 56) return lang === "en" ? "Zh. Mamyr" : "Ж. Мамыр";
  return (
    lang === "kg"
      ? name.replace(
          /\s+(?:атындагы\s+)?(?:мектеп алдындагы бала бакча|бала бакчасы|бала бакча)$/,
          "",
        )
      : lang === "ru"
        ? name.replace(/^(?:Детский сад|Дошкольное отделение при школе)\s*(?:им\.\s*)?/, "")
        : name.replace(/ (?:Kindergarten|School Preschool Unit)$/, "")
  ).trim();
}
