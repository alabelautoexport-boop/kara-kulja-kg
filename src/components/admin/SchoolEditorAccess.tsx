import { useEffect, useState } from "react";
import { useAdminI18n } from "@/lib/admin-i18n";
import { manageSchoolAccess, type SchoolAccessStatus } from "@/lib/school-editor-access";
export function SchoolEditorAccess({ schoolId, slug }: { schoolId: string; slug: string }) {
  const { t } = useAdminI18n();
  const [account, setAccount] = useState<SchoolAccessStatus | null>(null),
    [username, setUsername] = useState(slug);
  const [checking, setChecking] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [secret, setSecret] = useState<{ username: string; pin: string } | null>(null);
  useEffect(() => {
    let active = true;
    const clearPin = () => setSecret(null);
    const hidePin = () => {
      if (document.hidden) clearPin();
    };
    window.addEventListener("pagehide", clearPin);
    document.addEventListener("visibilitychange", hidePin);
    setChecking(true);
    setSecret(null);
    manageSchoolAccess(schoolId, "status")
      .then((r) => {
        if (active) setAccount(r.account ?? null);
      })
      .catch(() => {
        if (active) setError(t("Не удалось загрузить доступ редактора."));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
      window.removeEventListener("pagehide", clearPin);
      document.removeEventListener("visibilitychange", hidePin);
    };
    // Account status is not reloaded when language changes; PIN lives only in this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);
  const run = async (action: "create" | "reset" | "disable" | "enable") => {
    setBusy(true);
    setError("");
    setSecret(null);
    try {
      const r = await manageSchoolAccess(
        schoolId,
        action,
        action === "create" ? username : undefined,
      );
      if (r.username && r.pin) setSecret({ username: r.username, pin: r.pin });
      const status = await manageSchoolAccess(schoolId, "status");
      setAccount(status.account ?? null);
    } catch {
      setError(t("Не удалось изменить доступ. Обновите страницу и повторите попытку."));
    } finally {
      setBusy(false);
    }
  };
  const button =
    "min-h-11 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
  return (
    <div className="max-w-2xl min-w-0 space-y-4 font-sans text-sm">
      {checking ? (
        <p role="status">{t("Проверка доступа...")}</p>
      ) : account ? (
        <>
          <p className="break-all">
            {t("Логин")}: {account.username}
          </p>
          <p>
            {t("Статус")}: {t(account.is_active ? "Активен" : "Отключен")}
          </p>
          <div className="flex flex-wrap gap-3">
            <button className={button} disabled={busy} onClick={() => void run("reset")}>
              {t("Сбросить PIN")}
            </button>
            <button
              className={button}
              disabled={busy}
              onClick={() => void run(account.is_active ? "disable" : "enable")}
            >
              {t(account.is_active ? "Отключить доступ" : "Включить доступ")}
            </button>
          </div>
        </>
      ) : (
        !error && (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void run("create");
            }}
          >
            <label className="block">
              {t("Логин")}
              <input
                className="mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                minLength={3}
                maxLength={40}
                required
                disabled={busy}
              />
            </label>
            <button className={button} disabled={busy}>
              {t("Создать доступ")}
            </button>
          </form>
        )
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {secret && (
        <div role="status" className="space-y-3 border hairline p-4">
          <p className="break-all">
            {t("Логин")}: {secret.username}
          </p>
          <p>
            {t("PIN-код")}: <span className="font-sans tabular-nums">{secret.pin}</span>
          </p>
          <p className="leading-relaxed text-muted-foreground">
            {t("Сохраните PIN-код. После закрытия этого окна он больше не будет показан.")}
          </p>
          <button className={button} onClick={() => setSecret(null)}>
            {t("Закрыть")}
          </button>
        </div>
      )}
    </div>
  );
}
