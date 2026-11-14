import assert from "node:assert/strict";
import fs from "node:fs";
export async function testSchoolMedia({ db, login, denied, admin, editor }) {
  await db.exec(
    "reset role; do $$ begin if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if; end $$; alter role service_role bypassrls;",
  );
  const migration = fs
    .readdirSync("supabase/migrations")
    .find((file) => file.endsWith("_school_media.sql"));
  assert.ok(migration);
  await db.exec(fs.readFileSync(`supabase/migrations/${migration}`, "utf8"));
  await login("authenticated", admin);
  const create = async (name) =>
    (await db.query("select public.create_school_auto($1) id", [name])).rows[0].id;
  const id = await create("Media fixture"),
    other = await create("Other media fixture");
  await db.query("insert into public.school_editor_assignments values($1,$2)", [id, editor]);
  let revision = 0;
  const info = (await db.query("select * from public.schools where id=$1", [id])).rows[0];
  const meta = { width: 800, height: 600, bytes: 20000, sha256: "a".repeat(64) },
    thumb = { ...meta, width: 400, height: 300, bytes: 10000 };
  const upload = async (kind, schoolId = id) => {
    await login("authenticated", editor);
    const row = (
      await db.query("select * from public.register_school_media($1,$2)", [schoolId, kind])
    ).rows[0];
    await denied("select public.complete_school_media($1,$2,$3,$4)", [row.id, editor, meta, thumb]);
    await login("service_role");
    await db.query("select public.complete_school_media($1,$2,$3,$4)", [
      row.id,
      editor,
      meta,
      thumb,
    ]);
    return row;
  };
  const save = async (cover, gallery, submit = false) => {
    await login("authenticated", editor);
    await db.query("select public.save_school_active_draft($1,$2,$3,$4)", [
      id,
      revision,
      { info, ort: [], media: { cover, gallery } },
      submit,
    ]);
    revision++;
  };
  const publishMedia = async () => {
    await login("authenticated", admin);
    await denied("select public.review_school($1,$2,'publish',null)", [id, revision]);
    const media = (
      await db.query("select public.prepare_school_media_publication($1,$2) media", [id, revision])
    ).rows[0].media;
    await denied("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
      id,
      revision,
      admin,
      media,
    ]);
    await login("service_role");
    await denied("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
      id,
      revision + 1,
      admin,
      media,
    ]);
    await denied("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
      id,
      revision,
      editor,
      media,
    ]);
    await denied("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
      id,
      revision,
      admin,
      [],
    ]);
    await db.query("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
      id,
      revision,
      admin,
      media,
    ]);
    await login("authenticated", admin);
  };
  await login("anon");
  await denied("select * from public.school_media");
  await denied("select public.register_school_media($1,'cover')", [id]);
  await login("authenticated", editor);
  await denied("select public.register_school_media($1,'cover')", [other]);
  const a = await upload("cover"),
    b = await upload("cover"),
    gallery = [];
  await login("authenticated", admin);
  const foreign = (
    await db.query("select * from public.register_school_media($1,'cover')", [other])
  ).rows[0];
  await login("service_role");
  await db.query("select public.complete_school_media($1,$2,$3,$4)", [
    foreign.id,
    admin,
    meta,
    thumb,
  ]);
  await login("authenticated", editor);
  await denied("select public.save_school_active_draft($1,$2,$3,false)", [
    id,
    revision,
    { info, ort: [], media: { cover: foreign.id, gallery: [] } },
  ]);
  await denied("select public.save_school_active_draft($1,$2,$3,false)", [
    id,
    revision,
    { info, ort: [], media: { cover: "99999999-9999-4999-8999-999999999999", gallery: [] } },
  ]);
  for (let i = 0; i < 16; i++) gallery.push((await upload("gallery")).id);
  await login("authenticated", editor);
  await denied("select public.save_school_active_draft($1,$2,$3,false)", [
    id,
    revision,
    { info, ort: [], media: { cover: a.id, gallery } },
  ]);
  const orderedGallery = [gallery[0], gallery[2], gallery[1], gallery[3], ...gallery.slice(4, 15)];
  await save(a.id, orderedGallery);
  await login("authenticated", editor);
  assert.deepEqual(
    (
      await db.query(
        "select id,sort_order from public.school_media where school_id=$1 and kind='gallery' and in_draft order by sort_order",
        [id],
      )
    ).rows,
    orderedGallery.map((id, sort_order) => ({ id, sort_order })),
  );
  await db.exec("reset role");
  await denied("update public.school_media set in_draft=true where id=$1", [b.id]);
  await denied("update public.school_media set in_draft=true,sort_order=0 where id=$1", [
    gallery[15],
  ]);
  await login("authenticated", admin);
  await publishMedia();
  revision++;
  const snapshot = async () =>
    (await db.query("select document from public.school_publications where school_id=$1", [id]))
      .rows[0].document;
  const original = await snapshot();
  assert.equal(original.media.cover.asset_id, a.id);
  assert.equal(original.media.gallery.length, 15);
  assert.deepEqual(
    original.media.gallery.map((image) => image.asset_id),
    orderedGallery,
  );
  await login("service_role");
  // Failure cleanup must protect both current review/draft and the retained publication.
  await db.query("select public.record_school_media_promotion_failure($1,$2)", [
    id,
    [a.id, gallery[15]],
  ]);
  await db.query("select public.record_school_media_promotion_failure($1,$2)", [
    id,
    [a.id, gallery[15]],
  ]);
  assert.equal(
    (await db.query("select * from public.school_media_cleanup_jobs where school_id=$1", [id])).rows
      .length,
    1,
  );
  assert.deepEqual(await snapshot(), original);
  await db.exec("reset role");
  await db.query(
    "update public.school_media set created_at=now()-interval '72 hours' where school_id=$1",
    [id],
  );
  await login("service_role");
  await db.query("select public.sweep_school_media($1)", [id]);
  // Published and draft references survive a sweep; the unattached pending gallery is collected.
  assert.equal(
    (await db.query("select * from public.school_media where id=$1", [a.id])).rows.length,
    1,
  );
  // Keep replacement b for this fixture: it was deliberately staged but not saved.
  await db.exec("reset role");
  // Re-register a replacement because old unattached staging correctly expires.
  const replacement = await upload("cover");
  b.id = replacement.id;
  await login("authenticated", admin);
  for (const field of [
    "id",
    "status",
    "revision",
    "review_note",
    "archived_at",
    "is_archived",
    "created_at",
    "updated_at",
  ])
    assert.equal(original.info[field], undefined);
  for (const field of ["main_sha256", "created_at", "state", "in_draft", "school_id"])
    assert.equal(original.media.cover[field], undefined);
  await save(b.id, []);
  await login("authenticated", admin);
  assert.deepEqual(await snapshot(), original);
  await save(b.id, [], true);
  await login("authenticated", admin);
  const reviewed = (
    await db.query("select public.prepare_school_media_publication($1,$2) media", [id, revision])
  ).rows[0].media;
  await login("service_role");
  await db.query("select public.record_school_media_promotion_failure($1,$2)", [id, [a.id, b.id]]);
  assert.equal(
    (
      await db.query("select public_promotion_attempted_at from public.school_media where id=$1", [
        b.id,
      ])
    ).rows[0].public_promotion_attempted_at !== null,
    true,
  );
  assert.equal(
    (
      await db.query("select * from public.school_media_cleanup_jobs where main_key=$1", [
        replacement.main_key,
      ])
    ).rows.length,
    0,
  );
  assert.deepEqual(await snapshot(), original);
  await login("authenticated", editor);
  await denied("select public.register_school_media($1,'gallery')", [id]);
  await login("authenticated", admin);
  await db.query("select public.review_school($1,$2,'return','Correction')", [id, revision]);
  revision++;
  assert.deepEqual(await snapshot(), original);
  await login("service_role");
  await denied("select public.finish_school_media_publication($1,$2,$3,$4,null)", [
    id,
    revision - 1,
    admin,
    reviewed,
  ]);
  assert.deepEqual(await snapshot(), original);
  await publishMedia();
  revision++;
  assert.equal((await snapshot()).media.cover.asset_id, b.id);
  await db.query("select public.review_school($1,$2,'unpublish',null)", [id, revision]);
  revision++;
  await login("anon");
  assert.equal(
    (await db.query("select * from public.school_publications where school_id=$1", [id])).rows
      .length,
    0,
  );
  await denied("select * from public.school_media");
  await login("authenticated", admin);
  const mediaBeforeArchive = (
    await db.query("select * from public.school_media where school_id=$1 order by id", [id])
  ).rows;
  const assignmentsBeforeArchive = (
    await db.query(
      "select * from public.school_editor_assignments where school_id=$1 order by user_id",
      [id],
    )
  ).rows;
  const otherSchoolMedia = (
    await db.query("select * from public.school_media where school_id=$1 order by id", [other])
  ).rows;
  await db.query("select public.set_school_archived($1,$2,true)", [id, revision]);
  revision++;
  assert.deepEqual(
    (await db.query("select * from public.school_media where school_id=$1 order by id", [id])).rows,
    mediaBeforeArchive,
  );
  assert.deepEqual(
    (
      await db.query(
        "select * from public.school_editor_assignments where school_id=$1 order by user_id",
        [id],
      )
    ).rows,
    assignmentsBeforeArchive,
  );
  await db.query("select public.set_school_archived($1,$2,false)", [id, revision]);
  revision++;
  assert.deepEqual(
    (await db.query("select * from public.school_media where school_id=$1 order by id", [id])).rows,
    mediaBeforeArchive,
  );
  assert.deepEqual(
    (
      await db.query(
        "select * from public.school_editor_assignments where school_id=$1 order by user_id",
        [id],
      )
    ).rows,
    assignmentsBeforeArchive,
  );
  await db.query("select public.set_school_archived($1,$2,true)", [id, revision]);
  revision++;
  await login("authenticated", editor);
  await denied("select public.register_school_media($1,'cover')", [id]);
  await login("authenticated", admin);
  await db.query("select public.permanently_delete_school($1,$2,'Media fixture')", [id, revision]);
  await db.exec("reset role");
  assert.equal(
    (await db.query("select * from public.school_editor_assignments where school_id=$1", [id])).rows
      .length,
    0,
  );
  assert.equal(
    (await db.query("select * from auth.users where id=$1", [editor])).rows.length,
    1,
    "Auth account must survive school deletion",
  );
  assert.deepEqual(
    (await db.query("select * from public.school_media where school_id=$1 order by id", [other]))
      .rows,
    otherSchoolMedia,
  );
  assert.equal(
    (await db.query("select * from public.school_media where school_id=$1", [id])).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.school_media_cleanup_jobs where school_id=$1", [id])).rows
      .length,
    19,
  );
  await login("authenticated", admin);
  await db.query("select public.review_school($1,0,'publish',null)", [other]);
  assert.deepEqual(
    (await db.query("select document from public.school_publications where school_id=$1", [other]))
      .rows[0].document.media,
    { cover: null, gallery: [] },
  );
  console.log(
    "School media migration tests passed: cover/gallery limits, ownership, service-only completion, review/archive locks, immutable snapshots/whitelists, unpublish privacy, deletion outbox and legacy no-media publication",
  );
}
