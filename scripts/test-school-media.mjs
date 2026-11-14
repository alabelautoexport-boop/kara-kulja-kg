import assert from "node:assert/strict";
import { build } from "esbuild";
import { fixtureWebp, fixtureJpeg } from "./school-media-fixtures.mjs";
import fs from "node:fs";
const load = async (file) => {
  const built = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
  });
  return await import(
    `data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString("base64")}`
  );
};
const { optimizeSchoolImage, SCHOOL_IMAGE_PROFILES } = await load(
  "src/lib/school-image-optimizer.ts",
);
const { webpDimensions } = await load("src/lib/school-image-format.ts");
for (const kind of ["cover", "gallery"]) {
  const calls = [];
  let closed = false;
  const original = new File([fixtureJpeg(4000, 3000)], "student-location-GPS.jpg", {
    type: "image/jpeg",
  });
  const result = await optimizeSchoolImage(original, kind, async () => ({
    width: 4000,
    height: 3000,
    close: () => {
      closed = true;
    },
    encode: async (w, h, q) => {
      calls.push([w, h, q]);
      return new Blob([fixtureWebp(w, h, w > 1000 ? 200000 : w > 500 ? 90000 : 20000)], {
        type: "image/webp",
      });
    },
  }));
  assert.notEqual(result.main, original);
  assert.notEqual(result.thumb, original);
  assert.equal(result.main.type, "image/webp");
  assert.equal(result.thumb.type, "image/webp");
  assert.ok(closed);
  assert.ok(!result.main.name.includes("student"));
  assert.match(result.main.name, /^[a-f0-9-]{36}-main\.webp$/);
  assert.equal(Math.max(result.width, result.height), 1600);
  assert.equal(
    Math.max(result.thumbWidth, result.thumbHeight),
    SCHOOL_IMAGE_PROFILES[kind].thumb.side,
  );
  assert.ok(result.main.size <= SCHOOL_IMAGE_PROFILES[kind].main.max);
  assert.ok(result.thumb.size <= SCHOOL_IMAGE_PROFILES[kind].thumb.max);
  assert.equal(calls[0][2], 0.86);
  assert.ok(!Buffer.from(await result.main.arrayBuffer()).includes(Buffer.from("Exif")));
}
let decoded = 0;
await assert.rejects(() =>
  optimizeSchoolImage(
    new File([fixtureJpeg(9000, 3000)], "huge.jpg", { type: "image/jpeg" }),
    "cover",
    async () => {
      decoded++;
    },
  ),
);
assert.equal(decoded, 0);
await assert.rejects(() =>
  optimizeSchoolImage(
    new File([new Uint8Array(20 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }),
    "cover",
  ),
);
await assert.rejects(() =>
  optimizeSchoolImage(new File(["<svg/>"], "a.svg", { type: "image/svg+xml" }), "cover"),
);
const tiny = new File([fixtureWebp(100, 80)], "original.webp", { type: "image/webp" });
let encodes = 0;
const small = await optimizeSchoolImage(tiny, "gallery", async () => ({
  width: 100,
  height: 80,
  close() {},
  encode: async (w, h) => {
    encodes++;
    assert.ok(w <= 100 && h <= 80);
    return new Blob([fixtureWebp(w, h)], { type: "image/webp" });
  },
}));
assert.equal(encodes, 2);
assert.notEqual(small.main, tiny);
await assert.rejects(() =>
  optimizeSchoolImage(tiny, "cover", async () => ({
    width: 100,
    height: 80,
    close() {},
    encode: async () => new Blob(["bad"], { type: "image/png" }),
  })),
);
const exif = fixtureWebp(100, 80);
exif.set(new TextEncoder().encode("EXIF"), 12);
assert.throws(() => webpDimensions(exif));
console.log(
  "School optimizer tests passed: profiles, resize, no upscale, fresh WebP variants, UUID names, metadata-free output, preflight limits, unsupported sources and encoder failure",
);

const { createSchoolMediaHandler, assetKeys } = await load(
  "supabase/functions/school-media/handler.ts",
);
const schoolId = "11111111-1111-4111-8111-111111111111",
  assetId = "22222222-2222-4222-8222-222222222222";
const [main_key, thumb_key] = assetKeys(schoolId, "cover", assetId);
let admin = true,
  authorized = true,
  auth = true,
  approveFail = false,
  promoteFail = 0;
let events = [];
let publicWrites = 0,
  publishedVersion = "old",
  cleanupCandidates = [],
  reviewedMedia;
const row = {
  id: assetId,
  school_id: schoolId,
  kind: "cover",
  state: "ready",
  main_key,
  thumb_key,
  main_sha256: "a".repeat(64),
  thumb_sha256: "b".repeat(64),
};
const deps = {
  authenticate: async () => {
    if (!auth) throw Error("No");
    return { id: "actor", admin };
  },
  authorize: async () => authorized,
  register: async () => {
    events.push("register");
    return row;
  },
  complete: async () => {
    events.push("complete");
  },
  asset: async (s, id) => (id === assetId ? row : null),
  putPrivate: async () => {
    events.push("private");
  },
  getPrivate: async () => fixtureWebp(100, 80),
  prepare: async () => {
    events.push("prepare");
    return reviewedMedia ?? [row];
  },
  approve: async (_id, _revision, _note, actor, media) => {
    events.push("approve");
    assert.equal(actor, "actor");
    assert.deepEqual(media, reviewedMedia ?? [row]);
    if (approveFail) throw Error("revision");
    publishedVersion = "new";
  },
  promote: async (key) => {
    assert.equal(publishedVersion, "old", "old snapshot remains active throughout promotion");
    events.push("public");
    publicWrites++;
    if (promoteFail === publicWrites) throw Error("network: schools/private-key");
    assert.ok(key.startsWith(`schools/${schoolId}/`));
  },
  recordFailure: async (_id, ids) => {
    events.push("record-failure");
    cleanupCandidates = ids;
  },
  cleanup: async () => {
    events.push("cleanup");
  },
};
const handler = createSchoolMediaHandler(deps);
const request = (data) =>
  new Request("https://fixture.invalid", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ schoolId, ...data }),
  });
