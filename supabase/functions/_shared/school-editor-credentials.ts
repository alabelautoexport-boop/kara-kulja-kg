import { validNewsUsername } from "./editor-credentials.ts";
export const validSchoolUsername = validNewsUsername;
export const schoolEditorEmail = (username: string) => {
  if (!validSchoolUsername(username)) throw new Error("Invalid username");
  return `school-${username}@editors.kara-kulja.invalid`;
};
export async function deriveSchoolEditorAuthPassword(username: string, pin: string) {
  if (!validSchoolUsername(username) || !/^\d{8}$/.test(pin))
    throw new Error("Invalid credentials");
  const pepper = Deno.env.get("SCHOOL_EDITOR_AUTH_PEPPER");
  const encoder = new TextEncoder();
  if (!pepper?.trim() || encoder.encode(pepper).length < 32)
    throw new Error("School authentication is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`kara-kulja:school-editor-auth:v1\0${username}:${pin}`),
  );
  return (
    "Se1!" +
    Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
}
