import { schoolEditorService, checked } from "../_shared/school-editor-service.ts";
import { createSchoolLoginHandler } from "./handler.ts";
const { service, caller, find, isManaged } = schoolEditorService();
Deno.serve(
  createSchoolLoginHandler({
    find: (name) => find("username", name),
    isManaged: (a) => isManaged(a),
    canAttempt: async (name) =>
      checked(await service.rpc("can_attempt_school_login", { p_username: name })) === true,
    finishAttempt: async (name, success) =>
      checked(
        await service.rpc("finish_school_login_attempt", { p_username: name, p_success: success }),
      ) === true,
    login: async (email, password) => {
      const { data, error } = await caller().auth.signInWithPassword({ email, password });
      if (error?.code === "invalid_credentials") return null;
      if (error || !data.session) throw Error("Authentication unavailable");
      return {
        userId: data.session.user.id,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    },
    sessionAllowed: async (session, schoolId) =>
      checked(
        await caller(session.access_token).rpc("can_edit_school", { p_school_id: schoolId }),
      ) === true,
    discard: async (token) => {
      checked(await service.auth.admin.signOut(token, "local"));
    },
  }),
);
