// Run the EXACT generated import SQL twice against disposable PostgreSQL, never remote.
import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]));
const sql = fs.readFileSync(process.argv[3], "utf8");
const manifest = JSON.parse(fs.readFileSync(process.argv[4], "utf8"));
const db = new PGlite();
try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}');
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),created_at timestamptz default now());
    create table auth.refresh_tokens(user_id text,session_id uuid);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
    grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);alter table storage.objects enable row level security;`);
  for (const file of fs
    .readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.exec(
      fs
        .readFileSync(`supabase/migrations/${file}`, "utf8")
        .replace("create extension if not exists pgcrypto;", ""),
    );
  const zhiyde = "5f36794c-a680-4b93-9bb0-873538f54dbb",
    baki = "13e261af-16f4-4455-9873-fcc06e44b14d",
    editor = "90000000-0000-4000-8000-000000000002";
  await db.query("insert into auth.users(id,email) values($1,'fixture@example.invalid')", [editor]);
  await db.query(
    `insert into public.schools(id,slug,name_kg,territory_slug,village_slug,school_type,status,revision,current_academic_year,director_name) values
    ($1,'zhiyde','Жийде','kara-kochkor','zhiyde','general','published',3,'2026-2027','PRESERVE_DIRECTOR'),
    ($2,'b-eshmanbetov-atyndagy-orto-mektebi','Баки Эшмамбетов атындагы жалпы билим берүү мектеби','kara-kulja','kara-kulja','general','published',8,'2025-2026',null)`,
    [zhiyde, baki],
  );
  await db.query("insert into public.school_editor_assignments(school_id,user_id) values($1,$2)", [
    zhiyde,
    editor,
  ]);
  await db.query("insert into public.school_year_stats values($1,'2026-2027',450,30,20)", [zhiyde]);
  await db.query("insert into public.school_ort_years values($1,2026,'2025-2026','[128,203]')", [
    zhiyde,
  ]);
  await db.query(
    "insert into public.school_media(school_id,kind,state,in_draft,width,height,thumb_width,thumb_height,bytes,thumb_bytes,main_sha256,thumb_sha256) values($1,'cover','ready',true,1600,1200,960,720,100000,30000,repeat('a',64),repeat('b',64))",
    [zhiyde],
  );
  const oldDocument = {
    info: {
      name_kg: "old",
      slug: "zhiyde",
      territory_slug: "kara-kochkor",
      village_slug: "zhiyde",
      director_name: "OLD_PUBLIC_CONTACT",
      current_academic_year: "2024-2025",
    },
    stats: [{ academic_year: "2026-2027", total_students: 450 }],
    ort: [{ year: 2026, summary: { participants: 2 } }],
    media: { cover: { asset_id: "PRESERVE_MEDIA" }, gallery: [] },
    achievements: [],
    resources: [],
  };
  await db.query(
    "insert into public.school_publications(school_id,slug,document,published_at) values($1,'zhiyde',$2,'2026-01-01')",
    [zhiyde, oldDocument],
  );
  await db.query(
    "insert into public.school_publications(school_id,slug,document,published_at) values($1,'b-eshmanbetov-atyndagy-orto-mektebi',$2,'2026-01-02')",
    [
      baki,
      {
        ...oldDocument,
        info: {
          ...oldDocument.info,
          slug: "b-eshmanbetov-atyndagy-orto-mektebi",
          territory_slug: "kara-kulja",
          village_slug: "kara-kulja",
        },
      },
    ],
  );
  await db.exec(sql);
  assert.equal((await db.query("select count(*)::int n from public.schools")).rows[0].n, 53);
  assert.equal((await db.query("select count(*)::int n from public.kindergartens")).rows[0].n, 56);
  for (const table of [
    "school_year_stats",
    "school_ort_years",
    "school_media",
    "school_editor_assignments",
  ])
    assert.equal((await db.query(`select count(*)::int n from public.${table}`)).rows[0].n, 1);
  for (const [key, table, id] of [
    ["schools", "school_publications", "school_id"],
    ["kindergartens", "kindergarten_publications", "kindergarten_id"],
  ]) {
    const base = key === "schools" ? "schools" : "kindergartens";
    const records = (
      await db.query(
        `select s.*,p.document from public.${base} s join public.${table} p on p.${id}=s.id where p.is_published`,
      )
    ).rows;
    assert.equal(records.length, manifest[key].length);
    for (const item of manifest[key]) {
      const r = records.find((r) => r.source_metadata.excel_number === item.number);
      assert.ok(r);
      for (const [field, value] of Object.entries(item.info)) {
        assert.deepEqual(r[field], value, `${key}/${item.number}/${field}`);
        if (field !== "source_metadata") assert.deepEqual(r.document.info[field], value);
      }
      assert.ok(!JSON.stringify(r.document).includes("source_metadata"));
      if (item.existing_id) assert.equal(r.id, item.existing_id);
      if (item.existing_slug) assert.equal(r.slug, item.existing_slug);
    }
  }
  const doc = (
    await db.query("select document from public.school_publications where school_id=$1", [zhiyde])
  ).rows[0].document;
  for (const section of ["stats", "ort", "media", "achievements", "resources"])
    assert.deepEqual(doc[section], oldDocument[section]);
  assert.equal(doc.info.director_name, "OLD_PUBLIC_CONTACT");
  assert.equal(doc.info.current_academic_year, "2024-2025");
  const allBefore = (
    await db.query("select jsonb_agg(to_jsonb(s) order by id) data from public.schools s")
  ).rows[0].data;
  await db.exec(sql);
  assert.deepEqual(
    (await db.query("select jsonb_agg(to_jsonb(s) order by id) data from public.schools s")).rows[0]
      .data,
    allBefore,
  );
  await db.exec("set role anon");
  assert.equal(
    (await db.query("select count(*)::int n from public.school_publications where is_published"))
      .rows[0].n,
    53,
  );
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from public.kindergarten_publications where is_published",
      )
    ).rows[0].n,
    56,
  );
  await assert.rejects(() => db.query("select * from public.kindergartens"), /permission denied/);
  console.log(
    "Exact Excel import passed: 53 schools/56 kindergartens, all 109 published, every localized full/short/address/type/source field verified, two IDs/slugs preserved, annual/ORT/media/editor/contact snapshots unchanged, repeated execution is a no-op",
  );
} catch (error) {
  console.error("Import validation failed:", error.message, error.where ?? "");
  process.exitCode = 1;
} finally {
  await db.close();
}
