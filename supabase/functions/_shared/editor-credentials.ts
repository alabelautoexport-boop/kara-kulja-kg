export const validNewsUsername = (value: unknown): value is string =>
  typeof value === "string" &&
  value === value.trim() &&
  value.length >= 3 &&
  value.length <= 40 &&
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);

// Server-only mapping. This address is not a mailbox and is never rendered.
export function newsEditorEmail(username: string) {
  if (!validNewsUsername(username)) throw new Error("Invalid username");
  return `news-${username}@editors.kara-kulja.invalid`;
}
export function generateEditorPin() {
  const value = new Uint32Array(1);
  do {
    crypto.getRandomValues(value);
  } while (value[0] >= 4200000000);
  return String(value[0] % 100000000).padStart(8, "0");
}
export function editorResponse(req: Request, body: object, status = 200) {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = [
    "https://kara-kulja.kg",
    "https://www.kara-kulja.kg",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
  ];
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : "null",
      "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
    },
  });
}
