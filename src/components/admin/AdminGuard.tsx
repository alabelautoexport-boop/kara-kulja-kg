import { useAdminI18n } from "@/lib/admin-i18n";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isCurrentUserAdmin } from "@/lib/admin-auth";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    isCurrentUserAdmin()
      .then((isAdmin) => {
        if (!active) return;
        if (!isAdmin) {
          void navigate({ to: "/admin/login", replace: true });
          return;
        }
        setAllowed(true);
      })
      .finally(() => active && setChecking(false));
    return () => {
      active = false;
    };
  }, [navigate]);

  if (checking || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">{t("Проверка доступа...")}</p>
      </main>
    );
  }

  return children;
}
