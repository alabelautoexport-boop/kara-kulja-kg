import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useAdminI18n } from "@/lib/admin-i18n";

type NewsAccess = { username: string; is_active: boolean };
export function NewsEditorAccessManagement() {
  const { t } = useAdminI18n();
  const [items, setItems] = useState<NewsAccess[]>([]);
  const [username, setUsername] = useState("news-editor");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [credential, setCredential] = useState<{ username: string; pin: string } | null>(null);
  const load = async () => {
    const result = await supabase
      .from("news_editor_assignments")
      .select("username,is_active")
      .order("username");
    if (result.error)
      throw new Error("Доступ к новостям ещё не настроен. Требуется миграция и Edge Functions.");
    setItems(result.data ?? []);
  };
  useEffect(() => {
    let active = true;
    void supabase
      .from("news_editor_assignments")
      .select("username,is_active")
      .order("username")
      .then(({ data, error }) => {
        if (!active) return;
        if (error)
          setError("Доступ к новостям ещё не настроен. Требуется миграция и Edge Functions.");
        else setItems(data ?? []);
      });
    const clearPin = () => setCredential(null);
    const hidePin = () => {
      if (document.hidden) setCredential(null);
    };
    window.addEventListener("pagehide", clearPin);
    document.addEventListener("visibilitychange", hidePin);
    return () => {
      active = false;
      window.removeEventListener("pagehide", clearPin);
      document.removeEventListener("visibilitychange", hidePin);
    };
  }, []);
  const run = async (action: "create" | "reset" | "disable" | "enable", login: string) => {
    if (
      action === "reset" &&
      !window.confirm(t("Создать новый PIN-код? Старый PIN больше не подойдёт."))
    )
      return;
    setCredential(null);
    setBusy(true);
    setError("");
    try {
      const result = await supabase.functions.invoke("manage-editor-access", {
        body: { action, username: login },
      });
      if (result.error || result.data?.error)
        throw new Error("Не удалось изменить доступ. Обновите список и повторите попытку.");
      if (result.data?.pin) setCredential({ username: result.data.username, pin: result.data.pin });
      await load();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Не удалось изменить доступ. Обновите список и повторите попытку.",
      );
    } finally {
      setBusy(false);
    }
  };
  const create = (event: FormEvent) => {
    event.preventDefault();
    void run("create", username.trim().toLowerCase());
  };
  const button =
    "min-h-11 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
  return (
    <section className="mt-10 border-t hairline pt-8">
      <h2 className="mb-6 font-display text-2xl">{t("Доступ к новостям")}</h2>
      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 text-sm">
          {t("Логин")}
          <input
            className="mt-2 block min-h-11 w-full border hairline bg-background px-3"
            required
            minLength={3}
            maxLength={40}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            autoComplete="off"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <button className={button} disabled={busy}>
          {t("Создать доступ")}
        </button>
      </form>
      {credential && (
        <div role="status" className="my-6 space-y-3 border hairline p-4">
          <p className="text-sm">
            {t("Сохраните новый PIN-код сейчас. Позже он не будет доступен.")}
          </p>
          <p className="break-words text-sm">
            {t("Логин")}: {credential.username}
          </p>
          <p className="font-mono">
            {t("PIN-код")}: {credential.pin}
          </p>
          <button className={button} onClick={() => setCredential(null)}>
            {t("Я сохранил PIN-код")}
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="my-4 text-sm text-destructive">
          {t(error)}
        </p>
      )}
      <ul className="mt-6 divide-y divide-border">
        {items.map((item) => (
          <li
            className="flex flex-wrap items-center justify-between gap-3 py-4"
            key={item.username}
          >
            <div>
              <p className="break-words text-sm">{item.username}</p>
              <p className="text-xs text-muted-foreground">
                {t(item.is_active ? "Доступ включён" : "Доступ отключён")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className={button}
                disabled={busy}
                onClick={() => void run("reset", item.username)}
              >
                {t("Новый PIN-код")}
              </button>
              <button
                className={button}
                disabled={busy}
                onClick={() => void run(item.is_active ? "disable" : "enable", item.username)}
              >
                {t(item.is_active ? "Отключить" : "Включить")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
