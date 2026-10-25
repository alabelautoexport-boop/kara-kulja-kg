import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { useAdminI18n } from "@/lib/admin-i18n";
import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

export function AdminShell({
  title,
  eyebrow,
  actions,
  children,
  backTo,
}: {
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  children: ReactNode;
  backTo?: "/admin" | "/admin/news";
}) {
  const { t } = useAdminI18n();
  useEffect(() => {
    document.title = `${title} - Kara-Kulja Admin`;
  }, [title]);
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b hairline">
        <div className="mx-auto flex min-h-20 max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link
            to="/admin"
            className="inline-flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            Kara-Kulja Admin
          </Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
            <AdminLanguageSwitcher />
            {actions}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-5 py-10 lg:px-8 lg:py-14">
        {backTo && (
          <Link
            to={backTo}
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("Назад")}
          </Link>
        )}
        {eyebrow && <p className="kbd-eyebrow text-[var(--ember)]">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-4xl md:text-5xl">{title}</h1>
        <div className="mt-10">{children}</div>
      </div>
    </main>
  );
}
