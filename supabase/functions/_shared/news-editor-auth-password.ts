import { validNewsUsername } from "./editor-credentials.ts";

// Server-only: neither the pepper nor this password may cross an Edge response.
export async function deriveNewsEditorAuthPassword(username: string, pin: string): Promise<string> {
  if (!validNewsUsername(username) || pin.length !== 8 || !/^\d{8}$/.test(pin)) {
    throw new Error("Invalid News Editor credentials");
  }
  const pepper = Deno.env.get("NEWS_EDITOR_AUTH_PEPPER");
  const encoder = new TextEncoder();
  if (!pepper || !pepper.trim() || encoder.encode(pepper).byteLength < 32) {
    throw new Error("News Editor authentication is not configured");
  }
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
    encoder.encode(`kara-kulja:news-editor-auth:v1\0${username}:${pin}`),
  );
  const digest = Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  // 68 ASCII bytes: full 256-bit MAC, all four character classes, below bcrypt's 72-byte limit.
  return `Ne1!${digest}`;
}
