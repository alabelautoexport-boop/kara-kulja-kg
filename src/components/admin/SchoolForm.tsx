import { useState, type ReactNode } from "react";
import { AdminSchoolForm } from "./AdminSchoolForm";
import { schoolStatus } from "@/lib/school-admin";
import { Plus, Trash2, Save, Send, Check, Undo2, EyeOff } from "lucide-react";
import { useAdminI18n } from "@/lib/admin-i18n";
import { TERRITORIES, displayTerritoryName, displayVillageName } from "@/lib/territories-data";
import { parseOrtScores, ORT_RANGES } from "@/lib/school-ort";
import { prepareActiveSchoolDraft, type SchoolValidationIssue } from "@/lib/school-form-validation";
import {
  saveSchoolDraft,
  reviewSchool,
  type SchoolDraft,
  type SchoolRecord,
  type SchoolAchievement,
  type SchoolResource,
} from "@/lib/schools-data";

const inputClass =
  "mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--beige)]";
const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
const categories = [
  "olympiad",
  "sport",
  "competition",
  "district",
  "regional",
  "national",
  "international",
  "other",
];
const types = [
  "official",
  "practice",
  "material",
  "document",
  "website",
  "course",
  "announcement",
  "other",
];
const categoryLabels = [
  "Олимпиада",
  "Спорт",
  "Конкурс",
  "Районный",
  "Областной",
  "Республиканский",
  "Международный",
  "Другое",
];
const resourceLabels = [
  "Официальный ресурс",
  "Пробный тест",
  "Учебный материал",
  "PDF / документ",
  "Полезный сайт",
  "Курс",
  "Объявление",
  "Другое",
];
const blankAchievement: SchoolAchievement = {
  date: "",
  title_kg: "",
  title_ru: "",
  title_en: "",
  description_kg: "",
  description_ru: "",
  description_en: "",
  category: "",
};
const blankResource: SchoolResource = {
  title_kg: "",
  title_ru: "",
  title_en: "",
  description_kg: "",
  description_ru: "",
  description_en: "",
  type: "material",
  url: "",
  year: null,
  source: "",
};
// Temporarily frozen in both workspaces; retained for a future product decision.
const extendedSchoolSectionsEnabled = false;

export function SchoolForm({
  admin,
  ...props
}: {
  record: SchoolRecord;
  initial: SchoolDraft;
  admin: boolean;
  onSaved: (message?: string) => Promise<void>;
}) {
  return admin ? <AdminSchoolForm {...props} /> : <SchoolEditorForm {...props} admin={false} />;
}

