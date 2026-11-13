import {
  editorResponse,
  newsEditorEmail,
  validNewsUsername,
} from "../_shared/editor-credentials.ts";
import { deriveNewsEditorAuthPassword } from "../_shared/news-editor-auth-password.ts";
type LoginOps = {
  find: (username: string) => Promise<{ user_id: string; is_active: boolean } | null>;
  canAttempt: (username: string) => Promise<boolean>;
  finishAttempt: (username: string, success: boolean) => Promise<boolean>;
  login: (
    email: string,
    password: string,
  ) => Promise<{ userId: string; access_token: string; refresh_token: string } | null>;
};
export function createNewsLoginHandler(ops: LoginOps) {
  return async (request: Request) => {
    if (request.method === "OPTIONS") return editorResponse(request, {});
    if (request.method !== "POST") return editorResponse(request, {}, 405);
    const denied = () =>
      editorResponse(request, { error: "Неверный логин или PIN-код. Повторите позже." }, 401);
    try {
      const body = await request.json();
      if (
        !validNewsUsername(body.username) ||
        typeof body.pin !== "string" ||
        body.pin.length !== 8 ||
        !/^\d{8}$/.test(body.pin)
      )
        return denied();
      const assignment = await ops.find(body.username);
      if (!assignment?.is_active || !(await ops.canAttempt(body.username))) return denied();
      const password = await deriveNewsEditorAuthPassword(body.username, body.pin);
      const session = await ops.login(newsEditorEmail(body.username), password);
      if (!session) {
        await ops.finishAttempt(body.username, false);
        return denied();
      }
      if (session.userId !== assignment.user_id) return denied();
      const latest = await ops.find(body.username);
      if (!latest?.is_active || latest.user_id !== session.userId) return denied();
      if (!(await ops.finishAttempt(body.username, true))) return denied();
      return editorResponse(request, {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
    } catch {
      return denied();
    }
  };
}
