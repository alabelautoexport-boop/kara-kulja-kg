// Called by test-schools.mjs against its disposable PGlite only.
import fs from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";
export async function testEditorAccess({
  db,
  login,
  denied,
  admin,
  editor,
  school,
  payload,
  privateRows,
}) {
  await db.exec("reset role");
  const adminDefinition = (
    await db.query(
      "select pg_get_functiondef('public.is_admin()'::regprocedure) definition, proacl::text acl from pg_proc where oid='public.is_admin()'::regprocedure",
    )
  ).rows;
  const publicPolicy = (
    await db.query("select * from pg_policies where policyname='published_news_public_read'")
  ).rows;
  await db.exec(
    fs.readFileSync("supabase/migrations/20261112222229_schools_active_editor.sql", "utf8"),
  );
  const dormant = async () => {
    const rows = await privateRows(school);
    delete rows.school_editor_assignments;
    delete rows.school_ort_years;
    return rows;
  };
  const before = await dormant();
  const info = (await db.query("select * from public.schools where id=$1", [school])).rows[0];
  const revision = async () =>
    (await db.query("select revision from public.schools where id=$1", [school])).rows[0].revision;
  const active = {
    info: { ...info, director_name: "Updated contact" },
    ort: [{ year: 2026, academic_year: "2025-2026", scores: [142, 156, 203] }],
  };
  await login("authenticated", editor);
  await db.query("select public.save_school_active_draft($1,$2,$3,false)", [
    school,
    await revision(),
    active,
  ]);
  assert.deepEqual(await dormant(), before);
  await db.query("select public.save_school_active_draft($1,$2,$3,true)", [
    school,
    await revision(),
    active,
  ]);
  assert.equal(
    (await db.query("select status from public.schools where id=$1", [school])).rows[0].status,
    "review",
  );
  assert.deepEqual(await dormant(), before);
  await denied("select public.save_school_workspace_internal($1,$2,$3,false)", [
    school,
    await revision(),
    payload,
  ]);
  await login("authenticated", admin);
  // Old clients explicitly sending empty arrays cannot erase frozen collections either.
  await db.query("select public.save_school_draft($1,$2,$3,false)", [
    school,
    await revision(),
    { ...active, stats: [], achievements: [], resources: [] },
  ]);
  assert.deepEqual(await dormant(), before);
  await login("authenticated", editor);
  await denied("select public.save_school_active_draft($1,$2,$3,false)", [
    school,
    await revision(),
    { ...active, info: { ...active.info, name_ru: "Forged identity" } },
  ]);
  await login("anon");
  await denied("select public.save_school_active_draft($1,0,$2,false)", [school, active]);
  console.log(
    "Frozen school collections preserve exact rows/IDs across editor and Admin saves/submission; identity/private writer protected",
  );

  await db.exec("reset role");
  await db.exec(
    "create role service_role bypassrls; grant usage on schema public,auth to service_role",
  );
  // Isolated fixture only: mirror the confirmed production role contract.
  // Never alter production constraints or historical migration files.
  await db.exec(`alter table public.profiles alter column role drop not null;
    alter table public.profiles alter column role drop default;
    alter table public.profiles drop constraint profiles_role_check;
    update public.profiles set role=null where role='user';
    alter table public.profiles add constraint profiles_role_check check(role in ('owner','admin','editor'));
    create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id) on delete cascade,created_at timestamptz default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    grant execute on function auth.jwt() to authenticated,service_role;`);
  await db.exec(
    fs.readFileSync("supabase/migrations/20261112222231_news_editor_access.sql", "utf8"),
  );
  const newsEditor = "00000000-0000-4000-8000-000000000040";
  await db.query("insert into auth.users values($1)", [newsEditor]);
  assert.equal(
    (await db.query("select role from public.profiles where id=$1", [newsEditor])).rows[0].role,
    null,
  );
  const oldSession = "00000000-0000-4000-8000-000000000050";
  const newSession = "00000000-0000-4000-8000-000000000051";
  await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [oldSession, newsEditor]);
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ session_id: oldSession }),
  ]);
  await db.query(
    "insert into public.news_editor_assignments(user_id,username) values($1,'news-editor')",
    [newsEditor],
  );
  const draftId = (
    await db.query(
      "insert into public.news(slug,title_kg) values('access-draft','Private News') returning id",
    )
  ).rows[0].id;
  const publishedId = (
    await db.query(
      "insert into public.news(slug,title_kg,is_published,published_at) values('access-public','Public News',true,now()) returning id",
    )
  ).rows[0].id;
  await login("anon");
  assert.equal(
    (await db.query("select id from public.news where id=$1", [publishedId])).rows.length,
    1,
  );
  assert.equal(
    (await db.query("select id from public.news where id=$1", [draftId])).rows.length,
    0,
  );
  await denied("insert into public.news(slug,title_kg) values('anon-write','Forbidden')");
  await denied("select * from public.school_ort_years");
  await denied("select public.can_manage_news()");
  await login("authenticated", newsEditor);
  assert.equal((await db.query("select public.is_admin() value")).rows[0].value, false);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, true);
  assert.equal(
    (await db.query("select id from public.news where id=$1", [draftId])).rows.length,
    1,
  );
  const created = (
    await db.query(
      "insert into public.news(slug,title_kg) values('editor-created','Editor draft') returning id",
    )
  ).rows[0].id;
  assert.equal(
    (
      await db.query(
        "update public.news set title_ru='Edited',is_published=true,published_at=now() where id=$1 returning id",
        [created],
      )
    ).rows.length,
    1,
  );
  assert.equal(
    (await db.query("delete from public.news where id=$1 returning id", [created])).rows.length,
    1,
  );
  for (const table of [
    "schools",
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
    "school_editor_assignments",
    "news_editor_assignments",
  ])
    assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0, table);
  await denied(
    "insert into public.news_editor_assignments(user_id,username) values($1,'self-grant')",
    [newsEditor],
  );
  await denied("update public.news_editor_assignments set is_active=true where user_id=$1", [
    newsEditor,
  ]);
  await denied("insert into public.school_editor_assignments values($1,$2)", [school, newsEditor]);
  assert.equal(
    (
      await db.query("select count(*) n from public.school_editor_assignments where user_id=$1", [
        newsEditor,
      ])
    ).rows[0].n,
    0,
  );
  await denied("update public.profiles set role='admin' where id=$1", [newsEditor]);
  for (const [sql, args] of [
    ["select public.create_school_auto('Forbidden')", []],
    ["select public.save_school_active_draft($1,0,$2,false)", [school, active]],
    ["select public.review_school($1,0,'publish',null)", [school]],
    ["select public.set_school_archived($1,0,true)", [school]],
    ["select public.permanently_delete_school($1,0,'Forbidden')", [school]],
    ["select public.can_attempt_news_login('news-editor')", []],
    ["select public.finish_news_login_attempt('news-editor',true)", []],
  ])
    await denied(sql, args);
  await db.exec("reset role");
  await db.query("update public.news_editor_assignments set is_active=false where user_id=$1", [
    newsEditor,
  ]);
  await login("authenticated", newsEditor); // Same user identity, no new login required for revocation.
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, false);
  assert.equal(
    (await db.query("select id from public.news where id=$1", [draftId])).rows.length,
    0,
  );
  await denied("insert into public.news(slug,title_kg) values('disabled-write','Forbidden')");
  assert.equal(
    (
      await db.query("update public.news set title_kg='Forbidden' where id=$1 returning id", [
        publishedId,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("delete from public.news where id=$1 returning id", [publishedId])).rows.length,
    0,
  );
  await login("authenticated", editor);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, false);
  await denied("insert into public.news(slug,title_kg) values('school-write','Forbidden')");
  assert.equal(
    (await db.query("select id from public.news where id=$1", [draftId])).rows.length,
    0,
  );
  await login("authenticated", admin);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, true);
  assert.ok((await db.query("select id from public.schools")).rows.length);
  assert.equal(
    (await db.query("select id from public.news where id=$1", [draftId])).rows.length,
    1,
  );
  await db.exec("reset role");
  await db.query("update public.news_editor_assignments set is_active=true where user_id=$1", [
    newsEditor,
  ]);
  // Supabase Admin password update terminates Auth sessions; the old JWT remains
  // otherwise unchanged. Existence checking rejects it immediately after re-enable.
  await db.query("delete from auth.sessions where user_id=$1", [newsEditor]);
  await login("authenticated", newsEditor);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, false);
  await denied("insert into public.news(slug,title_kg) values('old-session-write','Forbidden')");
  await db.exec("reset role");
  await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [newSession, newsEditor]);
  // Old JWT cannot borrow another live session of the same user.
  await login("authenticated", newsEditor);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, false);
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ session_id: newSession }),
  ]);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, true);
  await db.query("select set_config('request.jwt.claims',$1,false)", [
    JSON.stringify({ session_id: "malformed-session-id" }),
  ]);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, false);
  await login("authenticated", admin);
  assert.equal((await db.query("select public.can_manage_news() value")).rows[0].value, true);
  // No session table access is exposed to browser roles.
  await denied("select * from auth.sessions");
  await login("service_role");
  const mayTry = async () =>
    (await db.query("select public.can_attempt_news_login('news-editor') value")).rows[0].value;
  const finish = async (success) =>
    (await db.query("select public.finish_news_login_attempt('news-editor',$1) value", [success]))
      .rows[0].value;
  for (let i = 0; i < 20; i++) {
    assert.equal(await mayTry(), true);
    assert.equal(await finish(true), true);
  }
  assert.equal(await finish(false), false);
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select attempts from editor_access_private.login_attempts where username='news-editor'",
      )
    ).rows[0].attempts,
    1,
  );
  await login("service_role");
  assert.equal(await finish(true), true);
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select attempts from editor_access_private.login_attempts where username='news-editor'",
      )
    ).rows[0].attempts,
    0,
  );
  await login("service_role");
  for (let i = 0; i < 8; i++) {
    assert.equal(await mayTry(), true);
    await finish(false);
  }
  assert.equal(await mayTry(), false);
  assert.equal(await finish(true), false); // Late success does not unlock a blocked bucket.
  assert.equal(
    (await db.query("select public.can_attempt_news_login('not-assigned') value")).rows[0].value,
    false,
  );
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select attempts from editor_access_private.login_attempts where username='news-editor'",
      )
    ).rows[0].attempts,
    8,
  );
  await db.exec(
    "update editor_access_private.login_attempts set started_at=now()-interval '16 minutes'",
  );
  await login("service_role");
  assert.equal(await mayTry(), true);
  assert.equal(await finish(true), true);
  await db.exec("reset role");
  assert.deepEqual(
    (
      await db.query(
        "select pg_get_functiondef('public.is_admin()'::regprocedure) definition, proacl::text acl from pg_proc where oid='public.is_admin()'::regprocedure",
      )
    ).rows,
    adminDefinition,
  );
  assert.deepEqual(
    (await db.query("select * from pg_policies where policyname='published_news_public_read'"))
      .rows,
    publicPolicy,
  );
  const code = ts.transpileModule(fs.readFileSync("src/lib/editor-access.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  }).outputText;
  const { mayEnterArea } = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
  );
  for (const [rights, expected] of [
    [{ admin: true, news: false, school: false }, [true, true, true]],
    [{ admin: false, news: true, school: false }, [false, true, false]],
    [{ admin: false, news: false, school: true }, [false, false, true]],
    [{ admin: false, news: false, school: false }, [false, false, false]],
  ])
    assert.deepEqual(
      ["admin", "news", "school"].map((area) => mayEnterArea(rights, area)),
      expected,
    );
  for (const file of ["src/routes/admin.tsx", "src/routes/admin_.schools.tsx"])
    assert.match(fs.readFileSync(file, "utf8"), /<AdminGuard>/);
  assert.match(
    fs.readFileSync("src/routes/school-admin.tsx", "utf8"),
    /EditorAreaGuard area="school"/,
  );
  for (const file of [
    "src/routes/news-admin.tsx",
    "src/routes/news-admin_.new.tsx",
    "src/routes/news-admin_.$id.edit.tsx",
  ])
    assert.match(fs.readFileSync(file, "utf8"), /EditorAreaGuard area="news"/);
  console.log(
    "Full access matrix, News CRUD/revocation, school isolation, route bindings, unchanged is_admin/public News policy and login throttle passed",
  );
}
