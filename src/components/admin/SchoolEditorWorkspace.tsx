import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { loginSchoolEditor, resolveSchoolEditor } from "@/lib/school-editor-access";
import { loadSchoolDraft } from "@/lib/schools-data";
import { useAdminI18n } from "@/lib/admin-i18n";
import { AdminLanguageSwitcher } from "./AdminLanguageSwitcher";
import { SchoolForm } from "./SchoolForm";
export function SchoolEditorWorkspace() {
  const { t } = useAdminI18n();
  const [state, setState] = useState<"checking" | "anonymous" | "denied" | "ready">("checking");
  const [loaded, setLoaded] = useState<Awaited<ReturnType<typeof loadSchoolDraft>> | null>(null);
  const [username, setUsername] = useState(""),
    [pin, setPin] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const generation = useRef({ value: 0 }).current,
    mounted = useRef(false);
  const currentUser = useRef<string | null>(null);
  const check = useCallback(async () => {
    const version = ++generation.value;
    try {
      const access = await resolveSchoolEditor();
      if (!mounted.current || version !== generation.value) return;
      currentUser.current = access.userId;
      if (!access.user || !access.schoolId) {
        setLoaded(null);
        setState(access.user ? "denied" : "anonymous");
        return;
      }
      const data = await loadSchoolDraft(access.schoolId);
      if (!mounted.current || version !== generation.value) return;
      setLoaded((old) =>
        old?.record.id === data.record.id && old.record.revision === data.record.revision
          ? old
          : data,
      );
      setState("ready");
    } catch {
      if (mounted.current && version === generation.value) {
        setLoaded(null);
        setState("denied");
      }
    }
  }, [generation]);
  useEffect(() => {
    mounted.current = true;
    void check();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if ((session?.user.id ?? null) !== currentUser.current) {
        currentUser.current = session?.user.id ?? null;
        generation.value++;
        setLoaded(null);
        setState("checking");
      }
      setTimeout(() => {
        if (mounted.current) void check();
      }, 0);
    });
    const focus = () => void check();
    window.addEventListener("focus", focus);
    const timer = window.setInterval(focus, 15000);
    return () => {
      mounted.current = false;
      generation.value++;
      subscription.unsubscribe();
      window.removeEventListener("focus", focus);
      window.clearInterval(timer);
    };
  }, [check, generation]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await loginSchoolEditor(username, pin);
      await check();
    } catch {
      setError("Неверный логин или PIN-код. Повторите позже.");
    } finally {
      setPin("");
      setBusy(false);
    }
  };
  const logout = async () => {
    setLoaded(null);
    generation.value++;
    await supabase.auth.signOut({ scope: "local" });
    setState("anonymous");
    setNotice("");
    setError("");
  };
  const button =
    "min-h-11 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
  const input = "mt-2 min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2";
  return (
    <main className="min-h-screen bg-background font-sans text-sm">
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-5">
          <Link to="/" className="inline-flex min-h-11 items-center text-sm text-muted-foreground">
            {t("На главную")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <AdminLanguageSwitcher />
            {state !== "anonymous" && state !== "checking" && (
              <button className={button} onClick={() => void logout()}>
                {t("Выйти")}
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <h1
          className={`mb-6 break-words ${state === "ready" && loaded ? "font-display text-3xl" : "font-sans text-2xl font-semibold tracking-normal"}`}
        >
          {state === "ready" ? loaded?.record.name_kg : t("Моя школа")}
        </h1>
        {state === "checking" ? (
          <p role="status">{t("Проверка доступа...")}</p>
        ) : state === "denied" ? (
          <p role="alert">{t("Нет доступа к этому разделу.")}</p>
        ) : state === "anonymous" ? (
          <form onSubmit={submit} className="max-w-sm space-y-5">
            <label className="block text-sm">
              {t("Логин")}
              <input
                className={input}
                autoComplete="username"
                required
                minLength={3}
                maxLength={40}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              {t("PIN-код")}
              <input
                className={input}
                type="password"
                autoComplete="current-password"
                inputMode="numeric"
                pattern="[0-9]{8}"
                minLength={8}
                maxLength={8}
                required
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
              className={`${button} w-full bg-[var(--beige)] text-background`}
              disabled={busy}
            >
              {t(busy ? "Вход..." : "Войти")}
            </button>
          </form>
        ) : (
          loaded && (
            <>
              {notice && (
                <p role="status" className="mb-5">
                  {t(notice)}
                </p>
              )}
              <SchoolForm
                key={`${loaded.record.id}-${loaded.record.revision}`}
                admin={false}
                record={loaded.record}
                initial={loaded.draft}
                onSaved={async (message) => {
                  await check();
                  setNotice(message ?? "Черновик сохранён");
                }}
              />
            </>
          )
        )}
      </div>
    </main>
  );
}
