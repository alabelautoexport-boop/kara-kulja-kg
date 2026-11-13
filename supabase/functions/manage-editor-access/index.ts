import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { createEditorAccessHandler } from "./handler.ts";
import { isManagedNewsEditor } from "../_shared/managed-news-editor.ts";

const url = Deno.env.get("SUPABASE_URL")!;
const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
// Constructed server-side only; never returned to callers.
const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const checked = <T extends { data: unknown; error: unknown }>(result: T): T["data"] => {
  if (result.error) throw new Error("Operation failed");
  return result.data;
};
Deno.serve(
  createEditorAccessHandler({
    authorize: async (request) => {
      const header = request.headers.get("Authorization") ?? "";
      if (!header.startsWith("Bearer ")) return false;
      const caller = createClient(url, publicKey, {
        global: { headers: { Authorization: header } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const user = await caller.auth.getUser(header.slice(7));
      if (user.error || !user.data.user) return false;
      const role = await caller.rpc("is_admin");
      return !role.error && role.data === true;
    },
    find: async (username) =>
      checked(
        await service
          .from("news_editor_assignments")
          .select("user_id,username,is_active")
          .eq("username", username)
          .maybeSingle(),
      ),
    isManaged: async (assignment) => {
      const { user } = checked(await service.auth.admin.getUserById(assignment.user_id));
      const profile = checked(
        await service.from("profiles").select("role").eq("id", assignment.user_id).maybeSingle(),
      );
      const schools = checked(
        await service
          .from("school_editor_assignments")
          .select("school_id")
          .eq("user_id", assignment.user_id)
          .limit(1),
      );
      return isManagedNewsEditor({
        assignment,
        user,
        profile,
        hasSchoolAssignment: !schools || schools.length > 0,
      });
    },
    createUser: async (email, password) => {
      const { user } = checked(
        await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { news_editor_managed: true },
        }),
      );
      if (!user) throw new Error("User missing");
      return user.id;
    },
    removeNewUser: async (id) => {
      checked(await service.auth.admin.deleteUser(id));
    },
    insert: async (assignment) => {
      checked(await service.from("news_editor_assignments").insert(assignment));
    },
    setActive: async (id, active) => {
      checked(
        await service
          .from("news_editor_assignments")
          .update({ is_active: active })
          .eq("user_id", id),
      );
    },
    setBanned: async (id, banned) => {
      checked(
        await service.auth.admin.updateUserById(id, { ban_duration: banned ? "876000h" : "none" }),
      );
    },
    resetPin: async (id, password) => {
      checked(await service.auth.admin.updateUserById(id, { password }));
    },
  }),
);
