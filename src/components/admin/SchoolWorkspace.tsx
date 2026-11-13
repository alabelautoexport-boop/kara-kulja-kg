import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Plus, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, logoutAdmin, isCurrentUserAdmin } from "@/lib/admin-auth";
import { useAdminI18n } from "@/lib/admin-i18n";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { SchoolLifecycleActions } from "@/components/admin/SchoolLifecycleActions";
import {
  createSchool,
  getEditableSchools,
  loadSchoolDraft,
  type SchoolRecord,
} from "@/lib/schools-data";

const input =
  "min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm focus:border-[var(--beige)]";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";
const schoolEditorAssignmentsEnabled = false;

export function SchoolWorkspace({ admin = false }: { admin?: boolean }) {
  const { t } = useAdminI18n();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [selected, setSelected] = useState("");
  const [loaded, setLoaded] = useState<Awaited<ReturnType<typeof loadSchoolDraft>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [userId, setUserId] = useState("");
  const [assignments, setAssignments] = useState<{ user_id: string }[]>([]);
  const sessionUserId = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    const items = await getEditableSchools();
    setSchools(items);
    if (items.length === 1) setSelected((current) => current || items[0].id);
    return items;
  }, []);
  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const user = await getCurrentUser();
        if (!active) return;
        sessionUserId.current = user?.id ?? null;
        setAuthenticated(!!user);
        if (user) await refresh();
      } catch {
        if (active) setError(t("Не удалось загрузить школы."));
      } finally {
        if (active) setChecking(false);
      }
    };
    void check();
    // A shared Auth session is observed, but no Admin privileges are inferred from it.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setAuthenticated(!!session);
        const nextUserId = session?.user.id ?? null;
        if (sessionUserId.current !== nextUserId) {
          sessionUserId.current = nextUserId;
          setSchools([]);
          setSelected("");
          setLoaded(null);
          setAssignments([]);
          if (session) {
            // Leave the Auth callback before requesting a token-backed database read.
            setTimeout(() => {
              if (active)
                void refresh().catch(() => active && setError(t("Не удалось загрузить школы.")));
            }, 0);
          }
        }
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // Translation changes do not re-authenticate or replace in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  useEffect(() => {
    if (!authenticated || !selected) return;
    let active = true;
    setLoaded(null);
    setError("");
    setNotice("");
    loadSchoolDraft(selected)
      .then((data) => {
        if (active) setLoaded(data);
      })
      .catch(() => {
        if (active) setError(t("Не удалось загрузить школы."));
      });
    if (admin && schoolEditorAssignmentsEnabled)
      void supabase
        .from("school_editor_assignments")
        .select("user_id")
        .eq("school_id", selected)
        .then(({ data, error }) => {
          if (active) {
            setAssignments(data ?? []);
            if (error) setError(t("Не удалось загрузить школы."));
          }
        });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, authenticated, admin]);
  const reloadSelected = async (message?: string) => {
    await refresh();
    const updated = await loadSchoolDraft(selected);
    setLoaded((current) => (current?.record.id === selected ? updated : current));
    if (message) setNotice(message);
  };
  const login = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error("Неверный email или пароль.");
      const items = await refresh();
      if (!items.length && !(await isCurrentUserAdmin())) {
        await supabase.auth.signOut();
        throw new Error("Нет назначенных школ. Обратитесь к администратору.");
      }
      setPassword("");
      setAuthenticated(true);
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Не удалось войти."));
    } finally {
      setBusy(false);
    }
  };
  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const id = await createSchool(name);
      await refresh();
      setSelected(id);
      setName("");
    } catch (e) {
      setError(t(e instanceof Error ? e.message : "Не удалось создать школу. Проверьте slug."));
    } finally {
      setBusy(false);
    }
  };
  const assign = async (removeId?: string) => {
    if (!selected) return;
    setBusy(true);
    setError("");
    const result = removeId
      ? await supabase
          .from("school_editor_assignments")
          .delete()
          .eq("school_id", selected)
          .eq("user_id", removeId)
      : await supabase
          .from("school_editor_assignments")
          .insert({ school_id: selected, user_id: userId.trim() });
    if (result.error) setError(t("Не удалось назначить редактора. Проверьте UUID пользователя."));
    else {
      const { data } = await supabase
        .from("school_editor_assignments")
        .select("user_id")
        .eq("school_id", selected);
      setAssignments(data ?? []);
      setUserId("");
    }
    setBusy(false);
  };
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b hairline">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-5">
          <Link
            to={admin ? "/admin" : "/"}
            className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t(admin ? "Панель управления" : "На главную")}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <AdminLanguageSwitcher />
            {authenticated && (
              <button
                className={button}
                onClick={() => {
                  void logoutAdmin().catch(() => setError(t("Не удалось завершить сеанс.")));
                }}
              >
                <LogOut className="h-4 w-4" />
                {t("Выйти")}
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1200px] px-5 py-10">
        <h1 className="mb-8 font-display text-3xl sm:text-4xl">
          {!admin && loaded ? loaded.record.name_kg : t(admin ? "Управление школами" : "Моя школа")}
        </h1>
        {error && (
          <p role="alert" className="mb-6 break-words text-sm text-destructive">
            {error}
          </p>
        )}
        {checking ? (
          <p role="status">{t("Проверка доступа...")}</p>
        ) : !authenticated ? (
          <form onSubmit={login} className="max-w-md space-y-5">
            <label className="block text-sm">
              Email
              <input
                className={`${input} mt-2`}
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              {t("Пароль")}
              <input
                className={`${input} mt-2`}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button disabled={busy} className={button}>
              {t(busy ? "Вход..." : "Войти")}
            </button>
          </form>
        ) : (
          <>
            {admin && (
              <form
                onSubmit={create}
                className="mb-8 grid gap-4 border-y hairline py-6 sm:grid-cols-2"
              >
                <label className="text-sm">
                  {t("Название школы KG")}
                  <input
                    required
                    maxLength={300}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${input} mt-2`}
                  />
                </label>
                <button className={`${button} self-end`} disabled={busy}>
                  <Plus className="h-4 w-4" />
                  {t("Создать школу")}
                </button>
              </form>
            )}
            {!schools.length ? (
              <p className="text-muted-foreground">
                {t("Нет назначенных школ. Обратитесь к администратору.")}
              </p>
            ) : admin || schools.length > 1 ? (
              <label className="mb-8 block text-sm">
                {t("Школа")}
                <select
                  className={`${input} mt-2`}
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  <option value="">{t("Не выбрано")}</option>
                  {schools.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name_kg} /{" "}
                      {t(
                        s.is_archived
                          ? "В архиве"
                          : s.status === "review"
                            ? "На проверке"
                            : s.status === "published"
                              ? "Опубликовано"
                              : "Черновик",
                      )}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            {notice && (
              <p
                role="status"
                className="sticky top-4 z-10 mb-6 border hairline bg-background px-4 py-3 text-sm text-[var(--beige)]"
              >
                {t(notice)}
              </p>
            )}
            {loaded && (
              <SchoolForm
                key={`${loaded.record.id}-${loaded.record.revision}`}
                record={loaded.record}
                initial={loaded.draft}
                admin={admin}
                onSaved={reloadSelected}
              />
            )}
            {admin && loaded && (
              <SchoolLifecycleActions
                key={`${loaded.record.id}-${loaded.record.revision}`}
                record={loaded.record}
                onChanged={async (deleted, message) => {
                  if (deleted) {
                    setSelected("");
                    setLoaded(null);
                    setAssignments([]);
                    await refresh();
                    setNotice(message);
                  } else await reloadSelected(message);
                }}
              />
            )}
            {admin && schoolEditorAssignmentsEnabled && selected && (
              <section className="mt-6 border-t hairline py-8">
                <h2 className="mb-5 font-display text-2xl">{t("Редакторы школы")}</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void assign();
                  }}
                  className="flex flex-wrap gap-3"
                >
                  <label className="min-w-0 flex-1 text-sm">
                    {t("UUID существующего пользователя")}
                    <input
                      required
                      pattern="[0-9a-fA-F-]{36}"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      className={`${input} mt-2`}
                    />
                  </label>
                  <button disabled={busy} className={`${button} self-end`}>
                    <Plus className="h-4 w-4" />
                    {t("Назначить")}
                  </button>
                </form>
                <ul className="mt-4 divide-y divide-border">
                  {assignments.map((a) => (
                    <li key={a.user_id} className="flex items-center justify-between gap-3 py-3">
                      <span className="min-w-0 break-all text-sm text-muted-foreground">
                        {a.user_id}
                      </span>
                      <button
                        className={button}
                        disabled={busy}
                        title={t("Удалить назначение")}
                        aria-label={t("Удалить назначение")}
                        onClick={() => void assign(a.user_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
