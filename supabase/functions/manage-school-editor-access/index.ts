import { schoolEditorService, checked } from "../_shared/school-editor-service.ts";
import { createSchoolAccessHandler } from "./handler.ts";
const { service, find, isManaged, authorize } = schoolEditorService();
Deno.serve(
  createSchoolAccessHandler({
    authorize,
    schoolExists: async (id) =>
      !!checked(await service.from("schools").select("id").eq("id", id).maybeSingle()),
    find: (id) => find("school_id", id),
    findUsername: (name) => find("username", name),
    isManaged: (a) => isManaged(a, true),
    createUser: async (email, password) => {
      const user = checked(
        await service.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          app_metadata: { school_editor_managed: true },
        }),
      ).user;
      if (!user) throw Error("User missing");
      try {
        const profile = checked(
          await service.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        );
        if (!profile || profile.role !== null) throw Error("Invalid profile");
        return user.id;
      } catch {
        checked(await service.auth.admin.deleteUser(user.id));
        throw Error("Profile not suitable");
      }
    },
    removeNewUser: async (id) => {
      checked(await service.auth.admin.deleteUser(id));
    },
    insert: async (a) => {
      checked(await service.from("school_editor_assignments").insert(a));
    },
    setActive: async (id, active) => {
      checked(
        await service
          .from("school_editor_assignments")
          .update({ is_active: active })
          .eq("school_id", id)
          .not("username", "is", null),
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
    revoke: async (id) => {
      checked(await service.rpc("revoke_school_editor_sessions", { p_school_id: id }));
    },
  }),
);
