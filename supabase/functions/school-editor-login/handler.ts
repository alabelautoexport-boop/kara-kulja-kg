import { editorResponse } from "../_shared/editor-credentials.ts";
import {
  deriveSchoolEditorAuthPassword,
  schoolEditorEmail,
  validSchoolUsername,
} from "../_shared/school-editor-credentials.ts";
import type { SchoolAssignment } from "../_shared/managed-school-editor.ts";
type Session = { userId: string; access_token: string; refresh_token: string };
export type SchoolLoginOps = {
  find: (username: string) => Promise<SchoolAssignment | null>;
  isManaged: (a: SchoolAssignment) => Promise<boolean>;
  canAttempt: (username: string) => Promise<boolean>;
  finishAttempt: (username: string, success: boolean) => Promise<boolean>;
  login: (email: string, password: string) => Promise<Session | null>;
  sessionAllowed: (session: Session, schoolId: string) => Promise<boolean>;
  discard: (accessToken: string) => Promise<void>;
};
export function createSchoolLoginHandler(ops: SchoolLoginOps) {
  return async (req: Request) => {
    if (req.method === "OPTIONS") return editorResponse(req, {});
    if (req.method !== "POST") return editorResponse(req, {}, 405);
    const denied = () =>
      editorResponse(req, { error: "Неверный логин или PIN-код. Повторите позже." }, 401);
    let issued: Session | null = null;
    try {
      const body = await req.json();
      if (
        !validSchoolUsername(body.username) ||
        typeof body.pin !== "string" ||
        !/^\d{8}$/.test(body.pin)
      )
        return denied();
      const a = await ops.find(body.username);
      if (
        !a ||
        a.username !== body.username ||
        !(await ops.isManaged(a)) ||
        !(await ops.canAttempt(body.username))
      )
        return denied();
      issued = await ops.login(
        schoolEditorEmail(body.username),
        await deriveSchoolEditorAuthPassword(body.username, body.pin),
      );
      if (!issued) {
        await ops.finishAttempt(body.username, false);
        return denied();
      }
      const latest = await ops.find(body.username);
      if (
        !latest ||
        latest.username !== body.username ||
        latest.school_id !== a.school_id ||
        latest.updated_at !== a.updated_at ||
        issued.userId !== latest.user_id ||
        !(await ops.isManaged(latest)) ||
        !(await ops.sessionAllowed(issued, latest.school_id)) ||
        !(await ops.finishAttempt(body.username, true))
      ) {
        await ops.discard(issued.access_token);
        issued = null;
        return denied();
      }
      return editorResponse(req, {
        access_token: issued.access_token,
        refresh_token: issued.refresh_token,
      });
    } catch {
      if (issued)
        try {
          await ops.discard(issued.access_token);
        } catch {
          /* Never return rejected sessions. */
        }
      return denied();
    }
  };
}
