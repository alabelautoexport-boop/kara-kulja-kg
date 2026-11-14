import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectsCommand,
} from "npm:@aws-sdk/client-s3@3.1167.0";
import { createSchoolMediaHandler } from "./handler.ts";
const env = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error("School media configuration missing");
  return value;
};
const checked = <T extends { data: unknown; error: unknown }>(result: T): T["data"] => {
  if (result.error) throw new Error("School media database operation failed");
  return result.data;
};
Deno.serve(async (req) => {
  let caller: SupabaseClient, service: SupabaseClient;
  let actorSession: string | null = null;
  let r2: S3Client;
  const client = () =>
    (r2 ??= new S3Client({
      region: "auto",
      endpoint: `https://${env("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env("R2_ACCESS_KEY_ID"),
        secretAccessKey: env("R2_SECRET_ACCESS_KEY"),
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    }));
  const get = async (bucket: string, key: string) => {
    const result = await client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) throw new Error("Missing object");
    return await result.Body.transformToByteArray();
  };
  const put = async (bucket: string, key: string, bytes: Uint8Array, sha: string) => {
    try {
      await client().send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: bytes,
          ContentType: "image/webp",
          Metadata: { sha256: sha },
          IfNoneMatch: "*",
        }),
      );
    } catch (e) {
      if (
        ![409, 412].includes(
          (e as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode ?? 0,
        )
      )
        throw e;
      const old = await client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      if (old.Metadata?.sha256 !== sha) throw new Error("Immutable object conflict");
    }
  };
  return createSchoolMediaHandler({
    authenticate: async (request) => {
      const header = request.headers.get("Authorization");
      if (!header?.startsWith("Bearer ")) throw new Error("No session");
      caller = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
        global: { headers: { Authorization: header } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const user = checked(await caller.auth.getUser(header.slice(7))).user;
      if (!user) throw new Error("No user");
      // Read only after Auth verifies the token. DB matches this claim to auth.sessions.
      const payload = header.slice(7).split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      actorSession = JSON.parse(atob(payload)).session_id ?? null;
      const admin = checked(await caller.rpc("is_admin")) === true;
      service = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      return { id: user.id, admin };
    },
    authorize: async (id, write) =>
      checked(
        await caller.rpc(write ? "can_manage_school_media" : "can_edit_school", {
          p_school_id: id,
        }),
      ) === true,
    register: async (id, kind) =>
      checked(await caller.rpc("register_school_media", { p_school_id: id, p_kind: kind })),
    complete: async (id, actor, main, thumb) => {
      checked(
        await service.rpc("complete_school_media", {
          p_id: id,
          p_actor: actor,
          p_main: main,
          p_thumb: thumb,
          p_session_id: actorSession,
        }),
      );
    },
    asset: async (schoolId, id) =>
      checked(
        await service
          .from("school_media")
          .select("*")
          .eq("id", id)
          .eq("school_id", schoolId)
          .maybeSingle(),
      ),
    putPrivate: async (key, bytes, sha) => {
      if (env("SCHOOL_MEDIA_PRIVATE_BUCKET") === env("R2_BUCKET_NAME"))
        throw new Error("Separate private bucket required");
      await put(env("SCHOOL_MEDIA_PRIVATE_BUCKET"), key, bytes, sha);
    },
    getPrivate: (key) => get(env("SCHOOL_MEDIA_PRIVATE_BUCKET"), key),
    prepare: async (id, revision) =>
      checked(
        await caller.rpc("prepare_school_media_publication", {
          p_school_id: id,
          p_revision: revision,
        }),
      ),
    approve: async (id, revision, note, actor, media) => {
      checked(
        await service.rpc("finish_school_media_publication", {
          p_school_id: id,
          p_revision: revision,
          p_note: note,
          p_actor: actor,
          p_media: media,
        }),
      );
    },
    recordFailure: async (id, assets) => {
      checked(
        await service.rpc("record_school_media_promotion_failure", {
          p_school_id: id,
          p_assets: assets,
        }),
      );
    },
    promote: async (key, sha) => {
      if (env("SCHOOL_MEDIA_PRIVATE_BUCKET") === env("R2_BUCKET_NAME"))
        throw new Error("Separate private bucket required");
      await put(
        env("R2_BUCKET_NAME"),
        key,
        await get(env("SCHOOL_MEDIA_PRIVATE_BUCKET"), key),
        sha,
      );
    },
    cleanup: async (schoolId) => {
      checked(await service.rpc("sweep_school_media", { p_school_id: schoolId }));
      const jobs = checked(
        await service
          .from("school_media_cleanup_jobs")
          .select("*")
          .eq("school_id", schoolId)
          .is("completed_at", null)
          .limit(50),
      );
      for (const job of jobs ?? []) {
        const allowed = new RegExp(
          `^schools/${schoolId}/(?:cover|gallery)/[0-9a-f-]{36}/(?:main|image|card|thumb)\\.webp$`,
          "i",
        );
        if (!allowed.test(job.main_key) || !allowed.test(job.thumb_key))
          throw new Error("Invalid cleanup job");
        checked(
          await service
            .from("school_media_cleanup_jobs")
            .update({ attempts: job.attempts + 1 })
            .eq("id", job.id),
        );
        for (const bucket of [env("SCHOOL_MEDIA_PRIVATE_BUCKET"), env("R2_BUCKET_NAME")]) {
          const result = await client().send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: [{ Key: job.main_key }, { Key: job.thumb_key }] },
            }),
          );
          if (result.Errors?.length) throw new Error("Cleanup incomplete");
        }
        checked(
          await service
            .from("school_media_cleanup_jobs")
            .update({ completed_at: new Date().toISOString() })
            .eq("id", job.id),
        );
      }
    },
  })(req);
});
