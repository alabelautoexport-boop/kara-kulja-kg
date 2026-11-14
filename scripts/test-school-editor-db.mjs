import assert from "node:assert/strict";
import fs from "node:fs";
export async function testSchoolEditorAccess({ db, login, denied, admin, editor }) {
  await db.exec(
    "reset role; alter table auth.users add column email text,add column raw_app_meta_data jsonb default '{}'::jsonb; create table auth.refresh_tokens(user_id text,session_id uuid);",
  );
  const migration = fs
    .readdirSync("supabase/migrations")
    .find((f) => f.endsWith("_school_editor_access.sql"));
  assert.ok(migration);
  await db.exec(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"));
  await login("authenticated", admin);
  const create = async (name) =>
    (await db.query("select public.create_school_auto($1) id", [name])).rows[0].id;
  const school = await create("Managed school"),
    other = await create("Managed other"),
    legacy = await create("Legacy school");
  const uid = "88888888-8888-4888-8888-888888888881",
    uid2 = "88888888-8888-4888-8888-888888888882",
    session = "88888888-8888-4888-8888-888888888883";
  await db.exec("reset role");
  for (const [id, name] of [
    [uid, "managed-school"],
    [uid2, "second-school"],
  ])
    await db.query(
      "insert into auth.users(id,email,raw_app_meta_data) values($1,$2,'{\"school_editor_managed\":true}')",
      [id, `school-${name}@editors.kara-kulja.invalid`],
    );
  const assign = async (schoolId, userId, name) =>
    db.query(
      "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,$3)",
      [schoolId, userId, name],
    );
  await assign(school, uid, "managed-school");
  for (const role of ["owner", "admin", "editor"]) {
    await db.query("update public.profiles set role=$1 where id=$2", [role, uid2]);
    await denied(
      "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,$3)",
      [other, uid2, "second-school"],
    );
  }
  await db.query("update public.profiles set role=null where id=$1", [uid2]);
  for (const name of [
    "AA",
    "ab",
    "-start",
    "end-",
    "double--hyphen",
    "upper-Case",
    " space",
    "a".repeat(41),
  ])
    await denied(
      "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,$3)",
      [other, uid2, name],
    );
  await denied(
    "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,$3)",
    [other, uid, "managed-school"],
  );
  await denied(
    "insert into public.school_editor_assignments(school_id,user_id,username) values($1,$2,$3)",
    [school, uid2, "second-school"],
  );
  await denied("insert into public.school_editor_assignments(school_id,user_id) values($1,$2)", [
    other,
    uid,
  ]);
  await denied(
    "insert into public.news_editor_assignments(user_id,username) values($1,'news-mix')",
    [uid],
  );
  await db.query("insert into public.school_editor_assignments(school_id,user_id) values($1,$2)", [
    legacy,
    editor,
  ]);
  await login("authenticated", editor);
  assert.equal((await db.query("select public.can_edit_school($1) ok", [legacy])).rows[0].ok, true);
  await db.exec("reset role");
  await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [session, uid]);
  await db.query("insert into auth.refresh_tokens values($1,$2)", [uid, session]);
  const userLogin = async () => {
    await login("authenticated", uid);
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ session_id: session }),
    ]);
  };
  await userLogin();
  assert.equal(
    (await db.query("select public.current_school_editor_school() id")).rows[0].id,
    school,
  );
  assert.equal((await db.query("select public.can_edit_school($1) ok", [other])).rows[0].ok, false);
  assert.equal((await db.query("select * from public.school_editor_assignments")).rows.length, 1);
  assert.equal((await db.query("select public.can_manage_news() ok")).rows[0].ok, false);
  await denied("update public.profiles set role='admin' where id=$1", [uid]);
  await denied("select public.revoke_school_editor_sessions($1)", [school]);
  const info = (await db.query("select * from public.schools where id=$1", [school])).rows[0];
  await db.query("select public.save_school_active_draft($1,0,$2,false)", [
    school,
    { info, ort: [{ year: 2026, academic_year: "2025-2026", scores: [120, 210] }] },
  ]);
  const cover = (await db.query("select * from public.register_school_media($1,'cover')", [school]))
    .rows[0];
  const gallery = (
    await db.query("select * from public.register_school_media($1,'gallery')", [school])
  ).rows[0];
  await denied("select public.register_school_media($1,'cover')", [other]);
  const meta = { width: 800, height: 600, bytes: 20000, sha256: "a".repeat(64) },
    thumb = { ...meta, width: 400, height: 300, bytes: 10000 };
  await login("service_role");
  for (const m of [cover, gallery])
    await db.query("select public.complete_school_media($1,$2,$3,$4,$5)", [
      m.id,
      uid,
      meta,
      thumb,
      session,
    ]);
  await userLogin();
  await db.query("select public.save_school_active_draft($1,1,$2,true)", [
    school,
    { info, ort: [], media: { cover: cover.id, gallery: [gallery.id] } },
  ]);
  assert.equal((await db.query("select public.can_edit_school($1) ok", [school])).rows[0].ok, true);
  assert.equal(
    (await db.query("select public.can_manage_school_media($1) ok", [school])).rows[0].ok,
    false,
  );
  await denied("select public.save_school_active_draft($1,2,$2,false)", [
    school,
    { info, ort: [] },
  ]);
  await denied("select public.register_school_media($1,'gallery')", [school]);
  await login("authenticated", admin);
  const media = (
    await db.query("select public.prepare_school_media_publication($1,2) media", [school])
  ).rows[0].media;
  await login("service_role");
  await db.query("select public.finish_school_media_publication($1,2,$2,$3,null)", [
    school,
    admin,
    media,
  ]);
  await userLogin();
  assert.equal((await db.query("select * from public.school_media where in_draft")).rows.length, 2);
  await login("service_role");
  await db.query("update public.school_editor_assignments set is_active=false where school_id=$1", [
    school,
  ]);
  await userLogin();
  assert.equal(
    (await db.query("select public.can_edit_school($1) ok", [school])).rows[0].ok,
    false,
  );
  assert.equal(
    (await db.query("select public.can_manage_school_media($1) ok", [school])).rows[0].ok,
    false,
  );
  assert.equal((await db.query("select * from public.school_media")).rows.length, 0);
  assert.equal((await db.query("select * from public.school_editor_assignments")).rows.length, 0);
  await denied("select public.save_school_active_draft($1,3,$2,false)", [
    school,
    { info, ort: [] },
  ]);
  await login("anon");
  await denied("select public.revoke_school_editor_sessions($1)", [school]);
  await login("service_role");
  await db.query("select public.revoke_school_editor_sessions($1)", [school]);
  await db.query("update public.school_editor_assignments set is_active=true where school_id=$1", [
    school,
  ]);
  await userLogin();
  assert.equal(
    (await db.query("select public.can_edit_school($1) ok", [school])).rows[0].ok,
    false,
    "reactivation cannot resurrect revoked JWT",
  );
  await db.exec("reset role");
  assert.equal(
    (await db.query("select * from auth.refresh_tokens where user_id=$1", [uid])).rows.length,
    0,
  );
  await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [session, uid]);
  for (const role of ["owner", "admin", "editor"]) {
    await db.query("update public.profiles set role=$1 where id=$2", [role, uid]);
    await userLogin();
    // The Admin role deliberately retains existing global Admin behavior; managed identity still rejects it.
    await login("service_role");
    assert.equal(
      (await db.query("select public.managed_school_identity($1) ok", [school])).rows[0].ok,
      false,
    );
    await db.exec("reset role");
  }
  await db.query("update public.profiles set role=null where id=$1", [uid]);
  await login("authenticated", admin);
  const accessBeforeArchive = (
    await db.query("select * from public.school_editor_assignments where school_id=$1", [school])
  ).rows;
  await db.query("select public.set_school_archived($1,3,true)", [school]);
  await userLogin();
  assert.equal(
    (await db.query("select public.can_edit_school($1) ok", [school])).rows[0].ok,
    false,
  );
  await denied("select public.register_school_media($1,'cover')", [school]);
  await login("authenticated", admin);
  assert.equal((await db.query("select public.can_edit_school($1) ok", [school])).rows[0].ok, true);
  await db.query("select public.set_school_archived($1,4,false)", [school]);
  assert.deepEqual(
    (await db.query("select * from public.school_editor_assignments where school_id=$1", [school]))
      .rows,
    accessBeforeArchive,
  );
  await userLogin();
  assert.equal(
    (await db.query("select public.current_school_editor_school() id")).rows[0].id,
    school,
  );
  assert.equal(
    (await db.query("select public.can_manage_school_media($1) ok", [school])).rows[0].ok,
    true,
  );
  await login("service_role");
  for (let n = 0; n < 7; n++) {
    assert.equal(
      (await db.query("select public.can_attempt_school_login('managed-school') ok")).rows[0].ok,
      true,
    );
    await db.query("select public.finish_school_login_attempt('managed-school',false)");
  }
  assert.equal(
    (await db.query("select public.finish_school_login_attempt('managed-school',true) ok")).rows[0]
      .ok,
    true,
  );
  for (let n = 0; n < 8; n++)
    await db.query("select public.finish_school_login_attempt('managed-school',false)");
  assert.equal(
    (await db.query("select public.can_attempt_school_login('managed-school') ok")).rows[0].ok,
    false,
  );
  assert.equal(
    (await db.query("select public.finish_school_login_attempt('managed-school',true) ok")).rows[0]
      .ok,
    false,
    "late success cannot bypass lock",
  );
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select locked_until>now()+interval '14 minutes' ok from editor_access_private.school_login_attempts where username='managed-school'",
      )
    ).rows[0].ok,
    true,
  );
  await db.exec(
    "update editor_access_private.school_login_attempts set locked_until=now()-interval '1 second'",
  );
  await login("service_role");
  assert.equal(
    (await db.query("select public.finish_school_login_attempt('managed-school',true) ok")).rows[0]
      .ok,
    true,
  );
  await login("authenticated", uid);
  await denied("select public.can_attempt_school_login('managed-school')");
  await denied("select * from editor_access_private.school_login_attempts");
  console.log(
    "School Editor DB tests passed: managed uniqueness/identity, legacy compatibility, assignment RLS, own school/ORT/media, review/archive/disabled/revoked session denial, Admin publication, private limiter and 8-attempt/15-minute lock",
  );
}