const upload = () => {
  const body = new FormData();
  body.set("action", "upload");
  body.set("schoolId", schoolId);
  body.set("kind", "cover");
  body.set(
    "main",
    new File([fixtureWebp(1600, 1200)], "private-phone-name.webp", { type: "image/webp" }),
  );
  body.set(
    "thumb",
    new File([fixtureWebp(960, 720)], "private-phone-name.webp", { type: "image/webp" }),
  );
  return new Request("https://fixture.invalid", { method: "POST", body });
};
auth = false;
assert.equal((await handler(upload())).status, 401);
assert.deepEqual(events, []);
auth = true;
authorized = false;
assert.equal((await handler(upload())).status, 403);
assert.deepEqual(events, []);
authorized = true;
const result = await (await handler(upload())).json();
assert.equal(result.asset.asset_id, assetId);
assert.deepEqual(events, ["register", "private", "private", "complete"]);
assert.ok(!JSON.stringify(result).includes("private-phone-name"));
events = [];
const bad = upload();
const form = await bad.formData();
form.set("key", "../../news/file.webp");
assert.equal((await handler(new Request(bad.url, { method: "POST", body: form }))).status, 400);
assert.deepEqual(events, []);
assert.equal(
  (await handler(request({ action: "preview", assetId: "../foreign", variant: "main" }))).status,
  400,
);
assert.equal(
  (await handler(request({ action: "preview", assetId, variant: "main" }))).headers.get(
    "Cache-Control",
  ),
  "no-store",
);
events = [];
assert.deepEqual(await (await handler(request({ action: "publish", revision: 1 }))).json(), {
  published: true,
});
assert.deepEqual(events, ["prepare", "public", "public", "approve"]);
assert.equal(publishedVersion, "new");
events = [];
publishedVersion = "old";
approveFail = true;
assert.equal((await handler(request({ action: "publish", revision: 1 }))).status, 409);
assert.deepEqual(events, ["prepare", "public", "public", "approve", "record-failure"]);
assert.equal(publishedVersion, "old");
assert.deepEqual(cleanupCandidates, [assetId]);
approveFail = false;
// First copy and middle-gallery failures must never call the DB publication RPC.
const galleryRows = [3, 4].map((n) => {
  const id = `${n}`.repeat(8) + "-3333-4333-8333-333333333333";
  const keys = assetKeys(schoolId, "gallery", id);
  return { ...row, id, kind: "gallery", main_key: keys[0], thumb_key: keys[1] };
});
reviewedMedia = [row, ...galleryRows];
for (const failAt of [1, 4]) {
  events = [];
  publicWrites = 0;
  promoteFail = failAt;
  const response = await handler(request({ action: "publish", revision: 1 }));
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "school_media_publication_failed");
  assert.ok(!JSON.stringify(body).includes("private-key"));
  assert.ok(!events.includes("approve"));
  assert.equal(publishedVersion, "old");
  assert.deepEqual(
    cleanupCandidates,
    reviewedMedia.map((r) => r.id),
  );
}
events = [];
publicWrites = 0;
promoteFail = 0;
assert.equal((await handler(request({ action: "publish", revision: 1 }))).status, 200);
assert.equal(events.at(-1), "approve");
assert.equal(publicWrites, 6);
publishedVersion = "old";
reviewedMedia = [];
events = [];
assert.equal((await handler(request({ action: "publish", revision: 1 }))).status, 200);
assert.deepEqual(events, ["prepare", "approve"]);
events = [];
admin = false;
assert.equal((await handler(request({ action: "publish", revision: 1 }))).status, 403);
assert.equal((await handler(request({ action: "cleanup" }))).status, 403);
assert.deepEqual(events, []);
assert.throws(() => assetKeys(schoolId, "cover", "../../x"));
admin = true;
assert.equal((await handler(request({ action: "cleanup" }))).status, 200);

