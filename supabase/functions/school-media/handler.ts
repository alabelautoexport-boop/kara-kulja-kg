import { webpDimensions } from "../_shared/school-image-format.ts";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Row = {
  id: string;
  school_id: string;
  kind: "cover" | "gallery";
  state: string;
  main_key: string;
  thumb_key: string;
  width: number;
  height: number;
  thumb_width: number;
  thumb_height: number;
  main_sha256: string;
  thumb_sha256: string;
};
export type SchoolMediaDependencies = {
  authenticate: (req: Request) => Promise<{ id: string; admin: boolean }>;
  authorize: (schoolId: string, write: boolean) => Promise<boolean>;
  register: (schoolId: string, kind: string) => Promise<Row>;
  complete: (id: string, actor: string, main: object, thumb: object) => Promise<void>;
  asset: (schoolId: string, id: string) => Promise<Row | null>;
  putPrivate: (key: string, bytes: Uint8Array, sha: string) => Promise<void>;
  getPrivate: (key: string) => Promise<Uint8Array>;
  prepare: (schoolId: string, revision: number) => Promise<Row[]>;
  approve: (
    schoolId: string,
    revision: number,
    note: string,
    actor: string,
    media: Row[],
  ) => Promise<void>;
  recordFailure: (schoolId: string, assets: string[]) => Promise<void>;
  promote: (key: string, sha: string) => Promise<void>;
  cleanup: (schoolId: string) => Promise<void>;
};
const baseHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Cache-Control": "no-store",
  Vary: "Origin",
};
const allowedOrigins = [
  "https://kara-kulja.kg",
  "https://www.kara-kulja.kg",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
];
export function assetKeys(schoolId: string, kind: string, assetId: string) {
  if (!uuid.test(schoolId) || !uuid.test(assetId) || !["cover", "gallery"].includes(kind))
    throw new Error("Invalid asset path");
  const prefix = `schools/${schoolId}/${kind}/${assetId}/`;
  return [
    prefix + (kind === "cover" ? "main.webp" : "image.webp"),
    prefix + (kind === "cover" ? "card.webp" : "thumb.webp"),
  ];
}
const digest = async (bytes: Uint8Array) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource)))
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
async function inspect(file: File, kind: string, thumb: boolean) {
  const limit = kind === "cover" ? (thumb ? 150 : 400) : thumb ? 70 : 300;
  if (file.type !== "image/webp" || !file.size || file.size > limit * 1024)
    throw new Error("Invalid optimized image");
  const bytes = new Uint8Array(await file.arrayBuffer()),
    dims = webpDimensions(bytes);
  const side = thumb ? (kind === "cover" ? 960 : 480) : 1600;
  if (Math.max(dims.width, dims.height) > side) throw new Error("Invalid image dimensions");
  return { bytes, metadata: { ...dims, bytes: bytes.length, sha256: await digest(bytes) } };
}
export function createSchoolMediaHandler(deps: SchoolMediaDependencies) {
  return async (req: Request) => {
    const origin = req.headers.get("Origin") ?? "";
    const headers = {
      ...baseHeaders,
      ...(allowedOrigins.includes(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
    };
    const json = (value: unknown, status = 200) =>
      new Response(JSON.stringify(value), {
        status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    let actor;
    try {
      actor = await deps.authenticate(req);
    } catch {
      return json({ error: "Authentication required" }, 401);
    }
    try {
      const reader = req.body?.getReader();
      let length = 0;
      const chunks: Uint8Array[] = [];
      if (!reader) throw new Error("Missing body");
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.length;
        if (length > 1024 * 1024) {
          await reader.cancel();
          return json({ error: "Request too large" }, 413);
        }
        chunks.push(part.value);
      }
      const bytes = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.length;
      }
      const body = new Request(req.url, { method: "POST", headers: req.headers, body: bytes });
      const multipart = req.headers.get("Content-Type")?.includes("multipart/form-data");
      const form = multipart ? await body.formData() : null;
      const data = form ? Object.fromEntries(form) : await body.json();
      const { action, schoolId } = data;
      if (typeof schoolId !== "string" || !uuid.test(schoolId)) throw new Error("Invalid school");
      if (action === "cleanup") {
        if (!actor.admin) return json({ error: "Forbidden" }, 403);
        await deps.cleanup(schoolId);
        return json({ ok: true });
      }
      if (!(await deps.authorize(schoolId, action !== "preview")))
        return json({ error: "Forbidden" }, 403);
      if (action === "upload") {
        if (
          !form ||
          !["cover", "gallery"].includes(data.kind) ||
          !(data.main instanceof File) ||
          !(data.thumb instanceof File) ||
          data.assetId ||
          data.key
        )
          throw new Error("Invalid upload");
        const main = await inspect(data.main, data.kind, false),
          thumb = await inspect(data.thumb, data.kind, true);
        if (
          thumb.metadata.width > main.metadata.width ||
          thumb.metadata.height > main.metadata.height ||
          Math.abs(
            main.metadata.width * thumb.metadata.height -
              main.metadata.height * thumb.metadata.width,
          ) >
            Math.max(main.metadata.width, main.metadata.height) +
              Math.max(thumb.metadata.width, thumb.metadata.height)
        )
          throw new Error("Invalid image variants");
        const row = await deps.register(schoolId, data.kind);
        const keys = assetKeys(schoolId, data.kind, row.id);
        if (row.main_key !== keys[0] || row.thumb_key !== keys[1])
          throw new Error("Invalid server keys");
        await deps.putPrivate(keys[0], main.bytes, main.metadata.sha256);
        await deps.putPrivate(keys[1], thumb.bytes, thumb.metadata.sha256);
        await deps.complete(row.id, actor.id, main.metadata, thumb.metadata);
        return json({
          asset: {
            asset_id: row.id,
            kind: row.kind,
            main_key: keys[0],
            thumb_key: keys[1],
            width: main.metadata.width,
            height: main.metadata.height,
            thumb_width: thumb.metadata.width,
            thumb_height: thumb.metadata.height,
          },
        });
      }
      if (action === "preview") {
        if (
          typeof data.assetId !== "string" ||
          !uuid.test(data.assetId) ||
          !["main", "thumb"].includes(data.variant)
        )
          throw new Error("Invalid preview");
        const row = await deps.asset(schoolId, data.assetId);
        if (!row || row.state !== "ready") return json({ error: "Not found" }, 404);
        const keys = assetKeys(schoolId, row.kind, row.id);
        const preview = await deps.getPrivate(keys[data.variant === "main" ? 0 : 1]);
        webpDimensions(preview);
        return new Response(preview as BodyInit, {
          headers: {
            ...headers,
            "Content-Type": "image/webp",
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      if (action === "publish") {
        if (!actor.admin) return json({ error: "Forbidden" }, 403);
        if (
          !Number.isInteger(data.revision) ||
          data.revision < 0 ||
          (data.note && (typeof data.note !== "string" || data.note.length > 3000))
        )
          throw new Error("Invalid publication");
        let media: Row[] = [];
        try {
          media = await deps.prepare(schoolId, data.revision);
          for (const row of media) {
            if (row.school_id !== schoolId || row.state !== "ready")
              throw new Error("Invalid reviewed asset");
            const keys = assetKeys(schoolId, row.kind, row.id);
            if (row.main_key !== keys[0] || row.thumb_key !== keys[1])
              throw new Error("Invalid reviewed keys");
            await deps.promote(keys[0], row.main_sha256);
            await deps.promote(keys[1], row.thumb_sha256);
          }
          // Final RPC locks the school and rechecks revision + the entire exact set.
          await deps.approve(schoolId, data.revision, data.note ?? "", actor.id, media);
          return json({ published: true });
        } catch {
          // Include attempted writes: a timed-out conditional PUT may have succeeded.
          // prepare() durably records candidates even if this request cannot enqueue.
          try {
            await deps.recordFailure(
              schoolId,
              media.map((row) => row.id),
            );
          } catch {
            /* Existing sweep can recover durable promotion candidates. */
          }
          return json({ error: "school_media_publication_failed" }, 409);
        }
      }
      return json({ error: "Unknown operation" }, 400);
    } catch {
      return json({ error: "School media operation failed" }, 400);
    }
  };
}
