// Invoked by the full in-memory migration replay. Never connects to Supabase.
import assert from "node:assert/strict";

export async function testInstitutionCatalog(db, { admin, schoolUser, school }) {
  const login = async (user, role = "authenticated") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify(
        user === schoolUser ? { session_id: "90000000-0000-4000-8000-000000000004" } : {},
      ),
    ]);
    await db.exec(`set role ${role}`);
  };
  const reject = async (fn, message) => assert.rejects(fn, message);
  const source = {
    source_file: "FINAL.xlsx",
    source_sheet: "Бакчалар",
    source_row: 42,
    excel_number: 41,
    original_name: "PRIVATE_MCHBBU",
    original_address: "PRIVATE_ADDRESS",
    original_territory: "Сары-Булак",
  };
  const payload = {
    short_name_kg: "Сынак",
    short_name_ru: "Тест",
    short_name_en: "Test",
    type: "kindergarten",
    name_kg: "Сынак бала бакчасы",
    name_ru: "Тестовый сад",
    name_en: "Test Kindergarten",
    address_kg: "Кызыл-Булак айылы, номерсиз",
    address_ru: "с. Кызыл-Булак, без номера",
    address_en: "Kyzyl-Bulak (No street number)",
    territory_slug: "ryspai-abdykadyrov",
    village_slug: "kyzyl-bulak",
    source_metadata: source,
  };
  await login(admin);
  const created = (await db.query("select public.create_kindergarten($1,false) id", [payload]))
    .rows[0].id;
  assert.equal(
    (await db.query("select status from public.kindergartens where id=$1", [created])).rows[0]
      .status,
    "draft",
  );
  await login("", "anon");
  await reject(() => db.query("select * from public.kindergartens"), /permission denied/);
  assert.equal((await db.query("select * from public.kindergarten_publications")).rows.length, 0);
  await reject(
    () => db.query("select public.create_kindergarten($1,false)", [payload]),
    /permission denied/,
  );
  await login(schoolUser);
  assert.equal((await db.query("select * from public.kindergartens")).rows.length, 0);
  await reject(
    () => db.query("select public.create_kindergarten($1,false)", [payload]),
    /Not authorized/,
  );
  await reject(
    () => db.query("select public.save_kindergarten($1,1,$2,true)", [created, payload]),
    /Not authorized/,
  );
  await reject(
    () => db.query("select public.unpublish_kindergarten($1,1)", [created]),
    /Not authorized/,
  );
  await login(admin);
  await reject(
    () =>
      db.query(
        "insert into public.kindergartens(slug,type,name_kg,territory_slug,village_slug) values('bypass','kindergarten','bypass','kara-kulja','kara-kulja')",
      ),
    /permission denied/,
  );
  await reject(
    () => db.query("select public.save_kindergarten($1,0,$2,true)", [created, payload]),
    /Revision conflict/,
  );
  await reject(
    () =>
      db.query("select public.save_kindergarten($1,1,$2,true)", [
        created,
        { ...payload, type: "school" },
      ]),
    /check constraint/,
  );
  await reject(
    () =>
      db.query("select public.save_kindergarten($1,1,$2,true)", [
        created,
        { ...payload, territory_slug: "kara-kochkor" },
      ]),
    /check constraint/,
  );
  await reject(
    () =>
      db.query("select public.save_kindergarten($1,1,$2,true)", [
        created,
        { ...payload, name_kg: "" },
      ]),
    /check constraint/,
  );
  await reject(
    () =>
      db.query("select public.save_kindergarten($1,1,$2,true)", [
        created,
        { ...payload, source_metadata: { original_name: "incomplete" } },
      ]),
    /check constraint/,
  );
  await reject(
    () =>
      db.query("select public.save_kindergarten($1,1,$2,true)", [
        created,
        { ...payload, slug: "change" },
      ]),
    /Slug is immutable/,
  );
  await db.query("select public.save_kindergarten($1,1,$2,true)", [created, payload]);
  await login("", "anon");
  const published = (await db.query("select document from public.kindergarten_publications"))
    .rows[0].document;
  assert.equal(published.info.name_kg, payload.name_kg);
  assert.equal(published.info.address_en, payload.address_en);
  assert.equal(published.info.type, "kindergarten");
  assert.equal(published.info.short_name_kg, "Сынак");
  assert.equal(published.info.name_kg, payload.name_kg);
  assert.ok(!JSON.stringify(published).includes("PRIVATE_"));
  assert.ok(!JSON.stringify(published).includes("source_metadata"));
  await login(admin);
  await db.query("select public.save_kindergarten($1,2,$2,false)", [
    created,
    { ...payload, type: "school_preschool", name_kg: "Жаңы долбоор" },
  ]);
  await login("", "anon");
  assert.equal(
    (await db.query("select document from public.kindergarten_publications")).rows[0].document.info
      .name_kg,
    payload.name_kg,
  );
  await login(admin);
  await db.query("select public.unpublish_kindergarten($1,3)", [created]);
  await login("", "anon");
  assert.equal((await db.query("select * from public.kindergarten_publications")).rows.length, 0);
  await login(admin);
  assert.deepEqual(
    (await db.query("select source_metadata from public.kindergartens where id=$1", [created]))
      .rows[0].source_metadata,
    source,
  );

  // Real active-save and publication stack: type and source never bypass old protections.
  const fixture = (await db.query("select public.create_school_auto('Type contract fixture') id"))
    .rows[0].id;
  await db.exec("reset role");
  await db.query("insert into public.school_year_stats values($1,'2026-2027',42,5,3)", [fixture]);
  await login(admin);
  const info = (await db.query("select * from public.schools where id=$1", [fixture])).rows[0];
  await reject(
    () => db.query("select public.review_school($1,0,'publish',null)", [fixture]),
    /School type required/,
  );
  const updated = {
    ...info,
    school_type: "general",
    short_name_kg: "Кыска",
    short_name_ru: "Коротко",
    short_name_en: "Short",
    source_metadata: { ...source, source_sheet: "Мектептер" },
  };
  await db.query("select public.save_school_active_draft($1,0,$2,false)", [
    fixture,
    { info: updated, ort: [] },
  ]);
  assert.equal(
    (await db.query("select school_type from public.schools where id=$1", [fixture])).rows[0]
      .school_type,
    "general",
  );
  await db.query("select public.review_school($1,1,'publish',null)", [fixture]);
  await login("", "anon");
  const schoolDoc = (
    await db.query("select document from public.school_publications where school_id=$1", [fixture])
  ).rows[0].document;
  assert.equal(schoolDoc.info.school_type, "general");
  assert.equal(schoolDoc.info.short_name_kg, "Кыска");
  assert.equal(schoolDoc.info.name_kg, "Type contract fixture");
  assert.ok(!JSON.stringify(schoolDoc).includes("PRIVATE_"));
  assert.equal(schoolDoc.stats[0].total_students, 42);
  await login(admin);
  const editorInfo = (await db.query("select * from public.schools where id=$1", [school])).rows[0];
  await login(schoolUser);
  const { source_metadata: omittedSource, ...editorIdentity } = editorInfo;
  await reject(
    () =>
      db.query("select public.save_school_active_draft($1,$2,$3,false)", [
        school,
        editorInfo.revision,
        { info: { ...editorIdentity, short_name_kg: "Unauthorized rename" }, ort: [] },
      ]),
    /Only Admin/,
  );

  await reject(
    () =>
      db.query("select public.save_school_active_draft($1,$2,$3,false)", [
        school,
        editorInfo.revision,
        { info: { ...editorInfo, school_type: "boarding" }, ort: [] },
      ]),
    /Only Admin/,
  );
  await reject(
    () =>
      db.query("select public.save_school_active_draft($1,$2,$3,false)", [
        school,
        editorInfo.revision,
        { info: { ...editorInfo, source_metadata: source }, ort: [] },
      ]),
    /Only Admin/,
  );
  await reject(
    () =>
      db.query("select public.save_school_before_institution_types($1,$2,$3,false)", [
        school,
        editorInfo.revision,
        { info: editorInfo, ort: [] },
      ]),
    /permission denied/,
  );
  await reject(
    () =>
      db.query("select public.review_school_media_internal($1,0,'publish',null,true,$2)", [
        fixture,
        admin,
      ]),
    /permission denied/,
  );
  assert.equal((await db.query("select public.can_manage_news() ok")).rows[0].ok, false);
  await db.exec("reset role");
  assert.equal(
    (
      await db.query(
        "select count(*)::int n from public.school_editor_assignments where school_id=$1",
        [school],
      )
    ).rows[0].n,
    1,
  );
  console.log(
    "Institution catalog security passed: exact types/locations, Admin-only mutations, protected snapshots/provenance, draft isolation, unpublish, immutable slugs, revision conflicts, real school save/publication stack and preserved annual/editor records",
  );
}
