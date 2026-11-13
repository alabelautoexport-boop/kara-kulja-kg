import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, logoutAdmin, isCurrentUserAdmin } from "@/lib/admin-auth";
import { useAdminI18n } from "@/lib/admin-i18n";
import { AdminLanguageSwitcher } from "@/components/admin/AdminLanguageSwitcher";
import { SchoolForm } from "@/components/admin/SchoolForm";
import { SchoolAdminList, SchoolMetadata } from "@/components/admin/SchoolAdminList";
import { emptySchoolIdentity, validSchoolIdentity } from "@/lib/school-admin";
import { SchoolIdentityFields } from "@/components/admin/SchoolIdentityFields";
import { SchoolLifecycleActions } from "@/components/admin/SchoolLifecycleActions";
import {
  createSchool,
  getEditableSchools,
  loadSchoolDraft,
  saveSchoolDraft,
  type SchoolRecord,
} from "@/lib/schools-data";

const input =
  "min-h-11 w-full min-w-0 border hairline bg-background px-3 py-2 text-sm focus:border-[var(--beige)]";
const button =
  "inline-flex min-h-11 items-center justify-center gap-2 border hairline px-4 py-2 text-sm hover:border-[var(--beige)] disabled:opacity-50";

export function SchoolWorkspace({
  admin = false,
  adminSchoolId,
  onSelectSchool,
}: {
  admin?: boolean;
  adminSchoolId?: string;
  onSelectSchool?: (id: string) => void;
}) {
  const { t } = useAdminI18n();
  const queryClient = useQueryClient();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [schools, setSchools] = useState<SchoolRecord[]>([]);
  const [editorSelected, setEditorSelected] = useState("");
  const selected = admin ? (adminSchoolId ?? "") : editorSelected;
  const setSelected = (id: string) => (admin ? onSelectSchool?.(id) : setEditorSelected(id));
  const [creating, setCreating] = useState(false);
  const [loaded, setLoaded] = useState<Awaited<ReturnType<typeof loadSchoolDraft>> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identity, setIdentity] = useState(emptySchoolIdentity);
  const [notice, setNotice] = useState("");
  const sessionUserId = useRef<string | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const loadVersion = useRef(0);
  const workspaceMounted = useRef(false);

  const refresh = useCallback(async () => {
    const items = await getEditableSchools();
    setSchools(items);
    if (!admin && items.length === 1) setEditorSelected((current) => current || items[0].id);
    return items;
  }, [admin]);
  useEffect(() => {
    let active = true;
    workspaceMounted.current = true;
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
          loadVersion.current++;
          setSelected("");
          setLoaded(null);
          setCreating(false);
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
      workspaceMounted.current = false;
      subscription.unsubscribe();
    };
    // Translation changes do not re-authenticate or replace in-progress edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  useEffect(() => {
    const version = ++loadVersion.current;
    let active = true;
    setLoaded(null);
    setError("");
    setNotice("");
    setCreating(false);
    if (!authenticated || !selected) return;
    loadSchoolDraft(selected)
      .then((data) => {
        if (active && version === loadVersion.current && selectedRef.current === selected)
          setLoaded(data);
      })
      .catch(() => {
        if (active && version === loadVersion.current && selectedRef.current === selected)
          setError(t("Не удалось загрузить школы."));
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, authenticated, admin]);
  const reloadSelected = async (message?: string) => {
    const id = selected;
    const version = ++loadVersion.current;
    const userId = sessionUserId.current;
    setLoaded(null);
    // A single completed refresh supplies both the list and the selected view.
    // Older responses cannot resurrect a workspace after navigation or sign-out.
    await queryClient.invalidateQueries({ queryKey: ["schools", "published"] });
    try {
      const [items, updated] = await Promise.all([getEditableSchools(), loadSchoolDraft(id)]);
      if (
        !workspaceMounted.current ||
        version !== loadVersion.current ||
        selectedRef.current !== id ||
        sessionUserId.current !== userId
      )
        return;
      setSchools(items.map((school) => (school.id === id ? updated.record : school)));
      setLoaded(updated);
      if (message) setNotice(message);
    } catch (e) {
      if (version === loadVersion.current && selectedRef.current === id)
        setError(t("Не удалось загрузить школы."));
      throw e;
    }
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
    if (!validSchoolIdentity(identity)) return;
    setBusy(true);
    setError("");
    let createdId: string | null = null;
    try {
      const id = await createSchool(identity.name_kg.trim());
      createdId = id;
      const created = await loadSchoolDraft(id);
      await saveSchoolDraft(
        id,
        created.record.revision,
        {
          info: { ...created.draft.info, ...identity, name_kg: identity.name_kg.trim() },
          ort: created.draft.ort,
        },
        false,
      );
      await refresh();
      setCreating(false);
      setSelected(id);
      setIdentity(emptySchoolIdentity);
    } catch (e) {
      if (createdId) {
        // The existing create/save RPCs are separate. Retain and select a created
        // draft if initialization fails, so retrying cannot create a duplicate.
        setIdentity(emptySchoolIdentity);
        setCreating(false);
        setSelected(createdId);
        await refresh().catch(() => undefined);
        setError(
          t(
            "Школа создана, но основные данные не сохранены. Заполните раздел «Основное» выбранной школы.",
          ),
        );
      } else setError(t(e instanceof Error ? e.message : "Не удалось сохранить школу."));
    } finally {
      setBusy(false);
    }
  };
  const backToList = () => {
    loadVersion.current++;
    setSelected("");
    setLoaded(null);
    setCreating(false);
    setError("");
    setNotice("");
    setIdentity(emptySchoolIdentity);
  };
  const current =
    authenticated && selected && !creating && loaded?.record.id === selected ? loaded : null;
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
        {admin && authenticated && (selected || creating) && (
          <button
            type="button"
            className="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            disabled={busy}
            onClick={backToList}
          >
            <ArrowLeft className="h-4 w-4" />
            {t("К списку школ")}
          </button>
        )}
        <h1 className="mb-6 break-words font-display text-3xl sm:text-4xl">
          {admin
            ? creating
              ? t("Создать школу")
              : selected
                ? (current?.record.name_kg ?? t("Школа"))
                : t("Управление школами")
            : current
              ? current.record.name_kg
              : t("Моя школа")}
        </h1>
        {admin && current && (
          <div className="mb-8">
            <SchoolMetadata record={current.record} />
          </div>
        )}
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
            {admin && !selected && !creating && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCreating(true);
                    setError("");
                    setNotice("");
                  }}
                  className="mb-9 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-[var(--beige)] px-5 py-3 text-sm font-medium text-background hover:opacity-90 sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {t("Создать школу")}
                </button>
                <SchoolAdminList
                  schools={schools}
                  onOpen={(id) => {
                    setLoaded(null);
                    setSelected(id);
                  }}
                />
              </>
            )}
            {admin && creating && (
              <form onSubmit={create} className="max-w-3xl border-y hairline py-6">
                <fieldset disabled={busy} className="min-w-0 space-y-6">
                  <SchoolIdentityFields value={identity} onChange={setIdentity} />
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      className="min-h-11 bg-[var(--beige)] px-5 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
                      disabled={!validSchoolIdentity(identity)}
                    >
                      {t("Создать")}
                    </button>
                    <button type="button" className={button} onClick={backToList}>
                      {t("Отмена")}
                    </button>
                  </div>
                </fieldset>
              </form>
            )}
            {!admin &&
              (!schools.length ? (
                <p className="text-muted-foreground">
                  {t("Нет назначенных школ. Обратитесь к администратору.")}
                </p>
              ) : schools.length > 1 ? (
                <label className="mb-8 block text-sm">
                  {t("Школа")}
                  <select
                    className={input + " mt-2"}
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    <option value="">{t("Не выбрано")}</option>
                    {schools.map((school) => (
                      <option value={school.id} key={school.id}>
                        {school.name_kg}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null)}
            {selected && !current && !error && (
              <p role="status" className="py-6 text-sm text-muted-foreground">
                {t("Загрузка школы...")}
              </p>
            )}
            {selected && !current && error && (
              <button
                type="button"
                className={button}
                onClick={() => {
                  setError("");
                  void reloadSelected().catch(() => undefined);
                }}
              >
                {t("Повторить")}
              </button>
            )}
            {notice && (
              <p
                role="status"
                className="sticky top-4 z-10 mb-6 border hairline bg-background px-4 py-3 text-sm text-[var(--beige)]"
              >
                {t(notice)}
              </p>
            )}
            {current && (
              <SchoolForm
                key={`form-${current.record.id}-${current.record.revision}`}
                record={current.record}
                initial={current.draft}
                admin={admin}
                onSaved={reloadSelected}
              />
            )}
            {admin && current && (
              <SchoolLifecycleActions
                key={`lifecycle-${current.record.id}-${current.record.revision}`}
                record={current.record}
                onChanged={async (deleted, message) => {
                  if (deleted) {
                    setSelected("");
                    setLoaded(null);
                    setCreating(false);
                    await refresh();
                    setNotice(message);
                  } else await reloadSelected(message);
                }}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
