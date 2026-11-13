import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { checkEditorArea } from "@/lib/editor-auth";
import { useAdminI18n } from "@/lib/admin-i18n";
import { NewsEditorLogin } from "@/components/admin/NewsEditorLogin";
import { useQueryClient } from "@tanstack/react-query";

export function EditorAreaGuard({
  area,
  children,
}: {
  area: "news" | "school";
  children: ReactNode;
}) {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const [state, setState] = useState<"checking" | "anonymous" | "allowed" | "denied">("checking");
  const generation = useRef({ value: 0 }).current;
  const currentUser = useRef<string | null>(null);
  const check = useCallback(async () => {
    const request = ++generation.value;
    try {
      const result = await checkEditorArea(area);
      if (request !== generation.value) return;
      currentUser.current = result.userId;
      if (area === "news" && !result.allowed)
        queryClient.removeQueries({ queryKey: ["admin-news"] });
      setState(!result.userId ? "anonymous" : result.allowed ? "allowed" : "denied");
    } catch {
      if (request === generation.value) setState("denied");
    }
  }, [area, generation, queryClient]);
  useEffect(() => {
    let active = true;
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if ((session?.user.id ?? null) !== currentUser.current) {
        generation.value++;
        setState("checking");
        queryClient.removeQueries({ queryKey: ["admin-news"] });
      }
      // Do not call token-backed reads inside the Auth callback.
      setTimeout(() => {
        if (active) void check();
      }, 0);
    });
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      generation.value++;
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [check, generation, queryClient]);
  if (state === "allowed" || (state === "anonymous" && area === "school")) return children;
  if (state === "anonymous") return <NewsEditorLogin onLogin={check} />;
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="max-w-sm space-y-6 text-center">
        <p role={state === "checking" ? "status" : "alert"}>
          {t(state === "checking" ? "Проверка доступа..." : "Нет доступа к этому разделу.")}
        </p>
        {state === "denied" && (
          <>
            <button
              className="min-h-11 px-4 text-sm"
              onClick={() => void supabase.auth.signOut().then(() => check())}
            >
              {t("Выйти")}
            </button>
            <Link className="block text-sm text-muted-foreground" to="/">
              {t("На главную")}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
