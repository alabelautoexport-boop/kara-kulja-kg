// Empty, disposable PostgreSQL-compatible replay. No linked project or network.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";

const modulePath =
  process.argv[2] ??
  path.join(
    tmpdir(),
    "kara-kulja-schools-db-tests/node_modules/@electric-sql/pglite/dist/index.js",
  );
const { PGlite } = await import(pathToFileURL(modulePath).href);
const ordered = [
  "20261024000000_news_admin_foundation.sql",
  "20261024010000_news_r2_gallery.sql",
  "20261112211346_schools.sql",
  "20261112235516_schools_admin_refinement.sql",
  "20261112235534_schools_active_editor.sql",
  "20261113003747_news_editor_access.sql",
  "20261113205931_school_media.sql",
  "20261113211506_school_editor_access.sql",
];
const files = fs
  .readdirSync("supabase/migrations")
  .filter((file) => file.endsWith(".sql"))
  .sort();
assert.deepEqual(files, ordered);
assert.equal(new Set(files.map((file) => file.slice(0, 14))).size, files.length);
const source = (file) => fs.readFileSync(`supabase/migrations/${file}`, "utf8");
const db = new PGlite();
try {
  // Supabase-owned Auth/Storage infrastructure fixtures only. Application SQL below
  // is replayed in order, including the foundation's actual Storage policies.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb default '{}'::jsonb);
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now());
    create table auth.refresh_tokens(user_id text,session_id uuid);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant usage on schema auth,public to anon,authenticated,service_role;
    grant execute on function auth.uid(),auth.jwt() to anon,authenticated,service_role;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text);
    alter table storage.objects enable row level security;
  `);
  for (const file of ordered) {
    // PGlite has gen_random_uuid built in but cannot install the external pgcrypto
    // extension. This runtime-only omission does not edit historical SQL files.
    await db.exec(source(file).replace("create extension if not exists pgcrypto;", ""));
  }
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from pg_policies where schemaname='storage' and policyname like 'news_media_%'",
      )
    ).rows[0].n,
    4,
  );
  const roleColumn = (
    await db.query(
      "select is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role'",
    )
  ).rows[0];
  assert.deepEqual(roleColumn, { is_nullable: "YES", column_default: null });
  const admin = "90000000-0000-4000-8000-000000000001",
    schoolUser = "90000000-0000-4000-8000-000000000002",
    newsUser = "90000000-0000-4000-8000-000000000003";
  await db.query(
    "insert into auth.users(id,email,raw_app_meta_data) values($1,'school-replay-school@editors.kara-kulja.invalid','{\"school_editor_managed\":true}'),($2,'news-replay-news@editors.kara-kulja.invalid','{\"news_editor_managed\":true}'),($3,'fixture-admin@example.invalid','{}')",
    [schoolUser, newsUser, admin],
  );
  assert.deepEqual((await db.query("select role from public.profiles order by id")).rows, [
    { role: null },
    { role: null },
    { role: null },
  ]);
  await db.query("update public.profiles set role='admin' where id=$1", [admin]);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [admin]);
  const school = (await db.query("select public.create_school_auto('Clean replay school') id"))
    .rows[0].id;
  await db.query(
    "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,'replay-school')",
    [school, schoolUser],
  );
  await db.query(
    "insert into public.news_editor_assignments(user_id,username) values($1,'replay-news')",
    [newsUser],
  );
  for (const [user, session] of [
    [schoolUser, "90000000-0000-4000-8000-000000000004"],
    [newsUser, "90000000-0000-4000-8000-000000000005"],
  ]) {
    await db.exec("reset role");
    await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [session, user]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ session_id: session }),
    ]);
    await db.exec("set role authenticated");
    if (user === schoolUser) {
      assert.equal(
        (await db.query("select public.current_school_editor_school() id")).rows[0].id,
        school,
      );
      assert.equal((await db.query("select public.can_manage_news() ok")).rows[0].ok, false);
      await db.query("select public.register_school_media($1,'cover')", [school]);
    } else {
      assert.equal((await db.query("select public.can_manage_news() ok")).rows[0].ok, true);
      assert.equal(
        (await db.query("select public.current_school_editor_school() id")).rows[0].id,
        null,
      );
    }
  }
  console.log(
    "Clean replay passed: all 8 ordered migrations, unique timestamps, Auth/Storage infrastructure fixtures, nullable/no-default roles, automatic NULL profiles, isolated managed News/School access and media registration",
  );
} finally {
  await db.close();
}

// Exercise the real normalization block against drifted and already-normalized
// tables independently of the broader Schools suite's historical fixtures.
const normalization =
  source(ordered.at(-1)).split("alter table public.school_editor_assignments")[0] + "commit;";
assert.doesNotMatch(normalization, /\bupdate\s+public\.profiles\b/i);
const roles = new PGlite();
try {
  await roles.exec(
    "create table public.profiles(id int primary key,role text not null default 'user' constraint profiles_role_check check(role in ('user','admin'))); insert into public.profiles values(1,'admin'),(2,'user');",
  );
  await assert.rejects(() => roles.exec(normalization), /profiles_role_check/);
  await roles.exec("rollback");
  assert.deepEqual((await roles.query("select * from public.profiles order by id")).rows, [
    { id: 1, role: "admin" },
    { id: 2, role: "user" },
  ]);
  // Explicitly remove only the disposable invalid fixture; migration never rewrites it.
  await roles.exec("delete from public.profiles where id=2");
  await roles.exec(normalization);
  await roles.exec(
    "insert into public.profiles(id) values(2); insert into public.profiles values(3,'owner'),(4,'editor');",
  );
  const before = (await roles.query("select * from public.profiles order by id")).rows;
  await roles.exec(normalization);
  assert.deepEqual((await roles.query("select * from public.profiles order by id")).rows, before);
  assert.deepEqual(before, [
    { id: 1, role: "admin" },
    { id: 2, role: null },
    { id: 3, role: "owner" },
    { id: 4, role: "editor" },
  ]);
  await assert.rejects(
    () => roles.exec("insert into public.profiles values(5,'user')"),
    /profiles_role_check/,
  );
  assert.deepEqual(
    (
      await roles.query(
        "select is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='role'",
      )
    ).rows,
    [{ is_nullable: "YES", column_default: null }],
  );
  console.log(
    "Role normalization passed: legacy/production-shaped schemas, repeatable constraint replacement, preserved existing role values, NULL/owner/admin/editor accepted, user rejected without automatic conversion",
  );
} finally {
  await roles.close();
}