// Actual encoded 1x1 static VP8; hostile metadata is appended without breaking RIFF framing.
const realStatic = new Uint8Array(
  Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA", "base64"),
);
const chunk = (name, payload) => {
  const result = new Uint8Array(8 + payload.length + (payload.length % 2));
  result.set(new TextEncoder().encode(name));
  new DataView(result.buffer).setUint32(4, payload.length, true);
  result.set(payload, 8);
  return result;
};
const riff = (...chunks) => {
  const result = new Uint8Array(12 + chunks.reduce((sum, c) => sum + c.length, 0));
  result.set(new TextEncoder().encode("RIFF"));
  new DataView(result.buffer).setUint32(4, result.length - 8, true);
  result.set(new TextEncoder().encode("WEBP"), 8);
  let offset = 12;
  for (const c of chunks) {
    result.set(c, offset);
    offset += c.length;
  }
  return result;
};
const vp8 = realStatic.slice(12);
const extended = (flags) => chunk("VP8X", new Uint8Array([flags, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
const lossless = (alpha) => chunk("VP8L", new Uint8Array([0x2f, 0, 0, 0, alpha ? 0x10 : 0, 0]));
const bytesRequest = (bytes) => {
  const body = new FormData();
  body.set("action", "upload");
  body.set("schoolId", schoolId);
  body.set("kind", "cover");
  for (const variant of ["main", "thumb"])
    body.set(variant, new File([bytes], "client.webp", { type: "image/webp" }));
  return new Request("https://fixture.invalid", { method: "POST", body });
};
const cleanExamples = [
  realStatic,
  riff(lossless(false)),
  riff(lossless(true)),
  riff(extended(0), vp8),
  riff(extended(0x10), chunk("ALPH", new Uint8Array([0, 0])), vp8),
  riff(extended(0x10), lossless(true)),
];
for (const clean of cleanExamples) {
  events = [];
  assert.equal(
    (await handler(bytesRequest(clean))).status,
    200,
    "clean static VP8/VP8L/VP8X including alpha accepted",
  );
  assert.deepEqual(events, ["register", "private", "private", "complete"]);
}
const attacks = new Map([
  ["EXIF chunk", riff(vp8, chunk("EXIF", new TextEncoder().encode("Exif GPS data")))],
  ["XMP chunk", riff(vp8, chunk("XMP ", new TextEncoder().encode("<xmp>GPS</xmp>")))],
  ["EXIF flag", riff(extended(8), vp8)],
  ["XMP flag", riff(extended(4), vp8)],
  ["animation flag", riff(extended(2), vp8)],
  ["ANIM", riff(extended(2), chunk("ANIM", new Uint8Array(6)), chunk("ANMF", new Uint8Array(16)))],
  ["ANMF without flag", riff(vp8, chunk("ANMF", new Uint8Array(16)))],
  ["fake MIME", new TextEncoder().encode("not an image")],
  ["duplicate image", riff(vp8, vp8)],
  ["alpha without VP8X", riff(chunk("ALPH", new Uint8Array([0, 0])), vp8)],
  ["VP8X invalid length", riff(chunk("VP8X", new Uint8Array(12)), vp8)],
]);
const badChunk = realStatic.slice();
new DataView(badChunk.buffer).setUint32(16, 0xffffffff, true);
attacks.set("chunk length", badChunk);
const badRiff = realStatic.slice();
new DataView(badRiff.buffer).setUint32(4, realStatic.length, true);
attacks.set("RIFF length", badRiff);
const oddChunk = chunk("VP8L", new Uint8Array([0x2f, 0, 0, 0, 0, 0, 0]));
oddChunk[oddChunk.length - 1] = 7;
attacks.set("nonzero padding", riff(oddChunk));
attacks.set("truncated chunk header", riff(vp8, new Uint8Array(4)));
for (const [name, bytes] of attacks) {
  events = [];
  assert.equal((await handler(bytesRequest(bytes))).status, 400, name);
  assert.deepEqual(events, [], name + " rejected before registration/R2 writes");
}
for (const origin of [
  "https://kara-kulja.kg",
  "https://www.kara-kulja.kg",
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://evil.invalid",
  "null",
  "",
]) {
  const expected = origin && !["https://evil.invalid", "null"].includes(origin) ? origin : null;
  for (const method of ["OPTIONS", "GET", "POST"]) {
    const req =
      method === "POST"
        ? request({ action: "preview", assetId, variant: "main" })
        : new Request("https://fixture.invalid", { method });
    if (origin) req.headers.set("Origin", origin);
    const response = await handler(req);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), expected);
    assert.equal(response.headers.get("Vary"), "Origin");
    if (method === "POST") {
      assert.equal(response.headers.get("Content-Type"), "image/webp");
      assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
      assert.equal(response.headers.get("Cache-Control"), "no-store");
      assert.deepEqual(new Uint8Array(await response.arrayBuffer()), fixtureWebp(100, 80));
    }
  }
}
auth = false;
const unauthenticated = request({ action: "preview", assetId, variant: "main" });
unauthenticated.headers.set("Origin", "https://kara-kulja.kg");
assert.equal(
  (await handler(unauthenticated)).status,
  401,
  "allowed CORS origin does not authorize a caller",
);
auth = true;
const serverBuild = await build({
  entryPoints: ["supabase/functions/school-media/handler.ts"],
  bundle: true,
  write: false,
  platform: "neutral",
  metafile: true,
});
assert.ok(
  Object.keys(serverBuild.metafile.inputs).every((file) =>
    file.replaceAll("\\", "/").startsWith("supabase/functions/"),
  ),
);
assert.ok(
  !fs.readFileSync("supabase/functions/school-media/index.ts", "utf8").includes("../../../src"),
);
assert.match(
  fs.readFileSync("supabase/config.toml", "utf8"),
  /\[functions\.school-media\]\s*verify_jwt\s*=\s*true/,
);
console.log(
  "School Media hardening passed: actual-byte EXIF/XMP/animation/RIFF/chunk/padding attacks rejected; static/alpha accepted; restricted CORS, image/webp preview, JWT and self-contained Edge imports verified",
);

// Regression for the installed SDK treating image/webp as text: preview must use
// authenticated binary fetch and preserve every byte, not reconstruct damaged text.
const clientBuild = await build({
  entryPoints: ["src/lib/school-media.ts"],
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  define: {
    "import.meta.env.VITE_SUPABASE_URL": JSON.stringify("https://supabase.fixture.invalid"),
    "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify("fixture-public-key"),
  },
  plugins: [
    {
      name: "isolate-preview",
      setup(plugin) {
        plugin.onResolve({ filter: /^@\/lib\/supabase$/ }, () => ({
          path: "supabase",
          namespace: "preview-fixture",
        }));
        plugin.onLoad({ filter: /.*/, namespace: "preview-fixture" }, () => ({
          contents:
            "export const supabase={auth:{getSession:async()=>({data:{session:{access_token:'fixture-user-jwt'}},error:null})},functions:{invoke:()=>{throw Error('Preview must not use text-decoding SDK')}}};",
          loader: "js",
        }));
      },
    },
  ],
});
const previewClient = await import(
  `data:text/javascript;base64,${Buffer.from(clientBuild.outputFiles[0].text).toString("base64")}`
);
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://supabase.fixture.invalid/functions/v1/school-media");
    assert.equal(options.headers.Authorization, "Bearer fixture-user-jwt");
    assert.equal(options.headers.apikey, "fixture-public-key");
    assert.deepEqual(JSON.parse(options.body), {
      action: "preview",
      schoolId,
      assetId,
      variant: "main",
    });
    assert.equal(options.cache, "no-store");
    return new Response(realStatic, { headers: { "Content-Type": "image/webp" } });
  };
  const blob = await previewClient.previewSchoolImage(schoolId, assetId, "main");
  assert.equal(blob.type, "image/webp");
  assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), realStatic);
  globalThis.fetch = async () =>
    new Response("not WebP", { headers: { "Content-Type": "image/webp" } });
  await assert.rejects(() => previewClient.previewSchoolImage(schoolId, assetId, "main"));
  globalThis.fetch = async () => new Response("denied", { status: 403 });
  await assert.rejects(() => previewClient.previewSchoolImage(schoolId, assetId, "main"));
} finally {
  globalThis.fetch = originalFetch;
}
console.log(
  "Authenticated browser preview regression passed: image/webp binary preserved, invalid/unauthorized response rejected",
);
console.log(
  "School media handler tests passed: auth, immutable keys, private preview, all promotions before DB publish, first/middle copy failures, DB failure preserving old snapshot, orphan candidates and media-free publication",
);
