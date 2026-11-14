import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { isManagedSchoolEditor, type SchoolAssignment } from "./managed-school-editor.ts";
export const checked = <T extends { data: unknown; error: unknown }>(r: T): T["data"] => {
  if (r.error) throw Error("Operation failed");
  return r.data;
};
export function schoolEditorService() {
  const url = Deno.env.get("SUPABASE_URL")!,
    key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options);
  const caller = (token?: string) =>
    createClient(url, key, {
      ...options,
      ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
    });
  const find = async (column: string, value: string) =>
    checked(
      await service
        .from("school_editor_assignments")
        .select("school_id,user_id,username,is_active,updated_at")
        .not("username", "is", null)
        .eq(column, value)
        .maybeSingle(),
    );
  const isManaged = async (a: SchoolAssignment, management = false) => {
    const [auth, profile, assignments, news, school] = await Promise.all([
      service.auth.admin.getUserById(a.user_id),
      service.from("profiles").select("role").eq("id", a.user_id).maybeSingle(),
      service
        .from("school_editor_assignments")
        .select("school_id,username")
        .eq("user_id", a.user_id),
      service.from("news_editor_assignments").select("user_id").eq("user_id", a.user_id),
      service.from("schools").select("id,is_archived").eq("id", a.school_id).maybeSingle(),
    ]);
    return isManagedSchoolEditor({
      assignment: a,
      user: checked(auth).user,
      profile: checked(profile),
      assignments: checked(assignments) ?? [],
      hasNewsAssignment: (checked(news)?.length ?? 0) > 0,
      school: checked(school),
      allowInactive: management,
      allowArchived: management,
    });
  };
  const authorize = async (req: Request) => {
    const header = req.headers.get("Authorization");
    if (!header?.startsWith("Bearer ")) return false;
    const c = caller(header.slice(7)),
      u = await c.auth.getUser(header.slice(7));
    if (u.error || !u.data.user) return false;
    return checked(await c.rpc("is_admin")) === true;
  };
  return { service, caller, find, isManaged, authorize };
}
