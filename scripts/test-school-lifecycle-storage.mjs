// Actual school-media cleanup entry point, isolated Auth/DB/S3 fixtures. No network.
import assert from "node:assert/strict";
import { build } from "esbuild";
const school = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
const asset = "33333333-3333-4333-8333-333333333333";
const keys = [
  `schools/${school}/cover/${asset}/main.webp`,
  `schools/${school}/cover/${asset}/card.webp`,
];
const otherKey = `schools/${other}/cover/${asset}/main.webp`,
  sharedKey = "shared/logo.webp";
const originalDeno = globalThis.Deno;
let serve,
  admin = true,
  failPublic = true,
  deletions = 0,
  sweeps = 0;
const job = {
  id: "fixture-job",
  school_id: school,
  main_key: keys[0],
  thumb_key: keys[1],
  attempts: 0,
  completed_at: null,
};
const objects = new Map(
  ["fixture-private", "fixture-public"].map((bucket) => [
    bucket,
    new Set([...keys, otherKey, sharedKey]),
  ]),
);
const service = {
  rpc: async (name, args) => {
    assert.equal(name, "sweep_school_media");
    assert.equal(args.p_school_id, school);
    sweeps++;
    return { data: null, error: null };
  },
  from(table) {
    assert.equal(table, "school_media_cleanup_jobs");
    let update,
      limit = 50;
    const filters = [];
    const query = {
      select() {
        return query;
      },
      eq(k, v) {
        filters.push([k, v]);
        return query;
      },
      is(k, v) {
        filters.push([k, v]);
        return query;
      },
      limit(n) {
        limit = n;
        return query;
      },
      update(value) {
        update = value;
        return query;
      },
      then(resolve) {
        const rows = [job].filter((row) => filters.every(([k, v]) => row[k] === v)).slice(0, limit);
        if (update) for (const row of rows) Object.assign(row, update);
        return Promise.resolve({ data: update ? null : structuredClone(rows), error: null }).then(
          resolve,
        );
      },
    };
    return query;
  },
};
const caller = {
  auth: { getUser: async () => ({ data: { user: { id: "fixture-admin" } }, error: null }) },
  rpc: async (name) => {
    assert.equal(name, "is_admin");
    return { data: admin, error: null };
  },
};
const env = {
  SUPABASE_URL: "https://fixture.invalid",
  SUPABASE_ANON_KEY: "fixture-public-key",
  SUPABASE_SERVICE_ROLE_KEY: "fixture-server-key",
  R2_ACCOUNT_ID: "fixture-account",
  R2_ACCESS_KEY_ID: "fixture-access",
  R2_SECRET_ACCESS_KEY: "fixture-secret",
  SCHOOL_MEDIA_PRIVATE_BUCKET: "fixture-private",
  R2_BUCKET_NAME: "fixture-public",
};
globalThis.Deno = {
  env: { get: (name) => env[name] },
  serve: (handler) => {
    serve = handler;
  },
};
globalThis.lifecycleStorageFixture = {
  createClient: (_url, key) => (key === "fixture-server-key" ? service : caller),
  send: async (input) => {
    assert.ok(input.Delete?.Objects);
    deletions++;
    for (const { Key } of input.Delete.Objects)
      assert.ok(keys.includes(Key), "only exclusively owned, validated school keys may be deleted");
    if (input.Bucket === "fixture-public" && failPublic) {
      failPublic = false;
      return { Errors: [{ Code: "InternalError" }] };
    }
    for (const { Key } of input.Delete.Objects) objects.get(input.Bucket).delete(Key);
    return {};
  },
};
try {
  const result = await build({
    entryPoints: ["supabase/functions/school-media/index.ts"],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
    plugins: [
      {
        name: "local-sdk",
        setup(p) {
          p.onResolve({ filter: /^npm:@supabase\/supabase-js@/ }, () => ({
            path: "auth",
            namespace: "sdk-fixture",
          }));
          p.onResolve({ filter: /^npm:@aws-sdk\/client-s3@/ }, () => ({
            path: "s3",
            namespace: "sdk-fixture",
          }));
          p.onLoad({ filter: /.*/, namespace: "sdk-fixture" }, (args) => ({
            loader: "js",
            contents:
              args.path === "auth"
                ? "export const createClient=(...args)=>globalThis.lifecycleStorageFixture.createClient(...args);"
                : `export class S3Client{send(command){return globalThis.lifecycleStorageFixture.send(command.input);}}class Command{constructor(input){this.input=input;}}export class PutObjectCommand extends Command{}export class GetObjectCommand extends Command{}export class HeadObjectCommand extends Command{}export class DeleteObjectsCommand extends Command{}`,
          }));
        },
      },
    ],
  });
  await import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
  const token =
    "e30." +
    Buffer.from(JSON.stringify({ session_id: "44444444-4444-4444-8444-444444444444" })).toString(
      "base64url",
    ) +
    ".fixture";
  const request = (authorized = true) =>
    new Request("https://fixture.invalid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorized ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action: "cleanup", schoolId: school }),
    });
  assert.equal((await serve(request(false))).status, 401);
  assert.equal(deletions, 0);
  admin = false;
  assert.equal((await serve(request())).status, 403);
  assert.equal(sweeps, 0);
  assert.equal(deletions, 0);
  admin = true;
  assert.equal((await serve(request())).status, 400);
  assert.equal(job.completed_at, null);
  assert.equal(job.attempts, 1);
  assert.ok(keys.every((key) => !objects.get("fixture-private").has(key)));
  assert.ok(keys.every((key) => objects.get("fixture-public").has(key)));
  assert.equal((await serve(request())).status, 200);
  assert.ok(job.completed_at);
  assert.equal(job.attempts, 2);
  for (const set of objects.values()) {
    assert.ok(keys.every((key) => !set.has(key)));
    assert.ok(set.has(otherKey));
    assert.ok(set.has(sharedKey));
  }
  const after = deletions;
  assert.equal((await serve(request())).status, 200);
  assert.equal(deletions, after, "completed jobs are not rerun");
  job.completed_at = null;
  job.thumb_key = sharedKey;
  assert.equal((await serve(request())).status, 400);
  assert.equal(deletions, after, "invalid/shared key rejected before deletion");
  console.log(
    "School lifecycle storage tests passed: actual cleanup entry point, Admin gate, private/public deletion, failed-job retention/idempotent retry, completed-job skipping, foreign/shared-key protection",
  );
} finally {
  globalThis.Deno = originalDeno;
  delete globalThis.lifecycleStorageFixture;
}
