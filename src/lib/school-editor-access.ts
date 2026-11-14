import { supabase } from "@/lib/supabase";
export type SchoolAccessStatus = { username: string; is_active: boolean };
export async function manageSchoolAccess(
  schoolId: string,
  action: "status" | "create" | "reset" | "disable" | "enable",
  username?: string,
) {
  const { data, error } = await supabase.functions.invoke("manage-school-editor-access", {
    body: { schoolId, action, ...(username ? { username } : {}) },
  });
  if (error || !data || data.error)
    throw Error("Не удалось изменить доступ. Обновите страницу и повторите попытку.");
  return data as { account?: SchoolAccessStatus | null; username?: string; pin?: string };
}
export async function resolveSchoolEditor() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { user: false, userId: null, schoolId: null };
  const result = await supabase.rpc("current_school_editor_school");
  if (result.error) throw Error("Нет доступа к этому разделу.");
  return { user: true, userId: data.user.id, schoolId: result.data as string | null };
}
export async function loginSchoolEditor(username: string, pin: string) {
  const { data, error } = await supabase.functions.invoke("school-editor-login", {
    body: { username: username.trim().toLowerCase(), pin },
  });
  if (error || !data?.access_token || !data?.refresh_token)
    throw Error("Неверный логин или PIN-код. Повторите позже.");
  try {
    const session = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (session.error || !(await resolveSchoolEditor()).schoolId) throw Error("Access denied");
  } catch {
    await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    throw Error("Неверный логин или PIN-код. Повторите позже.");
  }
}
