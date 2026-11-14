import { useState, type ReactNode } from "react";
import { useAdminI18n } from "@/lib/admin-i18n";
import { calculateOrt, ORT_RANGES } from "@/lib/school-ort";
import {
  reviewSchool,
  saveSchoolDraft,
  type SchoolDraft,
  type SchoolRecord,
} from "@/lib/schools-data";
import { SchoolIdentityFields } from "./SchoolIdentityFields";
import { validSchoolIdentity, schoolStatus } from "@/lib/school-admin";
import { SchoolMediaReview } from "./SchoolMedia";
import { SchoolEditorAccess } from "./SchoolEditorAccess";

export function AdminSchoolForm({
  record,
  initial,
  onSaved,
}: {
  record: SchoolRecord;
  initial: SchoolDraft;
  onSaved: (message?: string) => Promise<void>;
}) {
  const { t } = useAdminI18n();
  const [info, setInfo] = useState(initial.info);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState(record.review_note ?? "");
  const button =
    "inline-flex min-h-11 w-full items-center justify-center border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50 sm:w-auto";
  const input =
    "mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm text-foreground focus:border-[var(--beige)]";
  const section = (heading: string, content: ReactNode) => (
    <section className="border-t hairline py-7">
      <h2 className="mb-4 font-sans text-lg font-semibold tracking-normal">{t(heading)}</h2>
      {content}
    </section>
  );
  const run = async (action: () => Promise<void | string>, message: string) => {
    setBusy(true);
    setError("");
    try {
      const notice = await action();
      await onSaved(notice || message);
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Не удалось сохранить школу."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-w-0 font-sans text-sm">
      {error && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {error}
        </p>
      )}
      {section(
        "Основное",
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!validSchoolIdentity(info)) return;
            // Keep editor-owned contacts and the original score arrays unchanged.
            void run(
              () => saveSchoolDraft(record.id, record.revision, { info, ort: initial.ort }, false),
              "Черновик сохранён",
            );
          }}
        >
          <fieldset disabled={busy || record.is_archived} className="min-w-0 space-y-5">
            <SchoolIdentityFields
              value={info}
              onChange={(identity) => {
                setInfo({ ...info, ...identity });
                setDirty(true);
              }}
            />
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer py-2 focus-visible:outline focus-visible:outline-2">
                {t("Дополнительные данные")}
              </summary>
              <div className="mt-3 grid min-w-0 gap-4 sm:grid-cols-2">
                {(
                  [
                    ["name_ru", "Название школы RU"],
                    ["name_en", "Название школы EN"],
                    ["slug", "Slug"],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="min-w-0">
                    {t(label)}
                    <input
                      className={input}
                      maxLength={300}
                      required={key === "slug"}
                      pattern={key === "slug" ? "[a-z0-9]+(-[a-z0-9]+)*" : undefined}
                      value={info[key] ?? ""}
                      onChange={(e) => {
                        setInfo({ ...info, [key]: e.target.value });
                        setDirty(true);
                      }}
                    />
                  </label>
                ))}
              </div>
            </details>
            <button
              className={`${button} bg-[var(--beige)] font-medium text-background hover:opacity-90`}
              disabled={!dirty || !validSchoolIdentity(info)}
            >
              {t("Сохранить")}
            </button>
          </fieldset>
        </form>,
      )}
      {section(
        "Редактор школы",
        <SchoolEditorAccess key={record.id} schoolId={record.id} slug={record.slug ?? ""} />,
      )}
      {section(
        "Проверка и публикация",
        <>
          <p className="mb-5 text-sm">
            {t("Статус")}: {t(schoolStatus(record))}
          </p>
          <h3 className="mb-4 font-sans text-lg font-semibold tracking-normal text-foreground">
            {t("Контактные данные")}
          </h3>
          <SchoolMediaReview schoolId={record.id} value={initial.media} />
          <dl className="max-w-3xl divide-y divide-border text-sm">
            {(
              [
                ["director_name", "Директор"],
                ["director_phone", "Рабочий телефон директора"],
                ["office_phone", "Телефон приёмной"],
                ["address_kg", "Адрес KG"],
                ["address_ru", "Адрес RU"],
                ["address_en", "Адрес EN"],
              ] as const
            ).map(([key, label]) => (
              <div
                key={key}
                className="grid min-w-0 gap-1 py-3 sm:grid-cols-[12rem_minmax(0,1fr)] sm:gap-5"
              >
                <dt className="text-sm leading-relaxed text-muted-foreground">{t(label)}</dt>
                <dd className="whitespace-pre-line break-words text-foreground">
                  {initial.info[key] || t("Не заполнено")}
                </dd>
              </div>
            ))}
          </dl>
          <h3 className="mb-4 mt-7 font-sans text-lg font-semibold tracking-normal">
            {t("Результаты ОРТ")}
          </h3>
          {!initial.ort.length && (
            <p className="text-sm text-muted-foreground">
              {t("Результаты ОРТ ещё не представлены.")}
            </p>
          )}
          {initial.ort.map((row) => {
            let summary;
            try {
              summary = calculateOrt(row.scores);
            } catch {
              return (
                <p key={row.year} role="alert" className="text-sm text-destructive">
                  {row.year}: {t("Исправьте неверные баллы.")}
                </p>
              );
            }
            return (
              <article key={row.year} className="min-w-0 border-b hairline py-5">
                <h4 className="font-sans text-sm font-medium tracking-normal">
                  {t("Год ОРТ")}: {row.year} / {row.academic_year}
                </h4>
                <dl className="my-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  {(
                    [
                      ["Участники", summary.participants],
                      ["Средний балл", summary.average],
                      ["Медиана", summary.median],
                      ["Минимальный балл", summary.minimum],
                      ["Максимальный балл", summary.maximum],
                      ["200+ баллов", summary.over200],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted-foreground">{t(label)}</dt>
                      <dd className="mt-1 font-medium text-foreground">
                        {value ?? t("Не заполнено")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <h5 className="mb-3 text-sm">{t("Распределение баллов")}</h5>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {ORT_RANGES.map((range, index) => (
                    <div key={range}>
                      <dt className="text-muted-foreground">{index === 0 ? t("до 109") : range}</dt>
                      <dd>{summary.distribution[index]}</dd>
                    </div>
                  ))}
                </dl>
                <details className="mt-4 text-sm">
                  <summary className="cursor-pointer py-2 text-muted-foreground focus-visible:outline focus-visible:outline-2">
                    {t("Посмотреть введённые баллы")}
                  </summary>
                  <p className="mt-2 break-words leading-relaxed">{row.scores.join(", ")}</p>
                </details>
              </article>
            );
          })}
          {!record.is_archived && (
            <div className="mt-6">
              <label className="block text-sm text-muted-foreground">
                {t("Замечание редактору")}
                <textarea
                  rows={3}
                  className={input}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              {dirty && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {t("Сначала сохраните изменения в разделе «Основное».")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                {(
                  [
                    ["publish", "Опубликовать"],
                    ["return", "Вернуть на исправление"],
                    ["unpublish", "Снять с публикации"],
                  ] as const
                ).map(([action, label]) =>
                  action === "unpublish" && record.status !== "published" ? null : (
                    <button
                      key={action}
                      className={`${button} ${action === "publish" ? "bg-[var(--beige)] font-medium text-background hover:opacity-90" : "text-muted-foreground hover:text-foreground"}`}
                      disabled={busy || dirty}
                      onClick={() =>
                        void run(
                          () =>
                            reviewSchool(
                              record.id,
                              record.revision,
                              action,
                              note,
                              !!initial.media?.cover || !!initial.media?.gallery.length,
                            ),
                          "Сохранено.",
                        )
                      }
                    >
                      {t(label)}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </>,
      )}
    </div>
  );
}
