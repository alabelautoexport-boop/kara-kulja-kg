import { createClient } from "npm:@supabase/supabase-js@2";
import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "npm:@aws-sdk/client-s3@3";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

class RequestError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}

function newsPrefix(mediaFolderId: string) {
  if (!UUID_PATTERN.test(mediaFolderId)) {
    throw new RequestError("Некорректный идентификатор папки новости.");
  }
  return `news/${mediaFolderId}/`;
}

function validateObjectKey(mediaFolderId: string, key: string) {
  const prefix = newsPrefix(mediaFolderId);
  const escapedId = mediaFolderId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const allowed = new RegExp(
    `^news/${escapedId}/(?:cover\\.(?:jpg|png|webp|avif)|gallery/[0-9a-f-]{36}\\.(?:jpg|png|webp|avif))$`,
    "i",
  );
  if (!key.startsWith(prefix) || !allowed.test(key)) {
    throw new RequestError("Недопустимый путь к файлу новости.");
  }
  return key;
}

function validateImage(file: File) {
  const extension = IMAGE_EXTENSIONS[file.type.toLowerCase()];
  if (!extension) throw new RequestError("Допустимы только JPG, PNG, WebP и AVIF.");
  if (!file.size || file.size > MAX_IMAGE_SIZE) {
    throw new RequestError("Размер изображения не должен превышать 5 МБ.");
  }
  return extension;
}

function publicUrl(baseUrl: string, key: string) {
  return `${baseUrl.replace(/\/+$/, "")}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new RequestError("Требуется авторизация.", 401);

  const token = authHeader.slice("Bearer ".length);
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const supabaseKey =
    Deno.env.get("SUPABASE_ANON_KEY")?.trim() ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")?.trim();
  if (!supabaseKey) throw new Error("Missing Supabase publishable server configuration");

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new RequestError("Требуется авторизация.", 401);

  const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
  if (adminError || isAdmin !== true) throw new RequestError("Недостаточно прав.", 403);
}

function r2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

async function listKeys(client: S3Client, bucket: string, prefix: string) {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    );
    for (const object of page.Contents ?? []) if (object.Key) keys.push(object.Key);
    continuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (continuationToken);
  return keys;
}

async function deleteKeys(client: S3Client, bucket: string, keys: string[]) {
  for (let offset = 0; offset < keys.length; offset += 1000) {
    const batch = keys.slice(offset, offset + 1000);
    const result = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    if (result.Errors?.length) throw new Error("R2 did not delete every requested object");
  }
}

async function readRequest(req: Request) {
  const contentType = req.headers.get("Content-Type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return {
      action: String(form.get("action") ?? ""),
      mediaFolderId: String(form.get("mediaFolderId") ?? ""),
      file: form.get("file"),
    };
  }
  const body = (await req.json()) as Record<string, unknown>;
  return {
    action: typeof body.action === "string" ? body.action : "",
    mediaFolderId: typeof body.mediaFolderId === "string" ? body.mediaFolderId : "",
    key: typeof body.key === "string" ? body.key : "",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Метод не поддерживается." }, 405);

  try {
    await requireAdmin(req);
    const request = await readRequest(req);
    const prefix = newsPrefix(request.mediaFolderId);
    const bucket = requiredEnv("R2_BUCKET_NAME");
    const baseUrl = requiredEnv("R2_PUBLIC_BASE_URL");
    const client = r2Client();

    if (request.action === "upload-cover") {
      if (!(request.file instanceof File)) throw new RequestError("Файл обложки не выбран.");
      const extension = validateImage(request.file);
      const key = `${prefix}cover.${extension}`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: new Uint8Array(await request.file.arrayBuffer()),
          ContentType: request.file.type,
        }),
      );
      const oldCoverKeys = (await listKeys(client, bucket, `${prefix}cover.`)).filter(
        (existingKey) => existingKey !== key,
      );
      await deleteKeys(client, bucket, oldCoverKeys);
      return json({ key, url: publicUrl(baseUrl, key) });
    }

    if (request.action === "upload-gallery") {
      if (!(request.file instanceof File)) throw new RequestError("Файл галереи не выбран.");
      const extension = validateImage(request.file);
      const key = `${prefix}gallery/${crypto.randomUUID()}.${extension}`;
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: new Uint8Array(await request.file.arrayBuffer()),
          ContentType: request.file.type,
        }),
      );
      return json({ key, url: publicUrl(baseUrl, key) });
    }

    if (request.action === "delete-object") {
      const key = validateObjectKey(request.mediaFolderId, request.key ?? "");
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
      return json({ deleted: true, key });
    }

    if (request.action === "delete-news-folder") {
      const keys = await listKeys(client, bucket, prefix);
      await deleteKeys(client, bucket, keys);
      return json({ deleted: true, count: keys.length, prefix });
    }

    throw new RequestError("Неизвестная операция с медиафайлами.");
  } catch (error) {
    if (error instanceof RequestError) return json({ error: error.message }, error.status);
    console.error("news-media operation failed", error instanceof Error ? error.message : error);
    return json({ error: "Операция с хранилищем не выполнена." }, 500);
  }
});
