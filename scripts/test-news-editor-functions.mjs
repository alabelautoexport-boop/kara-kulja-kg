// Pure in-memory handler tests. No network, credentials, Auth users or Deno deploy.
import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
// Public test fixture only; never read or generate a production pepper here.
const originalDeno = globalThis.Deno;
const originalGetRandomValues = crypto.getRandomValues;
let fixturePinSequence = 12345670;
// Deterministic, distinct test PINs; the production generator remains unchanged.
crypto.getRandomValues = (array) => {
  array[0] = ++fixturePinSequence;
  return array;
};
let testPepper = "isolated-tests-only-pepper-not-for-production-0001";
globalThis.Deno = {
  env: { get: (name) => (name === "NEWS_EDITOR_AUTH_PEPPER" ? testPepper : undefined) },
};
async function load(file) {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    platform: "node",
    format: "esm",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`
  );
}
const { createEditorAccessHandler } = await load(
  "supabase/functions/manage-editor-access/handler.ts",
);
const { createNewsLoginHandler } = await load("supabase/functions/news-editor-login/handler.ts");
const { deriveNewsEditorAuthPassword } = await load(
  "supabase/functions/_shared/news-editor-auth-password.ts",
);
const expectedTestPassword =
  "Ne1!" +
  createHmac("sha256", testPepper)
    .update("kara-kulja:news-editor-auth:v1\0news-editor:00000001")
    .digest("hex");
assert.ok((await deriveNewsEditorAuthPassword("news-editor", "00000001")) === expectedTestPassword);
assert.equal(expectedTestPassword.length, 68);
assert.ok(
  (await deriveNewsEditorAuthPassword("another-editor", "00000001")) !== expectedTestPassword,
);
assert.ok((await deriveNewsEditorAuthPassword("news-editor", "00000002")) !== expectedTestPassword);
const fixturePepper = testPepper;
testPepper = "isolated-tests-only-other-pepper-not-production-0002";
assert.ok((await deriveNewsEditorAuthPassword("news-editor", "00000001")) !== expectedTestPassword);
testPepper = fixturePepper;
const { isManagedNewsEditor } = await load("supabase/functions/_shared/managed-news-editor.ts");
const managedFixture = {
  assignment: { user_id: "fixture-id", username: "news-editor" },
  user: {
    id: "fixture-id",
    email: "news-news-editor@editors.kara-kulja.invalid",
    app_metadata: { news_editor_managed: true },
  },
  profile: { role: null },
  hasSchoolAssignment: false,
};
assert.equal(isManagedNewsEditor(managedFixture), true);
for (const role of ["owner", "admin", "editor", "user", undefined])
  assert.equal(isManagedNewsEditor({ ...managedFixture, profile: { role } }), false);
for (const override of [
  { assignment: null },
  { user: null },
  { profile: null },
  { hasSchoolAssignment: true },
  { user: { ...managedFixture.user, email: "different@invalid" } },
  { user: { ...managedFixture.user, app_metadata: { news_editor_managed: false } } },
])
  assert.equal(isManagedNewsEditor({ ...managedFixture, ...override }), false);
const request = (body, method = "POST") =>
  new Request("http://isolated.test", {
    method,
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
let allowed = false;
let assignment = null;
let calls = [];
let managed = true;
let failInsert = false;
let createdAuthPassword = "";
let generatedResetPassword = "";
const modeledAuthSessions = new Set(["old-session"]);
const handler = createEditorAccessHandler({
  authorize: async () => allowed,
  find: async () => {
    calls.push("find");
    return assignment ? { ...assignment } : null;
  },
  isManaged: async () => managed,
  createUser: async (email, password) => {
    assert.equal(email, "news-news-editor@editors.kara-kulja.invalid");
    assert.match(password, /^Ne1![0-9a-f]{64}$/);
    createdAuthPassword = password;
    calls.push("create");
    return "fixture-id";
  },
  removeNewUser: async (id) => {
    assert.equal(id, "fixture-id");
    calls.push("remove-new-only");
  },
  insert: async (value) => {
    if (failInsert) throw new Error("not returned");
    assignment = value;
  },
  setActive: async (_id, value) => {
    assignment.is_active = value;
    calls.push(value ? "active" : "inactive");
  },
  setBanned: async (_id, value) => {
    calls.push(value ? "ban" : "unban");
  },
  resetPin: async (_id, password) => {
    assert.match(password, /^Ne1![0-9a-f]{64}$/);
    generatedResetPassword = password;
    modeledAuthSessions.clear(); // Auth UpdatePassword(..., nil) signs out all sessions.
    calls.push("reset");
  },
});
for (const action of ["create", "reset", "disable", "enable"])
  assert.equal((await handler(request({ action, username: "news-editor" }))).status, 403);
assert.deepEqual(calls, []);
allowed = true;
assert.equal((await handler(request({ action: "create", username: "ADMIN@invalid" }))).status, 400);
const created = await (
  await handler(request({ action: "create", username: "news-editor" }))
).json();
assert.deepEqual(Object.keys(created).sort(), ["pin", "username"]);
assert.match(created.pin, /^\d{8}$/);
const firstAuthPassword = createdAuthPassword;
const authenticateDirect = (email, password) =>
  email === "news-news-editor@editors.kara-kulja.invalid" && password === firstAuthPassword;
assert.equal(authenticateDirect(managedFixture.user.email, created.pin), false);
assert.equal(
  authenticateDirect(
    managedFixture.user.email,
    await deriveNewsEditorAuthPassword(created.username, created.pin),
  ),
  true,
);
assert.ok(!JSON.stringify(created).includes(firstAuthPassword));
const createLogin = createNewsLoginHandler({
  find: async () => ({ user_id: "fixture-id", is_active: true }),
  canAttempt: async () => true,
  finishAttempt: async (_username, success) => success,
  login: async (email, password) =>
    authenticateDirect(email, password)
      ? { userId: "fixture-id", access_token: "created-session", refresh_token: "created-refresh" }
      : null,
});
assert.equal(
  (await createLogin(request({ username: created.username, pin: created.pin }))).status,
  200,
);
assert.equal((await handler(request({ action: "create", username: "news-editor" }))).status, 409);
calls = [];
const disabled = await (
  await handler(request({ action: "disable", username: "news-editor" }))
).json();
assert.equal(disabled.pin, undefined);
assert.deepEqual(calls, ["find", "inactive", "ban"]);
calls = [];
await handler(request({ action: "enable", username: "news-editor" }));
assert.deepEqual(calls, ["find", "unban", "active"]);
calls = [];
const reset = await (await handler(request({ action: "reset", username: "news-editor" }))).json();
assert.match(reset.pin, /^\d{8}$/);
assert.ok(generatedResetPassword !== firstAuthPassword);
assert.ok(generatedResetPassword !== reset.pin);
assert.ok(!JSON.stringify(reset).includes(generatedResetPassword));
assert.equal(reset.pin === created.pin, false);
assert.ok(
  (await deriveNewsEditorAuthPassword(reset.username, reset.pin)) === generatedResetPassword,
);
assert.equal(assignment.is_active, true);
assert.deepEqual(calls, ["find", "inactive", "reset", "active"]);
assert.equal(modeledAuthSessions.has("old-session"), false);
const afterResetLogin = createNewsLoginHandler({
  find: async () => ({ user_id: "fixture-id", is_active: assignment.is_active }),
  canAttempt: async () => true,
  finishAttempt: async (_username, success) => success,
  login: async (_email, password) => {
    if (password !== generatedResetPassword) return null;
    modeledAuthSessions.add("new-session");
    return {
      userId: "fixture-id",
      access_token: "new-session-access",
      refresh_token: "new-session-refresh",
    };
  },
});
const oldPin = created.pin;
assert.equal(
  (await afterResetLogin(request({ username: "news-editor", pin: oldPin }))).status,
  401,
);
assert.equal(
  (await afterResetLogin(request({ username: "news-editor", pin: reset.pin }))).status,
  200,
);
assert.equal(modeledAuthSessions.has("new-session"), true);
managed = false;
calls = [];
assert.equal((await handler(request({ action: "reset", username: "news-editor" }))).status, 404);
assert.deepEqual(calls, ["find"]);
managed = true;
assignment = null;
failInsert = true;
calls = [];
const failure = await (
  await handler(request({ action: "create", username: "news-editor" }))
).json();
assert.equal(failure.pin, undefined);
assert.ok(calls.includes("remove-new-only"));
assert.equal((await handler(request({}, "GET"))).status, 405);
let active = true,
  permit = true,
  authId = "fixture-id";
let failures = 0,
  passwordValid = true,
  authenticationCalls = 0;
const login = createNewsLoginHandler({
  find: async () => ({ user_id: "fixture-id", is_active: active }),
  canAttempt: async () => permit && failures < 8,
  finishAttempt: async (_username, success) => {
    if (failures >= 8) return false;
    if (success) {
      failures = 0;
      return true;
    }
    failures++;
    return false;
  },
  login: async (email, password) => {
    assert.match(email, /@editors\.kara-kulja\.invalid$/);
    assert.ok(password === expectedTestPassword);
    authenticationCalls++;
    if (!passwordValid) return null;
    return { userId: authId, access_token: "isolated-access", refresh_token: "isolated-refresh" };
  },
});
const success = await login(request({ username: "news-editor", pin: "00000001" }));
assert.equal(success.headers.get("cache-control"), "no-store");
assert.deepEqual(await success.json(), {
  access_token: "isolated-access",
  refresh_token: "isolated-refresh",
});
for (let n = 0; n < 20; n++)
  assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 200);
assert.equal(failures, 0);
passwordValid = false;
const badPinResponse = await login(request({ username: "news-editor", pin: "00000001" }));
const publicError = await badPinResponse.text();
assert.equal(failures, 1);
passwordValid = true;
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 200);
assert.equal(failures, 0);
passwordValid = false;
for (let n = 0; n < 8; n++)
  assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
assert.equal(failures, 8);
const callsBeforeBlock = authenticationCalls;
passwordValid = true;
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
assert.equal(authenticationCalls, callsBeforeBlock);
failures = 0; // Simulate the SQL window expiry (also covered against real SQL).
const unknownLogin = createNewsLoginHandler({
  find: async () => null,
  canAttempt: async () => true,
  finishAttempt: async () => true,
  login: async () => {
    throw new Error("must not authenticate unknown user");
  },
});
const unknownResponse = await unknownLogin(
  request({ username: "unknown-editor", pin: "00000001" }),
);
assert.equal(unknownResponse.status, 401);
assert.equal(await unknownResponse.text(), publicError);
for (const pin of ["1234567", "123456789", "abcdefgh", 12345678, "", "00000001\n"])
  assert.equal((await login(request({ username: "news-editor", pin }))).status, 401);
active = false;
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
active = true;
permit = false;
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
permit = true;
authId = "different-id";
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
// Missing/weak pepper must fail BEFORE any Auth mutation/authentication or PIN return.
testPepper = undefined;
await assert.rejects(() => deriveNewsEditorAuthPassword("news-editor", "00000001"));
assignment = null;
failInsert = false;
calls = [];
const missingCreate = await (
  await handler(request({ action: "create", username: "news-editor" }))
).json();
assert.equal(missingCreate.pin, undefined);
assert.deepEqual(calls, ["find"]);
assignment = { user_id: "fixture-id", username: "news-editor", is_active: true };
calls = [];
const missingReset = await (
  await handler(request({ action: "reset", username: "news-editor" }))
).json();
assert.equal(missingReset.pin, undefined);
assert.deepEqual(calls, ["find"]);
assert.equal(assignment.is_active, true);
active = true;
permit = true;
authId = "fixture-id";
failures = 0;
const authCallsBeforeMissing = authenticationCalls;
assert.equal((await login(request({ username: "news-editor", pin: "00000001" }))).status, 401);
assert.equal(authenticationCalls, authCallsBeforeMissing);
assert.equal(failures, 0);
testPepper = "short";
await assert.rejects(() => deriveNewsEditorAuthPassword("news-editor", "00000001"));
testPepper = fixturePepper;
const managementSource = fs.readFileSync(
  "supabase/functions/manage-editor-access/index.ts",
  "utf8",
);
assert.match(managementSource, /auth\.getUser\(header\.slice\(7\)\)/);
assert.match(managementSource, /caller\.rpc\("is_admin"\)/);
assert.match(managementSource, /isManagedNewsEditor/);
const media = fs.readFileSync("supabase/functions/news-media/index.ts", "utf8");
assert.match(media, /auth\.getUser\(token\)/);
assert.match(media, /rpc\("can_manage_news"\)/);
const oldMedia = execFileSync("git", ["show", "HEAD:supabase/functions/news-media/index.ts"], {
  encoding: "utf8",
});
assert.equal(media.replaceAll("\r\n", "\n"), oldMedia.replaceAll("\r\n", "\n"));
for (const file of [
  "src/lib/editor-auth.ts",
  "src/components/admin/NewsEditorLogin.tsx",
  "src/components/admin/NewsEditorAccessManagement.tsx",
]) {
  const code = fs.readFileSync(file, "utf8");
  assert.doesNotMatch(
    code,
    /SUPABASE_SERVICE_ROLE_KEY|@editors\.kara-kulja\.invalid|auth\.admin\./,
  );
}
console.log(
  "News handler tests passed: authorization before privileged operations, one-time PIN, managed-target checks, compensation, disable ordering, login validation/throttle/identity and no frontend service key/email mapping",
);
// Exercise the actual news-media JWT/RPC gate without AWS or Supabase network.
const mediaBundle = await build({
  entryPoints: ["supabase/functions/news-media/index.ts"],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  plugins: [
    {
      name: "isolated-media-adapters",
      setup(plugin) {
        plugin.onResolve({ filter: /^npm:/ }, (args) => ({
          path: args.path,
          namespace: "fixture",
        }));
        plugin.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
          loader: "js",
          contents: args.path.includes("supabase-js")
            ? "export const createClient=()=>globalThis.mediaClientFixture;"
            : "export class S3Client{}; export class DeleteObjectCommand{};export class DeleteObjectsCommand{};export class ListObjectsV2Command{};export class PutObjectCommand{};",
        }));
      },
    },
  ],
});
const oldDeno = globalThis.Deno;
globalThis.Deno = { serve: () => {}, env: { get: () => "isolated-value" } };
try {
  const { requireNewsManager } = await import(
    `data:text/javascript;base64,${Buffer.from(mediaBundle.outputFiles[0].text).toString("base64")}`
  );
  for (const [role, allowed] of [
    ["admin", true],
    ["active-news", true],
    ["school", false],
    ["disabled-news", false],
    ["old-news-session", false],
  ]) {
    globalThis.mediaClientFixture = {
      auth: { getUser: async () => ({ data: { user: { id: role } }, error: null }) },
      rpc: async (name) => {
        assert.equal(name, "can_manage_news");
        return { data: allowed, error: null };
      },
    };
    const req = new Request("http://isolated.test", {
      headers: { Authorization: "Bearer isolated-token" },
    });
    if (allowed) await requireNewsManager(req);
    else
      await assert.rejects(
        () => requireNewsManager(req),
        (error) => error.status === 403,
      );
  }
  await assert.rejects(
    () => requireNewsManager(new Request("http://isolated.test")),
    (error) => error.status === 401,
  );
} finally {
  globalThis.Deno = oldDeno;
  delete globalThis.mediaClientFixture;
}
console.log(
  "Production NULL-role managed accounts, failed-only login counting/generic errors, and actual news-media role/session gate tests passed",
);
globalThis.Deno = originalDeno;
crypto.getRandomValues = originalGetRandomValues;
console.log(
  "HMAC/direct Auth bypass tests passed: PIN is not Auth password; create, login, reset, response privacy and missing-pepper failure verified",
);
