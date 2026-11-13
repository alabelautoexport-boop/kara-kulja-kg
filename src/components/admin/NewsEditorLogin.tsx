import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useAdminI18n } from "@/lib/admin-i18n";
import { loginNewsEditor } from "@/lib/editor-auth";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";

export function NewsEditorLogin({ onLogin }: { onLogin: () => Promise<void> }) {
  const { t } = useAdminI18n();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginNewsEditor(username, pin);
      await onLogin();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Нет доступа к новостям.");
    } finally {
      setPin("");
      setBusy(false);
    }
  };
  const input = "mt-2 min-h-11 w-full border hairline bg-background px-3 py-2";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-end">
          <AdminLanguageSwitcher />
        </div>
        <h1 className="mb-8 font-display text-3xl">{t("Новости")}</h1>
        <form className="space-y-5" onSubmit={submit}>
          <label className="block text-sm">
            {t("Логин")}
            <input
              className={input}
              required
              autoComplete="username"
              value={username}
              maxLength={40}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            {t("PIN-код")}
            <input
              className={input}
              required
              type="password"
              inputMode="numeric"
              pattern="[0-9]{8}"
              minLength={8}
              maxLength={8}
              autoComplete="current-password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t(error)}
            </p>
          )}
          <button
            disabled={busy}
            className="min-h-11 w-full bg-[var(--beige)] px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {t(busy ? "Вход..." : "Войти")}
          </button>
        </form>
        <Link
          to="/"
          className="mt-6 block py-2 text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {t("На главную")}
        </Link>
      </div>
    </main>
  );
}
