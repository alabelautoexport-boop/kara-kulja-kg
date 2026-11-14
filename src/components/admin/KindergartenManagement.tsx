import { useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminShell } from "./AdminShell";
import { useAdminI18n } from "@/lib/admin-i18n";
import {
  KINDERGARTEN_TYPES,
  KINDERGARTEN_TYPE_LABELS,
  type KindergartenType,
} from "@/lib/institution-types";
import { TERRITORIES, displayTerritoryName, displayVillageName } from "@/lib/territories-data";
import {
  EMPTY_KINDERGARTEN,
  getEditableKindergartens,
  saveKindergarten,
  unpublishKindergarten,
  validKindergarten,
  type KindergartenInfo,
  type KindergartenRecord,
} from "@/lib/kindergartens-data";

export function KindergartenManagement() {
  const { t, locale } = useAdminI18n();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["admin", "kindergartens"],
    queryFn: getEditableKindergartens,
    retry: false,
    staleTime: 0,
  });
  const [record, setRecord] = useState<KindergartenRecord | null>(null);
  const [info, setInfo] = useState<KindergartenInfo>(EMPTY_KINDERGARTEN);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const input =
    "mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm text-foreground focus:border-[var(--beige)]";
  const button =
    "min-h-11 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
  const open = (item: KindergartenRecord | null) => {
    setRecord(item);
    setInfo(
      item
        ? (Object.fromEntries(
            Object.keys(EMPTY_KINDERGARTEN).map((k) => [k, item[k as keyof KindergartenInfo]]),
          ) as KindergartenInfo)
        : { ...EMPTY_KINDERGARTEN },
    );
    setEditing(true);
    setError("");
    setNotice("");
  };
  const refresh = async (id: string) => {
    await client.invalidateQueries({ queryKey: ["kindergartens"] });
    const result = await query.refetch();
    const next = result.data?.find((k) => k.id === id);
    if (!next) throw new Error("Не удалось загрузить детские сады.");
    setRecord(next);
  };
  const run = async (action: () => Promise<string>, message: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const id = await action();
      await refresh(id);
      setNotice(t(message));
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Не удалось сохранить изменения."));
    } finally {
      setBusy(false);
    }
  };
  const save = (e: FormEvent) => {
    e.preventDefault();
    void run(() => saveKindergarten(record, info, false), "Черновик сохранён");
  };
  const field = (
    label: string,
    key:
      | "short_name_kg"
      | "short_name_ru"
      | "short_name_en"
      | "name_kg"
      | "name_ru"
      | "name_en"
      | "address_kg"
      | "address_ru"
      | "address_en",
  ) => (
    <label className="min-w-0 text-sm">
      {t(label)}
      <input
        required={key === "name_kg"}
        maxLength={key.startsWith("short_name") ? 120 : key.startsWith("name") ? 300 : 2000}
        className={input}
        value={info[key] ?? ""}
        onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
      />
    </label>
  );
  return (
    <AdminShell title={t("Управление детскими садами")} backTo="/admin">
      {notice && (
        <p role="status" className="mb-5 text-sm text-[var(--beige)]">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {editing ? (
        <>
          <button
            className={`${button} mb-6`}
            disabled={busy}
            onClick={() => {
              setEditing(false);
              setRecord(null);
              setError("");
            }}
          >
            {t("Назад к списку")}
          </button>
          <form onSubmit={save} className="min-w-0">
            <fieldset disabled={busy} className="min-w-0">
              {record && (
                <p className="mb-6 break-words text-xs text-muted-foreground">
                  {record.slug} · {t(record.status === "published" ? "Опубликовано" : "Черновик")}
                </p>
              )}
              <div className="grid min-w-0 gap-5 sm:grid-cols-2">
                {field("Название KG", "name_kg")}
                {field("Название RU", "name_ru")}
                {field("Название EN", "name_en")}
                {field("Короткое название KG", "short_name_kg")}
                {field("Короткое название RU", "short_name_ru")}
                {field("Короткое название EN", "short_name_en")}
                <label className="min-w-0 text-sm">
                  {t("Тип детского сада")}
                  <select
                    className={input}
                    value={info.type}
                    onChange={(e) => setInfo({ ...info, type: e.target.value as KindergartenType })}
                  >
                    {KINDERGARTEN_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {KINDERGARTEN_TYPE_LABELS[type][locale]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 text-sm">
                  {t("Айыл аймак")}
                  <select
                    required
                    className={input}
                    value={info.territory_slug}
                    onChange={(e) =>
                      setInfo({ ...info, territory_slug: e.target.value, village_slug: "" })
                    }
                  >
                    <option value="">{t("Не выбрано")}</option>
                    {TERRITORIES.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {displayTerritoryName(t, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="min-w-0 text-sm">
                  {t("Село")}
                  <select
                    required
                    className={input}
                    value={info.village_slug}
                    onChange={(e) => setInfo({ ...info, village_slug: e.target.value })}
                  >
                    <option value="">{t("Не выбрано")}</option>
                    {TERRITORIES.find((t) => t.slug === info.territory_slug)?.villages.map((v) => (
                      <option key={v.slug} value={v.slug}>
                        {displayVillageName(v, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                {field("Адрес KG", "address_kg")}
                {field("Адрес RU", "address_ru")}
                {field("Адрес EN", "address_en")}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
                {t("Сохранение черновика не заменяет опубликованную версию.")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className={button}
                  type="submit"
                  disabled={busy || !validKindergarten(info)}
                >
                  {t("Сохранить черновик")}
                </button>
                <button
                  className={button}
                  type="button"
                  disabled={busy || !validKindergarten(info)}
                  onClick={() => {
                    if (window.confirm(t("Опубликовать детский сад?")))
                      void run(() => saveKindergarten(record, info, true), "Опубликовано");
                  }}
                >
                  {t("Сохранить и опубликовать")}
                </button>
                {record && (
                  <button
                    className={button}
                    type="button"
                    onClick={() => {
                      if (window.confirm(t("Снять детский сад с публикации?")))
                        void run(async () => {
                          await unpublishKindergarten(record);
                          return record.id;
                        }, "Снято с публикации");
                    }}
                  >
                    {t("Снять с публикации")}
                  </button>
                )}
              </div>
            </fieldset>
          </form>
          {record && Object.keys(record.source_metadata).length > 0 && (
            <details className="mt-8 text-sm text-muted-foreground">
              <summary className="cursor-pointer py-2">{t("Источник данных")}</summary>
              <pre className="mt-3 whitespace-pre-wrap break-words text-xs">
                {JSON.stringify(record.source_metadata, null, 2)}
              </pre>
            </details>
          )}
        </>
      ) : (
        <>
          <button className={`${button} mb-6`} onClick={() => open(null)}>
            {t("Добавить детский сад")}
          </button>
          {query.isPending ? (
            <p role="status">{t("Загрузка...")}</p>
          ) : query.isError ? (
            <p role="alert">{t("Не удалось загрузить детские сады.")}</p>
          ) : !query.data.length ? (
            <p className="text-sm text-muted-foreground">{t("Детские сады пока не добавлены.")}</p>
          ) : (
            <ul className="divide-y hairline border-y hairline">
              {query.data.map((item) => (
                <li
                  key={item.id}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <h2 className="break-words text-sm">
                      {item[`name_${locale}`] || item.name_kg}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {KINDERGARTEN_TYPE_LABELS[item.type][locale]} ·{" "}
                      {t(item.status === "published" ? "Опубликовано" : "Черновик")}
                    </p>
                  </div>
                  <button className={button} onClick={() => open(item)}>
                    {t("Открыть")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AdminShell>
  );
}
