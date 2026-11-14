import { editorResponse, generateEditorPin } from "../_shared/editor-credentials.ts";
import {
  deriveSchoolEditorAuthPassword,
  schoolEditorEmail,
  validSchoolUsername,
} from "../_shared/school-editor-credentials.ts";
import type { SchoolAssignment } from "../_shared/managed-school-editor.ts";
export type SchoolAccessOps = {
  authorize: (request: Request) => Promise<boolean>;
  schoolExists: (id: string) => Promise<boolean>;
  find: (id: string) => Promise<SchoolAssignment | null>;
  findUsername: (name: string) => Promise<SchoolAssignment | null>;
  isManaged: (assignment: SchoolAssignment) => Promise<boolean>;
  createUser: (email: string, password: string) => Promise<string>;
  removeNewUser: (id: string) => Promise<void>;
  insert: (assignment: SchoolAssignment) => Promise<void>;
  setActive: (schoolId: string, active: boolean) => Promise<void>;
  setBanned: (id: string, banned: boolean) => Promise<void>;
  resetPin: (id: string, password: string) => Promise<void>;
  revoke: (schoolId: string) => Promise<void>;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function createSchoolAccessHandler(ops: SchoolAccessOps) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return editorResponse(req, {});
    if (req.method !== "POST") return editorResponse(req, {}, 405);
    try {
      if (!(await ops.authorize(req))) return editorResponse(req, { error: "Нет доступа." }, 403);
      const body = await req.json();
      if (
        !uuid.test(body.schoolId ?? "") ||
        body.userId ||
        body.user_id ||
        !["status", "create", "reset", "disable", "enable"].includes(body.action)
      )
        throw Error("Invalid request");
      if (!(await ops.schoolExists(body.schoolId))) throw Error("School missing");
      const existing = await ops.find(body.schoolId);
      if (body.action === "status") {
        if (!existing) return editorResponse(req, { account: null });
        if (!(await ops.isManaged(existing))) throw Error("Invalid managed identity");
        return editorResponse(req, {
          account: { username: existing.username, is_active: existing.is_active },
        });
      }
      if (body.action === "create") {
        if (
          !validSchoolUsername(body.username) ||
          existing ||
          (await ops.findUsername(body.username))
        )
          throw Error("Unavailable username");
        const pin = generateEditorPin(),
          password = await deriveSchoolEditorAuthPassword(body.username, pin);
        const id = await ops.createUser(schoolEditorEmail(body.username), password);
        try {
          await ops.insert({
            school_id: body.schoolId,
            user_id: id,
            username: body.username,
            is_active: true,
          });
        } catch {
          await ops.removeNewUser(id);
          throw Error("Assignment failed");
        }
        return editorResponse(req, { username: body.username, pin });
      }
      if (!existing || !(await ops.isManaged(existing))) throw Error("Managed identity required");
      if (body.action === "enable") {
        await ops.setBanned(existing.user_id, false);
        await ops.revoke(body.schoolId);
        await ops.setActive(body.schoolId, true);
      } else {
        // Fail closed through password/ban/session operations, even if an Auth call fails.
        await ops.setActive(body.schoolId, false);
        if (body.action === "disable") {
          await ops.setBanned(existing.user_id, true);
          await ops.revoke(body.schoolId);
        } else {
          const pin = generateEditorPin(),
            password = await deriveSchoolEditorAuthPassword(existing.username, pin);
          await ops.resetPin(existing.user_id, password);
          await ops.revoke(body.schoolId);
          if (existing.is_active) await ops.setActive(body.schoolId, true);
          return editorResponse(req, { username: existing.username, pin });
        }
      }
      return editorResponse(req, { username: existing.username, ok: true });
    } catch {
      return editorResponse(
        req,
        { error: "Не удалось изменить доступ. Обновите страницу и повторите попытку." },
        400,
      );
    }
  };
}
