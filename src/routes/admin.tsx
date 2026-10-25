import { useAdminI18n } from "@/lib/admin-i18n";
import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LogOut, Newspaper } from "lucide-react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminShell } from "@/components/admin/AdminShell";
import { logoutAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Администрация - Kara-Kulja" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const logout = async () => {
    try {
      await logoutAdmin();
      await navigate({ to: "/admin/login", replace: true });
    } catch {
      setError("Не удалось завершить сеанс.");
    }
  };

  return (
    <AdminGuard>
      <AdminShell
        eyebrow={t("АДМИНИСТРАЦИЯ")}
        title={t("Панель управления")}
        actions={
          <button
            onClick={logout}
            className="inline-flex min-h-10 items-center gap-2 border hairline px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            {t("Выйти")}
          </button>
        }
      >
        {error && (
          <p role="alert" className="mb-5 text-sm text-destructive">
            {t(error)}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/admin/news"
            className="group border hairline p-6 transition-colors hover:border-[var(--beige)]"
          >
            <Newspaper className="h-6 w-6 text-[var(--beige)]" />
            <div className="mt-10 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl">{t("Новости")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("Публикации сайта")}</p>
              </div>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </AdminShell>
    </AdminGuard>
  );
}
