import { useAdminI18n } from "@/lib/admin-i18n";
import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isCurrentUserAdmin } from "@/lib/admin-auth";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { t } = useAdminI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    let request = 0;
    let userId: string | null | undefined;
    const check = async () => {
      const current = ++request;
      let isAdmin = false;
      try {
        isAdmin = await isCurrentUserAdmin();
      } catch {
        /* Fail closed. */
      }
      if (!active || current !== request) return;
      setAllowed(isAdmin);
      setChecking(false);
      if (!isAdmin) {
        queryClient.removeQueries({ queryKey: ["admin-news"] });
        void navigate({ to: "/admin/login", replace: true });
      }
    };
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id ?? null;
      if (next !== userId) {
        userId = next;
        request++;
        setAllowed(false);
        setChecking(true);
        queryClient.removeQueries({ queryKey: ["admin-news"] });
      }
      setTimeout(() => {
        if (active) void check();
      }, 0);
    });
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      request++;
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [navigate, queryClient]);

  if (checking || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <p className="text-sm text-muted-foreground">{t("Проверка доступа...")}</p>
      </main>
    );
  }

  return children;
}
