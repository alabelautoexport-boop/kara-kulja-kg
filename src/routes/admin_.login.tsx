import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { useAdminI18n } from "@/lib/admin-i18n";
import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { isCurrentUserAdmin, loginAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin_/login")({
  head: () => ({ meta: [{ title: "Вход в администрацию - Kara-Kulja" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pageTitle = t("Вход");
  useEffect(() => {
    document.title = `${pageTitle} - Kara-Kulja Admin`;
  }, [pageTitle]);

  useEffect(() => {
    void isCurrentUserAdmin().then((isAdmin) => {
      if (isAdmin) void navigate({ to: "/admin", replace: true });
    });
  }, [navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await loginAdmin(email, password);
      await navigate({ to: "/admin", replace: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Не удалось войти.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-md border hairline p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <LockKeyhole className="h-6 w-6 text-[var(--beige)]" />
          <AdminLanguageSwitcher />
        </div>
        <p className="mt-8 kbd-eyebrow text-[var(--ember)]">{t("АДМИНИСТРАЦИЯ")}</p>
        <h1 className="mt-3 font-display text-4xl">{t("Вход")}</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm text-muted-foreground">
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full border hairline bg-transparent px-3 py-3 text-foreground outline-none focus:border-[var(--beige)]"
            />
          </label>
          <label className="block text-sm text-muted-foreground">
            {t("Пароль")}
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full border hairline bg-transparent px-3 py-3 text-foreground outline-none focus:border-[var(--beige)]"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {t(error)}
            </p>
          )}
          <button
            disabled={loading}
            className="flex min-h-11 w-full items-center justify-center bg-[var(--beige)] px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {t(loading ? "Вход..." : "Войти")}
          </button>
        </form>
      </div>
    </main>
  );
}
