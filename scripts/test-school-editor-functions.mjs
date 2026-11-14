// In-memory Edge/Auth/R2 fixtures only; no remote services or production secrets.
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createHmac } from "node:crypto";
import fs from "node:fs";
import { fixtureWebp } from "./school-media-fixtures.mjs";
const originalDeno = globalThis.Deno;
let pepper = "school-tests-only-not-production-pepper-000000000";
globalThis.Deno = {
  env: { get: (name) => (name === "SCHOOL_EDITOR_AUTH_PEPPER" ? pepper : undefined) },
};
const load = async (file) => {
  const b = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
  });
  return import(
    `data:text/javascript;base64,${Buffer.from(b.outputFiles[0].text).toString("base64")}`
  );
};
try {
  const { deriveSchoolEditorAuthPassword, schoolEditorEmail, validSchoolUsername } = await load(
    "supabase/functions/_shared/school-editor-credentials.ts",
  );
  const { isManagedSchoolEditor } = await load(
    "supabase/functions/_shared/managed-school-editor.ts",
  );
  const { isManagedNewsEditor } = await load("supabase/functions/_shared/managed-news-editor.ts");
  const { createSchoolAccessHandler } = await load(
    "supabase/functions/manage-school-editor-access/handler.ts",
  );
  const { createSchoolLoginHandler } = await load(
    "supabase/functions/school-editor-login/handler.ts",
  );
  const { createNewsLoginHandler } = await load("supabase/functions/news-editor-login/handler.ts");
  const { createSchoolMediaHandler, assetKeys } = await load(
    "supabase/functions/school-media/handler.ts",
  );
  const school = "11111111-1111-4111-8111-111111111111",
    other = "11111111-1111-4111-8111-111111111112",
    uid = "11111111-1111-4111-8111-111111111113";
  const expected =
    "Se1!" +
    createHmac("sha256", pepper)
      .update("kara-kulja:school-editor-auth:v1\0zhiyde:12345678")
      .digest("hex");
  assert.equal(await deriveSchoolEditorAuthPassword("zhiyde", "12345678"), expected);
  assert.equal(expected.length, 68);
  assert.notEqual(expected, "12345678");
  for (const name of ["ab", "Upper", "-abc", "abc-", "a--b", "a_b", "a".repeat(41)])
    assert.equal(validSchoolUsername(name), false);
  let assignment = null,
    user = null,
    password = "",
    profile = { role: null },
    archived = false,
    review = false,
    admin = true,
    validSessions = new Set(),
    created = 0,
    removed = 0,
    revoked = 0,
    banned = false,
    failInsert = false;
  let attempts = 0,
    locked = false,
    authUnavailable = false,
    rotateDuringLogin = false,
    epoch = 0;
  const managed = (a, management = false) =>
    isManagedSchoolEditor({
      assignment: a,
      user,
      profile,
      assignments: assignment
        ? [{ school_id: assignment.school_id, username: assignment.username }]
        : [],
      hasNewsAssignment: false,
      school: { id: school, is_archived: archived },
      allowInactive: management,
      allowArchived: management,
    });
  const access = createSchoolAccessHandler({
    authorize: async () => admin,
    schoolExists: async (id) => id === school,
    find: async (id) => (id === school && assignment ? { ...assignment } : null),
    findUsername: async (name) => (assignment?.username === name ? assignment : null),
    isManaged: async (a) => managed(a, true),
    createUser: async (email, secret) => {
      created++;
      user = { id: uid, email, app_metadata: { school_editor_managed: true } };
      password = secret;
      return uid;
    },
    removeNewUser: async () => {
      removed++;
      user = null;
    },
    insert: async (a) => {
      if (failInsert) throw Error("DB");
      assignment = { ...a, updated_at: String(++epoch) };
    },
    setActive: async (id, active) => {
      assert.equal(id, school);
      assignment.is_active = active;
      assignment.updated_at = String(++epoch);
    },
    setBanned: async (id, value) => {
      assert.equal(id, uid);
      banned = value;
    },
    resetPin: async (id, value) => {
      assert.equal(id, uid);
      password = value;
    },
    revoke: async (id) => {
      assert.equal(id, school);
      validSessions.clear();
      revoked++;
      assignment.updated_at = String(++epoch);
    },
  });
  const req = (body) =>
    new Request("https://fixture.invalid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const manage = async (action, extra = {}) => access(req({ schoolId: school, action, ...extra }));
  assert.deepEqual(await (await manage("status")).json(), { account: null });
  admin = false;
  assert.equal((await manage("create", { username: "zhiyde" })).status, 403);
  assert.equal(created, 0);
  admin = true;
  assert.equal((await manage("create", { username: "zhiyde", userId: "arbitrary" })).status, 400);
  failInsert = true;
  assert.equal((await manage("create", { username: "zhiyde" })).status, 400);
  assert.equal(removed, 1);
  failInsert = false;
  const createdResult = await (await manage("create", { username: "zhiyde" })).json();
  assert.match(createdResult.pin, /^\d{8}$/);
  assert.deepEqual(Object.keys(createdResult).sort(), ["pin", "username"]);
  assert.equal(user.email, "school-zhiyde@editors.kara-kulja.invalid");
  assert.equal(user.app_metadata.school_editor_managed, true);
  assert.notEqual(password, createdResult.pin);
  assert.equal(password, await deriveSchoolEditorAuthPassword("zhiyde", createdResult.pin));
  assert.ok(!JSON.stringify(assignment).includes(createdResult.pin));
  assert.ok(!JSON.stringify(await (await manage("status")).json()).includes("email"));
  assert.equal((await manage("create", { username: "another" })).status, 400);
  let sessionCounter = 0;
  const login = createSchoolLoginHandler({
    find: async (name) => (assignment?.username === name ? { ...assignment } : null),
    isManaged: async (a) => managed(a),
    canAttempt: async () => !locked,
    finishAttempt: async (_name, success) => {
      if (locked) return false;
      if (success) {
        attempts = 0;
        return true;
      }
      attempts++;
      if (attempts >= 8) locked = true;
      return false;
    },
    login: async (email, secret) => {
      if (authUnavailable) throw Error("Unavailable");
      if (banned || secret !== password || email !== user.email) return null;
      const token = "fixture-session-" + ++sessionCounter;
      validSessions.add(token);
      if (rotateDuringLogin) assignment.updated_at = String(++epoch);
      return { userId: uid, access_token: token, refresh_token: "fixture-refresh" };
    },
    sessionAllowed: async (session, id) =>
      id === school && validSessions.has(session.access_token) && assignment.is_active && !archived,
    discard: async (token) => {
      validSessions.delete(token);
    },
  });
  const signIn = async (pin = createdResult.pin, username = "zhiyde") =>
    login(req({ username, pin }));
  let response = await signIn();
  assert.equal(response.status, 200);
  const originalSession = (await response.json()).access_token;
  const unknown = await (await signIn("12345678", "missing-user")).json();
  const bad = await (await signIn("00000000")).json();
  assert.deepEqual(bad, unknown);
  assert.equal(attempts, 1);
  for (const pin of ["1", "123456789", "abcdefgh", "1234.678"])
    assert.equal((await signIn(pin)).status, 401);
  assert.equal(attempts, 1);
  authUnavailable = true;
  await signIn();
  assert.equal(attempts, 1);
  authUnavailable = false;
  await signIn();
  assert.equal(attempts, 0);
  rotateDuringLogin = true;
  const sessionsBeforeRace = validSessions.size;
  assert.equal((await signIn()).status, 401);
  assert.equal(
    validSessions.size,
    sessionsBeforeRace,
    "in-flight login session discarded on credential generation change",
  );
  rotateDuringLogin = false;
  const reset = await (await manage("reset")).json();
  assert.match(reset.pin, /^\d{8}$/);
  assert.equal(validSessions.has(originalSession), false);
  assert.ok(revoked > 0);
  assert.equal((await signIn(createdResult.pin)).status, 401);
  assert.equal((await signIn(reset.pin)).status, 200);
  await manage("disable");
  assert.equal(assignment.is_active, false);
  assert.equal(banned, true);
  assert.equal(validSessions.size, 0);
  const previousAttempts = attempts;
  assert.equal((await signIn(reset.pin)).status, 401);
  assert.equal(attempts, previousAttempts);
  const disabledReset = await (await manage("reset")).json();
  assert.equal(assignment.is_active, false);
  assert.equal(banned, true);
  const createdBefore = created;
  await manage("enable");
  assert.equal(created, createdBefore);
  assert.equal(assignment.is_active, true);
  assert.equal((await signIn(disabledReset.pin)).status, 200);
  archived = true;
  assert.equal((await signIn(disabledReset.pin)).status, 401);
  archived = false;
  const baseline = {
    assignment,
    user,
    profile,
    assignments: [{ school_id: school, username: "zhiyde" }],
    hasNewsAssignment: false,
    school: { id: school, is_archived: false },
  };
  assert.equal(isManagedSchoolEditor(baseline), true);
  for (const role of ["owner", "admin", "editor"])
    assert.equal(isManagedSchoolEditor({ ...baseline, profile: { role } }), false);
  for (const override of [
    { hasNewsAssignment: true },
    { user: { ...user, email: "news-zhiyde@editors.kara-kulja.invalid" } },
    { user: { ...user, app_metadata: { news_editor_managed: true } } },
    { user: { ...user, app_metadata: {}, user_metadata: { school_editor_managed: true } } },
    { assignments: [...baseline.assignments, { school_id: other, username: null }] },
  ])
    assert.equal(isManagedSchoolEditor({ ...baseline, ...override }), false);
  assert.equal(
    isManagedNewsEditor({ assignment, user, profile, hasSchoolAssignment: true }),
    false,
  );
  const newsLogin = createNewsLoginHandler({
    find: async () => null,
    canAttempt: async () => true,
    finishAttempt: async () => true,
    login: async () => {
      throw Error("School identity must not reach News Auth");
    },
  });
  assert.equal((await newsLogin(req({ username: "zhiyde", pin: disabledReset.pin }))).status, 401);
  for (let i = 0; i < 8; i++) assert.equal((await signIn("00000000")).status, 401);
  assert.equal(locked, true);
  assert.equal((await signIn(disabledReset.pin)).status, 401);
  locked = false;
  attempts = 0;
  const assetId = "11111111-1111-4111-8111-111111111114";
  let uploads = 0;
  const media = createSchoolMediaHandler({
    authenticate: async () => ({ id: uid, admin: false }),
    authorize: async (id, write) =>
      id === school &&
      assignment.is_active &&
      !archived &&
      (!write || !review) &&
      validSessions.size > 0,
    register: async (id, kind) => {
      uploads++;
      const keys = assetKeys(id, kind, assetId);
      return { id: assetId, school_id: id, kind, main_key: keys[0], thumb_key: keys[1] };
    },
    putPrivate: async () => {},
    complete: async () => {},
    asset: async () => ({ id: assetId, school_id: school, kind: "cover", state: "ready" }),
    getPrivate: async () => fixtureWebp(100, 80),
  });
  await signIn(disabledReset.pin);
  const upload = async (kind, id = school) => {
    const body = new FormData();
    body.set("action", "upload");
    body.set("schoolId", id);
    body.set("kind", kind);
    for (const v of ["main", "thumb"])
      body.set(v, new File([fixtureWebp(100, 80)], "optimized.webp", { type: "image/webp" }));
    return media(new Request("https://fixture.invalid", { method: "POST", body }));
  };
  assert.equal((await upload("cover")).status, 200);
  assert.equal((await upload("gallery")).status, 200);
  assert.equal((await upload("cover", other)).status, 403);
  review = true;
  assert.equal((await upload("gallery")).status, 403);
  review = false;
  await manage("disable");
  assert.equal(
    (await media(req({ action: "preview", schoolId: school, assetId, variant: "main" }))).status,
    403,
  );
  assert.equal(uploads, 2);
  const fixturePepper = pepper;
  pepper = "";
  await assert.rejects(() => deriveSchoolEditorAuthPassword("zhiyde", "12345678"));
  pepper = fixturePepper;
  assert.match(
    fs.readFileSync("supabase/functions/manage-school-editor-access/index.ts", "utf8"),
    /school_editor_managed: true/,
  );
  console.log(
    "School Editor Edge tests passed: HMAC domain/pepper, create compensation, PIN privacy/reset, revoked sessions, disable/enable reuse, generic failed-only limiter, managed identity/News separation, scoped media and missing-pepper failure",
  );
} finally {
  globalThis.Deno = originalDeno;
}

// Actual frontend adapter, isolated SDK: no email/password API or navigated school ID.
let scopedSchool = "assigned-from-session",
  resolutionError = null,
  cleared = 0;
const frontendCalls = [];
globalThis.schoolAuthClientFixture = {
  functions: {
    invoke: async (name, options) => {
      frontendCalls.push({ name, options });
      return { data: { access_token: "test-access", refresh_token: "test-refresh" }, error: null };
    },
  },
  auth: {
    getUser: async () => ({ data: { user: { id: "assigned-user" } }, error: null }),
    setSession: async (tokens) => {
      assert.deepEqual(tokens, { access_token: "test-access", refresh_token: "test-refresh" });
      return { error: null };
    },
    signOut: async () => {
      cleared++;
      return { error: null };
    },
  },
  rpc: async (name) => {
    assert.equal(name, "current_school_editor_school");
    return { data: scopedSchool, error: resolutionError };
  },
};
try {
  const built = await build({
    entryPoints: ["src/lib/school-editor-access.ts"],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    plugins: [
      {
        name: "fake-auth",
        setup(p) {
          p.onResolve({ filter: /^@\/lib\/supabase$/ }, () => ({
            path: "auth",
            namespace: "isolated",
          }));
          p.onLoad({ filter: /.*/, namespace: "isolated" }, () => ({
            contents: "export const supabase=globalThis.schoolAuthClientFixture;",
            loader: "js",
          }));
        },
      },
    ],
  });
  const api = await import(
    `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
  );
  await api.loginSchoolEditor(" ZHIYDE ", "12345678");
  assert.deepEqual(frontendCalls[0], {
    name: "school-editor-login",
    options: { body: { username: "zhiyde", pin: "12345678" } },
  });
  assert.equal((await api.resolveSchoolEditor()).schoolId, "assigned-from-session");
  scopedSchool = null;
  await assert.rejects(() => api.loginSchoolEditor("zhiyde", "12345678"));
  assert.equal(cleared, 1);
  resolutionError = { message: "Unavailable" };
  await assert.rejects(() => api.loginSchoolEditor("zhiyde", "12345678"));
  assert.equal(cleared, 2);
  console.log(
    "School Editor frontend adapter passed: normalized PIN login, setSession, authoritative assignment RPC, cleanup on denied/failed resolution",
  );
} finally {
  delete globalThis.schoolAuthClientFixture;
}
