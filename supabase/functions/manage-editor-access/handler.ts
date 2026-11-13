import {
  editorResponse,
  generateEditorPin,
  newsEditorEmail,
  validNewsUsername,
} from "../_shared/editor-credentials.ts";
import { deriveNewsEditorAuthPassword } from "../_shared/news-editor-auth-password.ts";
type Assignment = { user_id: string; username: string; is_active: boolean };
export type EditorAccessOperations = {
  authorize: (request: Request) => Promise<boolean>;
  find: (username: string) => Promise<Assignment | null>;
  isManaged: (assignment: Assignment) => Promise<boolean>;
  createUser: (email: string, password: string) => Promise<string>;
  removeNewUser: (id: string) => Promise<void>;
  insert: (assignment: Assignment) => Promise<void>;
  setActive: (id: string, active: boolean) => Promise<void>;
  setBanned: (id: string, banned: boolean) => Promise<void>;
  resetPin: (id: string, password: string) => Promise<void>;
};
export function createEditorAccessHandler(ops: EditorAccessOperations) {
  return async (request: Request) => {
    if (request.method === "OPTIONS") return editorResponse(request, {});
    if (request.method !== "POST")
      return editorResponse(request, { error: "Method not allowed" }, 405);
    try {
      // Authorization completes BEFORE any privileged user/assignment operation.
      if (!(await ops.authorize(request)))
        return editorResponse(request, { error: "Нет доступа." }, 403);
      const body = await request.json();
      if (
        !validNewsUsername(body.username) ||
        !["create", "reset", "disable", "enable"].includes(body.action)
      )
        return editorResponse(request, { error: "Проверьте логин и действие." }, 400);
      const existing = await ops.find(body.username);
      if (body.action === "create") {
        if (existing) return editorResponse(request, { error: "Логин уже занят." }, 409);
        const pin = generateEditorPin();
        const password = await deriveNewsEditorAuthPassword(body.username, pin);
        const id = await ops.createUser(newsEditorEmail(body.username), password);
        try {
          await ops.insert({ user_id: id, username: body.username, is_active: true });
        } catch {
          await ops.removeNewUser(id);
          throw new Error("Assignment failed");
        }
        return editorResponse(request, { username: body.username, pin });
      }
      if (!existing || !(await ops.isManaged(existing)))
        return editorResponse(request, { error: "Доступ не найден." }, 404);
      if (body.action === "disable") {
        await ops.setActive(existing.user_id, false); // Old JWTs immediately lose News RLS/media access.
        await ops.setBanned(existing.user_id, true);
      } else if (body.action === "enable") {
        await ops.setBanned(existing.user_id, false);
        await ops.setActive(existing.user_id, true);
      } else {
        const pin = generateEditorPin();
        const password = await deriveNewsEditorAuthPassword(existing.username, pin);
        await ops.setActive(existing.user_id, false);
        await ops.resetPin(existing.user_id, password);
        if (existing.is_active) await ops.setActive(existing.user_id, true);
        return editorResponse(request, { username: existing.username, pin });
      }
      return editorResponse(request, { username: existing.username, ok: true });
    } catch {
      // Never log/return request bodies, PINs, Auth objects or service errors.
      return editorResponse(
        request,
        { error: "Не удалось изменить доступ. Обновите список и повторите попытку." },
        400,
      );
    }
  };
}