function SchoolEditorForm({
  record,
  initial,
  admin,
  onSaved,
}: {
  record: SchoolRecord;
  initial: SchoolDraft;
  admin: boolean;
  onSaved: (message?: string) => Promise<void>;
}) {
  const { t, locale } = useAdminI18n();
  const [draft, setDraft] = useState(initial);
  const [scoreTexts, setScoreTexts] = useState(initial.ort.map((o) => o.scores.join("\n")));
  const [ortTouched, setOrtTouched] = useState(initial.ort.map(() => true));
  const [issues, setIssues] = useState<SchoolValidationIssue[]>([]);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const locked = !!record.is_archived || (!admin && record.status === "review");
  const parsed = scoreTexts.map(parseOrtScores);
  const update = (next: SchoolDraft) => {
    setDraft(next);
    setDirty(true);
    setIssues([]);
    setMessage("");
  };
  const info = (key: keyof SchoolDraft["info"], value: string) =>
    update({ ...draft, info: { ...draft.info, [key]: value } });
  const action = async (run: () => Promise<void>, success = "Сохранено.") => {
    setBusy(true);
    setMessage("");
    try {
      await run();
      await onSaved(success);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Не удалось сохранить школу.");
    } finally {
      setBusy(false);
    }
  };
  const save = async (submit: boolean) => {
    const prepared = prepareActiveSchoolDraft(draft, scoreTexts, ortTouched);
    setIssues(prepared.issues);
    setMessage("");
    if (prepared.issues.length) {
      return;
    }
    await action(
      () => saveSchoolDraft(record.id, record.revision, prepared.payload, submit),
      submit ? "Отправлено на рассмотрение" : "Черновик сохранён",
    );
  };
  const section = (heading: string, children: ReactNode) => (
    <section className="border-t hairline py-8">
      <h2 className="mb-6 font-display text-2xl">{t(heading)}</h2>
      {children}
    </section>
  );
  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    type = "text",
    required = false,
  ) => (
    <label className="block min-w-0 text-sm text-muted-foreground">
      {t(label)}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        maxLength={type === "text" ? 300 : undefined}
      />
    </label>
  );
  const remove = (label: string, onClick: () => void) => (
    <button
      type="button"
      aria-label={t(label)}
      title={t(label)}
      className={buttonClass}
      onClick={onClick}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
  const localizedFields = (
    entry: SchoolAchievement | SchoolResource,
    onChange: (next: SchoolAchievement | SchoolResource) => void,
    descriptionRequired = false,
  ) => (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      {(["kg", "ru", "en"] as const).map((lang) => (
        <label key={`title-${lang}`} className="block min-w-0 text-sm text-muted-foreground">
          {t("Заголовок")} {lang.toUpperCase()}
          {lang === "kg" ? " *" : ""}
          <input
            required={lang === "kg"}
            maxLength={300}
            className={inputClass}
            value={entry[`title_${lang}`] ?? ""}
            onChange={(e) => onChange({ ...entry, [`title_${lang}`]: e.target.value })}
          />
        </label>
      ))}
      {(["kg", "ru", "en"] as const).map((lang) => (
        <label key={`description-${lang}`} className="block min-w-0 text-sm text-muted-foreground">
          {t("Краткое описание")} {lang.toUpperCase()}
          <textarea
            required={descriptionRequired && lang === "kg"}
            maxLength={3000}
            rows={3}
            className={inputClass}
            value={entry[`description_${lang}`] ?? ""}
            onChange={(e) => onChange({ ...entry, [`description_${lang}`]: e.target.value })}
          />
        </label>
      ))}
    </div>
  );

  return (
    <div className="min-w-0">
      <p className="mb-3 text-sm">
        {t("Статус")}: {t(schoolStatus(record))}
      </p>
      {record.review_note && (
        <p className="mb-4 whitespace-pre-line text-sm text-[var(--beige)]">{record.review_note}</p>
      )}
      <p className="mb-6 text-sm text-muted-foreground">
        {t("Не указывайте имена учащихся или другие персональные данные.")}
      </p>
      {locked && !record.is_archived && (
        <p className="mb-6 text-sm text-[var(--beige)]">
          {t("Изменения на проверке. Дождитесь решения администратора.")}
        </p>
      )}
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void save(false);
        }}
      >
        <fieldset disabled={busy || locked} className="min-w-0">
          {section(
            "Общая информация",
            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              {admin &&
                field("Slug", draft.info.slug ?? record.slug, (v) => info("slug", v), "text", true)}
              {admin &&
                field(
                  "Название школы KG",
                  draft.info.name_kg,
                  (v) => info("name_kg", v),
                  "text",
                  true,
                )}
              {admin && field("Название школы RU", draft.info.name_ru, (v) => info("name_ru", v))}
              {admin && field("Название школы EN", draft.info.name_en, (v) => info("name_en", v))}
              {admin && (
                <label className="block min-w-0 text-sm text-muted-foreground">
                  {t("Айыл аймак")}
                  <select
                    disabled={!admin}
                    className={inputClass}
                    value={draft.info.territory_slug}
                    onChange={(e) =>
                      update({
                        ...draft,
                        info: { ...draft.info, territory_slug: e.target.value, village_slug: "" },
                      })
                    }
                  >
                    <option value="">{t("Не выбрано")}</option>
                    {TERRITORIES.map((territory) => (
                      <option key={territory.slug} value={territory.slug}>
                        {displayTerritoryName(territory, locale)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {admin && (
                <label className="block min-w-0 text-sm text-muted-foreground">
                  {t("Село")}
                  <select
                    disabled={!admin}
                    className={inputClass}
                    value={draft.info.village_slug}
                    onChange={(e) => info("village_slug", e.target.value)}
                  >
                    <option value="">{t("Не выбрано")}</option>
                    {TERRITORIES.filter((territory) => territory.slug === draft.info.territory_slug)
                      .flatMap((territory) => territory.villages)
                      .map((v) => (
                        <option key={v.slug} value={v.slug}>
                          {displayVillageName(v, locale)}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {field("Директор", draft.info.director_name, (v) => info("director_name", v))}
              {field(
                "Рабочий телефон директора",
                draft.info.director_phone,
                (v) => info("director_phone", v),
                "tel",
              )}
              {field(
                "Телефон приёмной",
                draft.info.office_phone,
                (v) => info("office_phone", v),
                "tel",
              )}
              {(admin || locale === "kg") &&
                field("Адрес KG", draft.info.address_kg, (v) => info("address_kg", v))}
              {(admin || locale === "ru") &&
                field("Адрес RU", draft.info.address_ru, (v) => info("address_ru", v))}
              {admin && field("Адрес EN", draft.info.address_en, (v) => info("address_en", v))}
              <label className="text-sm text-muted-foreground">
                {t("Текущий учебный год")}
                <input
                  className={inputClass}
                  value={draft.info.current_academic_year}
                  pattern="[0-9]{4}-[0-9]{4}"
                  placeholder="2026-2027"
                  onChange={(e) => info("current_academic_year", e.target.value)}
                />
              </label>
            </div>,
          )}
          {extendedSchoolSectionsEnabled &&
            section(
              "Основные показатели",
              <div className="space-y-6">
                {draft.stats.map((row, i) => (
                  <div
                    key={i}
                    className="grid gap-4 border-b hairline pb-6 sm:grid-cols-2 lg:grid-cols-5"
                  >
                    <label className="text-sm text-muted-foreground">
                      {t("Учебный год")}
                      <input
                        required
                        pattern="[0-9]{4}-[0-9]{4}"
                        placeholder="2026-2027"
                        className={inputClass}
                        value={row.academic_year}
                        onChange={(e) =>
                          update({
                            ...draft,
                            stats: draft.stats.map((r, n) =>
                              n === i ? { ...r, academic_year: e.target.value } : r,
                            ),
                          })
                        }
                      />
                    </label>
                    {(
                      [
                        ["total_students", "Учащиеся"],
                        ["total_teachers", "Учителя"],
                        ["grade11_graduates", "Выпускники 11 класса"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="text-sm text-muted-foreground">
                        {t(label)}
                        <input
                          type="number"
                          min={0}
                          step={1}
                          className={inputClass}
                          value={row[key] ?? ""}
                          onChange={(e) =>
                            update({
                              ...draft,
                              stats: draft.stats.map((r, n) =>
                                n === i
                                  ? {
                                      ...r,
                                      [key]: e.target.value === "" ? null : Number(e.target.value),
                                    }
                                  : r,
                              ),
                            })
                          }
                        />
                      </label>
                    ))}
                    {remove("Удалить показатели", () =>
                      update({ ...draft, stats: draft.stats.filter((_, n) => n !== i) }),
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    update({
                      ...draft,
                      stats: [
                        ...draft.stats,
                        {
                          academic_year: "",
                          total_students: null,
                          total_teachers: null,
                          grade11_graduates: null,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("Добавить учебный год")}
                </button>
              </div>,
            )}
          {section(
            "Результаты ОРТ",
            <div className="space-y-8">
              <p className="text-sm leading-6 text-muted-foreground">
                {t(
                  "Введите балл из сертификата ОРТ каждого ученика. Имена и фамилии учеников не требуются.",
                )}
              </p>
              {draft.ort.map((row, i) => {
                const summary = parsed[i].summary;
                return (
                  <div
                    key={i}
                    className="min-w-0 border-b hairline pb-8"
                    onChangeCapture={() =>
                      setOrtTouched((current) => current.map((v, n) => (n === i ? true : v)))
                    }
                  >
                    <div className="mb-4 grid gap-4 sm:grid-cols-2">
                      {field(
                        "Год ОРТ",
                        String(row.year),
                        (v) =>
                          update({
                            ...draft,
                            ort: draft.ort.map((r, n) =>
                              n === i
                                ? {
                                    ...r,
                                    year: Number(v),
                                    academic_year:
                                      !r.academic_year ||
                                      r.academic_year === `${r.year - 1}-${r.year}`
                                        ? `${Number(v) - 1}-${Number(v)}`
                                        : r.academic_year,
                                  }
                                : r,
                            ),
                          }),
                        "number",
                        true,
                      )}
                      <label className="text-sm text-muted-foreground">
                        {t("Учебный год")}
                        <input
                          required
                          pattern="[0-9]{4}-[0-9]{4}"
                          className={inputClass}
                          value={row.academic_year}
                          onChange={(e) =>
                            update({
                              ...draft,
                              ort: draft.ort.map((r, n) =>
                                n === i ? { ...r, academic_year: e.target.value } : r,
                              ),
                            })
                          }
                        />
                      </label>
                    </div>
                    <label className="text-sm text-muted-foreground">
                      {t("Баллы ОРТ учащихся")}
                      <textarea
                        rows={6}
                        placeholder={"142\n156\n168\n171\n203\n215"}
                        maxLength={100000}
                        value={scoreTexts[i]}
                        className={inputClass}
                        onChange={(e) => {
                          setScoreTexts(
                            scoreTexts.map((text, n) => (n === i ? e.target.value : text)),
                          );
                          setDirty(true);
                          setIssues([]);
                          setMessage("");
                        }}
                      />
                    </label>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t(
                        "Введите каждый балл с новой строки. Также можно разделять баллы запятыми или пробелами.",
                      )}
                    </p>
                    {scoreTexts[i].length > 0 && parsed[i].invalid.length > 0 && (
                      <p role="alert" className="mt-3 break-words text-sm text-destructive">
                        {t("Проверьте следующие значения:")}{" "}
                        {parsed[i].invalid
                          .slice(0, 10)
                          .map((token) => token || t("Пустое значение"))
                          .join(", ")}
                      </p>
                    )}
                    {summary && (
                      <>
                        <dl className="my-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                          {[
                            ["Участники", summary.participants],
                            ["Средний балл", summary.average],
                            ["Медиана", summary.median],
                            ["Минимальный балл", summary.minimum],
                            ["Максимальный балл", summary.maximum],
                            ["200+ баллов", summary.over200],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt className="text-muted-foreground">{t(String(label))}</dt>
                              <dd>{value ?? t("Уточняется")}</dd>
                            </div>
                          ))}
                        </dl>
                        <dl className="mb-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                          {ORT_RANGES.map((range, n) => (
                            <div key={range}>
                              <dt className="text-muted-foreground">
                                {n === 0 ? t("до 109") : range}
                              </dt>
                              <dd>{summary.distribution[n]}</dd>
                            </div>
                          ))}
                        </dl>
                      </>
                    )}
                    <button
                      type="button"
                      className={buttonClass}
                      onClick={() => {
                        const existing = initial.ort.some((o) => o.year === row.year);
                        if (
                          (existing || ortTouched[i]) &&
                          !window.confirm(t("Удалить результаты за этот год?"))
                        )
                          return;
                        update({ ...draft, ort: draft.ort.filter((_, n) => n !== i) });
                        setScoreTexts(scoreTexts.filter((_, n) => n !== i));
                        setOrtTouched(ortTouched.filter((_, n) => n !== i));
                      }}
                    >
                      {t(
                        initial.ort.some((o) => o.year === row.year)
                          ? "Удалить результаты за этот год"
                          : "Убрать блок ОРТ",
                      )}
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                className={buttonClass}
                onClick={() => {
                  update({
                    ...draft,
                    ort: [
                      ...draft.ort,
                      {
                        year: new Date().getFullYear(),
                        academic_year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
                        scores: [],
                      },
                    ],
                  });
                  setScoreTexts([...scoreTexts, ""]);
                  setOrtTouched([...ortTouched, false]);
                }}
              >
                <Plus className="h-4 w-4" />
                {t("Добавить результаты ОРТ")}
              </button>
            </div>,
          )}
          {extendedSchoolSectionsEnabled &&
            section(
              "Достижения",
              <div className="space-y-8">
                {draft.achievements.map((entry, i) => (
                  <div key={i} className="space-y-4 border-b hairline pb-6">
                    {field(
                      "Дата",
                      entry.date,
                      (v) =>
                        update({
                          ...draft,
                          achievements: draft.achievements.map((a, n) =>
                            n === i ? { ...a, date: v } : a,
                          ),
                        }),
                      "date",
                      true,
                    )}
                    {localizedFields(
                      entry,
                      (next) =>
                        update({
                          ...draft,
                          achievements: draft.achievements.map((a, n) =>
                            n === i ? (next as SchoolAchievement) : a,
                          ),
                        }),
                      true,
                    )}
                    <label className="block text-sm text-muted-foreground">
                      {t("Категория")}
                      <select
                        value={entry.category ?? ""}
                        className={inputClass}
                        onChange={(e) =>
                          update({
                            ...draft,
                            achievements: draft.achievements.map((a, n) =>
                              n === i ? { ...a, category: e.target.value } : a,
                            ),
                          })
                        }
                      >
                        <option value="">{t("Не выбрано")}</option>
                        {categories.map((key, n) => (
                          <option key={key} value={key}>
                            {t(categoryLabels[n])}
                          </option>
                        ))}
                      </select>
                    </label>
                    {remove("Удалить достижение", () =>
                      update({
                        ...draft,
                        achievements: draft.achievements.filter((_, n) => n !== i),
                      }),
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    update({
                      ...draft,
                      achievements: [...draft.achievements, { ...blankAchievement }],
                    })
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("Добавить достижение")}
                </button>
              </div>,
            )}
          {extendedSchoolSectionsEnabled &&
            section(
              "Подготовка к ОРТ",
              <div className="space-y-8">
                {draft.resources.map((entry, i) => (
                  <div key={i} className="space-y-4 border-b hairline pb-6">
                    {localizedFields(entry, (next) =>
                      update({
                        ...draft,
                        resources: draft.resources.map((r, n) =>
                          n === i ? (next as SchoolResource) : r,
                        ),
                      }),
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm text-muted-foreground">
                        {t("Тип ресурса")}
                        <select
                          className={inputClass}
                          value={entry.type}
                          onChange={(e) =>
                            update({
                              ...draft,
                              resources: draft.resources.map((r, n) =>
                                n === i ? { ...r, type: e.target.value } : r,
                              ),
                            })
                          }
                        >
                          {types.map((key, n) => (
                            <option key={key} value={key}>
                              {t(resourceLabels[n])}
                            </option>
                          ))}
                        </select>
                      </label>
                      {field(
                        "Ссылка",
                        entry.url ?? "",
                        (v) =>
                          update({
                            ...draft,
                            resources: draft.resources.map((r, n) =>
                              n === i ? { ...r, url: v } : r,
                            ),
                          }),
                        "url",
                      )}
                      {field(
                        "Год",
                        entry.year == null ? "" : String(entry.year),
                        (v) =>
                          update({
                            ...draft,
                            resources: draft.resources.map((r, n) =>
                              n === i ? { ...r, year: v === "" ? null : Number(v) } : r,
                            ),
                          }),
                        "number",
                      )}
                      {field("Организатор / источник", entry.source ?? "", (v) =>
                        update({
                          ...draft,
                          resources: draft.resources.map((r, n) =>
                            n === i ? { ...r, source: v } : r,
                          ),
                        }),
                      )}
                    </div>
                    {remove("Удалить ресурс", () =>
                      update({ ...draft, resources: draft.resources.filter((_, n) => n !== i) }),
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() =>
                    update({ ...draft, resources: [...draft.resources, { ...blankResource }] })
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t("Добавить ресурс")}
                </button>
              </div>,
            )}
          {issues.length > 0 && (
            <div role="alert" className="my-4 space-y-2 text-sm text-destructive">
              {issues.map((issue, i) => (
                <p key={i}>
                  {t(issue.section)}
                  {issue.row ? ` (${issue.row})` : ""}: {t(issue.message)}{" "}
                  {issue.values?.replaceAll("∅", t("Пустое значение"))}
                </p>
              ))}
            </div>
          )}
          {message && (
            <p role="alert" className="my-4 text-sm text-destructive">
              {t(message)}
            </p>
          )}
          <div className="flex flex-wrap gap-3 border-t hairline py-6">
            <button type="submit" className={buttonClass}>
              <Save className="h-4 w-4" />
              {t("Сохранить черновик")}
            </button>
            <button type="button" className={buttonClass} onClick={() => void save(true)}>
              <Send className="h-4 w-4" />
              {t("Отправить на проверку")}
            </button>
          </div>
        </fieldset>
      </form>
      {admin && !record.is_archived && (
        <section className="border-t hairline py-6">
          <h2 className="mb-4 text-lg">{t("Проверка и публикация")}</h2>
          <label className="text-sm text-muted-foreground">
            {t("Замечание редактору")}
            <textarea
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className={buttonClass}
              disabled={busy || dirty}
              onClick={() =>
                void action(() => reviewSchool(record.id, record.revision, "publish", note))
              }
            >
              <Check className="h-4 w-4" />
              {t("Опубликовать сохранённые данные")}
            </button>
            <button
              className={buttonClass}
              disabled={busy || dirty}
              onClick={() =>
                void action(() => reviewSchool(record.id, record.revision, "return", note))
              }
            >
              <Undo2 className="h-4 w-4" />
              {t("Вернуть на исправление")}
            </button>
            <button
              className={buttonClass}
              disabled={busy || dirty}
              onClick={() =>
                void action(() => reviewSchool(record.id, record.revision, "unpublish", note))
              }
            >
              <EyeOff className="h-4 w-4" />
              {t("Снять с публикации")}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
