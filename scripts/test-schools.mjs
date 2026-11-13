// In-memory PostgreSQL tests only. Never connects to a Supabase project.
// node scripts/test-schools.mjs <absolute path to @electric-sql/pglite/dist/index.js>
import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { tmpdir } from "node:os";
import path from "node:path";
import { testEditorAccess } from "./test-editor-access.mjs";

const ortCode = ts.transpileModule(fs.readFileSync("src/lib/school-ort.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { calculateOrt, parseOrtScores } = await import(
  `data:text/javascript;base64,${Buffer.from(ortCode).toString("base64")}`
);
const scores = [128, 147, 154, 161, 166, 172, 181, 203, 217];
assert.deepEqual(calculateOrt(scores), {
  participants: 9,
  average: 169.89,
  median: 166,
  minimum: 128,
  maximum: 217,
  over200: 2,
  distribution: [0, 1, 1, 3, 2, 0, 2],
});
assert.equal(calculateOrt([1, 2]).median, 1.5);
assert.equal(calculateOrt([]).average, null);
assert.deepEqual(parseOrtScores("128, 147\n154; 161").scores, [128, 147, 154, 161]);
assert.equal(parseOrtScores("-1 1.5 NaN 999999 text").invalid.length, 5);
assert.deepEqual(parseOrtScores("1 300").scores, [1, 300]);
assert.deepEqual(parseOrtScores("128   147\t154").scores, [128, 147, 154]);
for (const input of [
  "",
  "  ",
  "0",
  "-1",
  "1.5",
  "301",
  "NaN",
  "Infinity",
  "text",
  "128,,147",
  "128; ;147",
  "128\n\n147",
  "128,",
  ",128",
  "128\n",
]) {
  const parsed = parseOrtScores(input);
  assert.ok(parsed.invalid.length > 0, `Must reject ${JSON.stringify(input)}`);
  assert.deepEqual(parsed.scores, []);
  assert.equal(parsed.summary, null);
}
for (const bad of [0, -1, 1.5, 301, NaN, Infinity]) {
  assert.throws(() => calculateOrt([128, bad, 147]), RangeError);
}
assert.equal(calculateOrt([1, 300]).average, 150.5);
assert.equal(
  calculateOrt([109, 110, 129, 130, 149, 150, 169, 170, 189, 190, 199, 200]).participants,
  12,
);
assert.deepEqual(
  calculateOrt([109, 110, 129, 130, 149, 150, 169, 170, 189, 190, 199, 200]).distribution,
  [1, 2, 2, 2, 2, 2, 1],
);
console.log("ORT unit tests passed");
const ortModuleUrl = `data:text/javascript;base64,${Buffer.from(ortCode).toString("base64")}`;
const validationCode = ts
  .transpileModule(fs.readFileSync("src/lib/school-form-validation.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  })
  .outputText.replace('"./school-ort"', JSON.stringify(ortModuleUrl));
const { prepareSchoolDraft, prepareActiveSchoolDraft } = await import(
  `data:text/javascript;base64,${Buffer.from(validationCode).toString("base64")}`
);
const errorsCode = ts.transpileModule(fs.readFileSync("src/lib/school-errors.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { schoolRpcError } = await import(
  `data:text/javascript;base64,${Buffer.from(errorsCode).toString("base64")}`
);
const basicDraft = {
  info: { name_kg: "Basic fixture", current_academic_year: "" },
  stats: [],
  ort: [],
  achievements: [],
  resources: [],
};
assert.equal(prepareSchoolDraft(basicDraft, [], []).issues.length, 0);
const activeOnly = prepareActiveSchoolDraft(
  {
    ...basicDraft,
    stats: [{ academic_year: "unfinished" }],
    achievements: [{ title_kg: "unfinished" }],
    resources: [{ type: "material" }],
  },
  [],
  [],
);
assert.equal(activeOnly.issues.length, 0);
assert.deepEqual(Object.keys(activeOnly.payload).sort(), ["info", "ort"]);
const emptyOrt = { ...basicDraft, ort: [{ year: 2026, academic_year: "2025-2026", scores: [] }] };
const untouched = prepareSchoolDraft(emptyOrt, [""], [false]);
assert.equal(untouched.issues.length, 0);
assert.deepEqual(untouched.payload.ort, []);
assert.ok(prepareSchoolDraft(emptyOrt, [""], [true]).issues.length);
assert.equal(prepareSchoolDraft(emptyOrt, ["142\n156\n215"], [true]).issues.length, 0);
assert.deepEqual(
  prepareSchoolDraft(emptyOrt, ["142\n156\n215"], [true]).payload.ort[0].scores,
  [142, 156, 215],
);
const invalidOrt = prepareSchoolDraft(emptyOrt, ["0 315 abc"], [true]);
assert.equal(invalidOrt.issues[0].values, "0, 315, abc");
assert.deepEqual(invalidOrt.payload.ort[0].scores, []);
const emptyCollections = prepareSchoolDraft(
  {
    ...basicDraft,
    stats: [
      { academic_year: "", total_students: null, total_teachers: null, grade11_graduates: null },
    ],
    achievements: [{ date: "", title_kg: "", description_kg: "", category: "" }],
    resources: [{ title_kg: "", type: "material", url: "", year: null }],
  },
  [],
  [],
);
assert.equal(emptyCollections.issues.length, 0);
for (const collection of ["stats", "ort", "achievements", "resources"])
  assert.deepEqual(emptyCollections.payload[collection], []);
for (const partial of [
  {
    stats: [
      { academic_year: "2026", total_students: 12, total_teachers: null, grade11_graduates: null },
    ],
  },
  { achievements: [{ date: "2026-10-24", title_kg: "", description_kg: "", category: "" }] },
  { resources: [{ type: "material", url: "https://example.com", title_kg: "", year: null }] },
])
  assert.ok(prepareSchoolDraft({ ...basicDraft, ...partial }, [], []).issues.length);
assert.match(schoolRpcError({ code: "42501" }), /Недостаточно прав/);
assert.match(schoolRpcError({ message: "Revision conflict" }), /Данные изменились/);
assert.match(schoolRpcError({ message: "internal detail" }), /Не удалось сохранить изменения/);
console.log("Optional collection payload validation and visible RPC error mapping passed");
const pglitePath =
  process.argv[2] ??
  path.join(
    tmpdir(),
    "kara-kulja-schools-db-tests/node_modules/@electric-sql/pglite/dist/index.js",
  );
if (!fs.existsSync(pglitePath))
  throw new Error("Pass an installed local PGlite module path; no remote database is used.");
const { PGlite } = await import(pathToFileURL(pglitePath).href);
const db = new PGlite();
try {
  await db.exec(`create role anon; create role authenticated;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  const foundation = fs
    .readFileSync("supabase/migrations/20261024000000_news_admin_foundation.sql", "utf8")
    .replace("create extension if not exists pgcrypto;", "")
    .split("insert into storage.buckets")[0];
  await db.exec(foundation);
  await db.exec(fs.readFileSync("supabase/migrations/20261024010000_news_r2_gallery.sql", "utf8"));
  const existingPolicies = async () =>
    (
      await db.query(
        "select tablename,policyname,cmd,roles::text,qual,with_check from pg_policies where schemaname='public' and tablename in ('profiles','news') order by tablename,policyname",
      )
    ).rows;
  const oldPolicies = await existingPolicies();
  const adminFunction = async () =>
    (await db.query("select pg_get_functiondef('public.is_admin()'::regprocedure) definition"))
      .rows[0].definition;
  const oldAdminFunction = await adminFunction();
  const existingGrants = async () =>
    (
      await db.query(
        "select relname,relacl::text from pg_class where oid in ('public.profiles'::regclass,'public.news'::regclass) order by relname",
      )
    ).rows;
  const oldGrants = await existingGrants();
  const adminFunctionGrants = async () =>
    (await db.query("select proacl::text from pg_proc where oid='public.is_admin()'::regprocedure"))
      .rows;
  const oldAdminFunctionGrants = await adminFunctionGrants();
  // Simulate broad inherited defaults: the Schools migration must revoke PUBLIC too.
  await db.exec("alter default privileges in schema public grant all on tables to public");
  await db.exec(fs.readFileSync("supabase/migrations/20261112000000_schools.sql", "utf8"));
  await db.exec(
    fs.readFileSync("supabase/migrations/20261112213822_schools_admin_refinement.sql", "utf8"),
  );
  assert.deepEqual(await existingPolicies(), oldPolicies);
  assert.equal(await adminFunction(), oldAdminFunction);
  assert.deepEqual(await existingGrants(), oldGrants);
  assert.deepEqual(await adminFunctionGrants(), oldAdminFunctionGrants);
  const boundaryScores = [109, 110, 129, 130, 149, 150, 169, 170, 189, 190, 199, 200];
  for (const input of [scores, [1, 300], boundaryScores, [128], [128, 129], [110, 110, 200]]) {
    const summary = (
      await db.query("select public.school_ort_summary($1) summary", [JSON.stringify(input)])
    ).rows[0].summary;
    assert.deepEqual(summary, calculateOrt(input));
    assert.equal(
      summary.distribution.reduce((sum, n) => sum + n, 0),
      input.length,
    );
  }
  console.log(
    "SQL aggregate boundaries/median/rounding and existing Admin/News policy checks passed",
  );
  const admin = "00000000-0000-4000-8000-000000000001";
  const editor = "00000000-0000-4000-8000-000000000002";
  const outsider = "00000000-0000-4000-8000-000000000003";
  await db.query("insert into auth.users values ($1),($2),($3)", [admin, editor, outsider]);
  await db.query("update public.profiles set role='admin' where id=$1", [admin]);
  const login = async (role, id = "") => {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    await db.exec(`set role ${role}`);
  };
  const denied = async (sql, params = []) => {
    await assert.rejects(() => db.query(sql, params));
  };
  const count = async (table) =>
    Number((await db.query(`select count(*) n from public.${table}`)).rows[0].n);
  await login("authenticated", admin);
  assert.equal((await db.query("select public.is_admin() a")).rows[0].a, true);
  const privateNews = (
    await db.query(
      "insert into public.news(slug,title_kg) values('private-news-fixture','Private fixture') returning id",
    )
  ).rows[0].id;
  await db.query(
    "insert into public.news(slug,title_kg,is_published,published_at) values('public-news-fixture','Public fixture',true,now())",
  );
  const school = (await db.query("select public.create_school('fixture-school','Test fixture') id"))
    .rows[0].id;
  const other = (await db.query("select public.create_school('other-fixture','Other fixture') id"))
    .rows[0].id;
  const originalTimestamps = (
    await db.query("select created_at,updated_at from public.schools where id=$1", [school])
  ).rows[0];
  await db.query("insert into public.school_editor_assignments values($1,$2)", [school, editor]);
  await denied("insert into public.school_editor_assignments values($1,$2)", [school, editor]);
  await denied("select public.create_school('fixture-school','Duplicate slug')");
  for (const table of [
    "schools",
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
    "school_publications",
  ]) {
    assert.equal(
      (
        await db.query(
          "select has_table_privilege('authenticated',$1,'INSERT,UPDATE,DELETE,TRUNCATE') access",
          [`public.${table}`],
        )
      ).rows[0].access,
      false,
    );
    assert.equal(
      (
        await db.query(
          "select has_table_privilege('anon',$1,'INSERT,UPDATE,DELETE,TRUNCATE') access",
          [`public.${table}`],
        )
      ).rows[0].access,
      false,
    );
  }
  await login("authenticated", editor);
  assert.equal((await db.query("select public.is_admin() a")).rows[0].a, false);
  assert.equal(await count("schools"), 1);
  assert.equal((await db.query("select id from public.schools")).rows[0].id, school);
  assert.equal(await count("news"), 1);
  assert.equal(
    (
      await db.query("update public.news set title_kg='forged' where id=$1 returning id", [
        privateNews,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("delete from public.news where id=$1 returning id", [privateNews])).rows.length,
    0,
  );
  await denied("select public.create_school('unauthorized','No')");
  await denied("select public.review_school($1,0,'publish',null)", [school]);
  await denied("insert into public.school_editor_assignments values($1,$2)", [other, editor]);
  assert.equal(
    (
      await db.query(
        "delete from public.school_editor_assignments where school_id=$1 and user_id=$2 returning school_id",
        [school, editor],
      )
    ).rows.length,
    0,
  );
  assert.equal(await count("school_editor_assignments"), 1);
  await denied("update public.school_editor_assignments set school_id=$1 where school_id=$2", [
    other,
    school,
  ]);
  for (const table of [
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
    "school_publications",
  ]) {
    await denied(`update public.${table} set school_id=$1 where school_id=$2`, [other, school]);
  }
  await db.exec("create temporary table school_editor_assignments(school_id uuid,user_id uuid)");
  await db.query("insert into pg_temp.school_editor_assignments values($1,$2)", [other, editor]);
  assert.equal(
    (await db.query("select public.can_edit_school($1) allowed", [other])).rows[0].allowed,
    false,
  );
  await db.exec("drop table pg_temp.school_editor_assignments");
  await denied("update public.profiles set role='admin' where id=$1", [editor]);
  await denied("update public.schools set slug='changed' where id=$1", [school]);
  await denied("delete from public.schools where id=$1", [school]);
  await denied("insert into public.news(slug,title_kg) values('unauthorized','No')");
  await denied(
    "insert into public.school_publications(school_id,slug,document) values($1,'forged','{}')",
    [school],
  );
  const payload = {
    info: { name_kg: "Approved fixture", current_academic_year: "2026-2027" },
    stats: [
      { academic_year: "2026-2027", total_students: 100, total_teachers: 10, grade11_graduates: 9 },
    ],
    ort: [
      { year: 2026, academic_year: "2026-2027", scores },
      { year: 2025, academic_year: "2025-2026", scores: [1, 300] },
    ],
    achievements: [
      {
        date: "2026-11-12",
        title_kg: "Approved achievement",
        description_kg: "Anonymous fixture",
        category: "other",
      },
    ],
    resources: [
      {
        title_kg: "Approved resource",
        type: "document",
        url: "https://example.com/practice.pdf",
        year: 2026,
      },
    ],
  };
  for (const forbidden of [
    { slug: "forged-slug" },
    { territory_slug: "alaikuu" },
    { village_slug: "kyzyl-zhar" },
  ]) {
    await denied("select public.save_school_draft($1,0,$2,false)", [
      school,
      { ...payload, info: { ...payload.info, ...forbidden } },
    ]);
  }
  await denied("select public.save_school_draft($1,0,$2,false)", [
    school,
    { ...payload, stats: [...payload.stats, ...payload.stats] },
  ]);
  await denied("select public.save_school_draft($1,0,$2,false)", [
    school,
    { ...payload, ort: [...payload.ort, ...payload.ort] },
  ]);
  await denied("select public.save_school_draft($1,0,$2,false)", [
    school,
    { ...payload, stats: [{ ...payload.stats[0], total_students: -1 }] },
  ]);
  await denied("select public.save_school_draft($1,0,$2,false)", [other, payload]);
  await denied("select public.save_school_draft($1,null,$2,false)", [school, payload]);
  for (const bad of [
    [],
    [0],
    [-1],
    [301],
    [1.5],
    ["128"],
    [""],
    [null],
    [true],
    [{}],
    [[128]],
    [128, 0, 147],
    [128, 301, 147],
    null,
  ]) {
    await denied("select public.save_school_draft($1,0,$2,false)", [
      school,
      { ...payload, ort: [{ ...payload.ort[0], scores: bad }] },
    ]);
  }
  assert.equal(await count("school_ort_years"), 0);
  assert.equal(
    (await db.query("select revision from public.schools where id=$1", [school])).rows[0].revision,
    0,
  );
  await db.query("select public.save_school_draft($1,0,$2,true)", [school, payload]);
  await denied("select public.save_school_draft($1,1,$2,false)", [school, payload]);
  await login("anon");
  assert.equal(await count("school_publications"), 0);
  for (const table of [
    "schools",
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
    "school_editor_assignments",
  ])
    await denied(`select * from public.${table}`);
  for (const sql of [
    "select public.can_edit_school($1)",
    "select public.review_school($1,1,'publish',null)",
  ])
    await denied(sql, [school]);
  await denied("select public.create_school('anon-school','No')");
  await denied("select public.save_school_draft($1,1,$2,false)", [school, payload]);
  await denied("select public.school_ort_summary('[128]')");
  await login("authenticated", outsider);
  assert.equal(await count("schools"), 0);
  assert.equal(await count("school_ort_years"), 0);
  await denied("select public.save_school_draft($1,1,$2,false)", [school, payload]);
  await login("authenticated", admin);
  assert.equal(await count("schools"), 2);
  await db.query("select public.review_school($1,1,'publish',null)", [school]);
  await login("anon");
  const published = (await db.query("select document from public.school_publications")).rows[0]
    .document;
  assert.deepEqual(published.ort[0].summary, calculateOrt(scores));
  assert.deepEqual(published.ort[1].summary, calculateOrt([1, 300]));
  assert.equal(JSON.stringify(published).includes('"scores"'), false);
  assert.equal(published.info.name_kg, "Approved fixture");
  assert.equal(published.stats[0].total_students, 100);
  assert.equal(published.achievements[0].title_kg, "Approved achievement");
  assert.equal(published.resources[0].title_kg, "Approved resource");
  assert.equal(
    (
      await db.query("select count(*) n from public.school_publications where school_id=$1", [
        other,
      ])
    ).rows[0].n,
    0,
  );
  await login("authenticated", editor);
  await db.query("select public.save_school_draft($1,2,$2,false)", [
    school,
    { ...payload, info: { ...payload.info, name_kg: "Private change" } },
  ]);
  await denied("select public.save_school_draft($1,2,$2,false)", [school, payload]);
  await db.query("select public.save_school_draft($1,3,$2,true)", [
    school,
    {
      ...payload,
      school_id: other,
      info: { ...payload.info, id: other, name_kg: "Under-review change" },
      stats: payload.stats.map((r) => ({ ...r, school_id: other, total_students: 101 })),
      ort: payload.ort.map((r) => ({ ...r, school_id: other, scores: [300] })),
      achievements: payload.achievements.map((r) => ({
        ...r,
        school_id: other,
        title_kg: "Private achievement",
      })),
      resources: payload.resources.map((r) => ({
        ...r,
        school_id: other,
        title_kg: "Private resource",
      })),
    },
  ]);
  for (const table of [
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
  ]) {
    assert.ok(
      (await db.query(`select school_id from public.${table}`)).rows.every(
        (r) => r.school_id === school,
      ),
    );
  }
  await denied("select public.save_school_draft($1,4,$2,false)", [school, payload]);
  await login("anon");
  assert.deepEqual(
    (await db.query("select document from public.school_publications")).rows[0].document,
    published,
  );
  await login("authenticated", admin);
  await db.query("select public.review_school($1,4,'return','Correction fixture')", [school]);
  await login("authenticated", editor);
  assert.equal(
    (await db.query("select review_note from public.schools where id=$1", [school])).rows[0]
      .review_note,
    "Correction fixture",
  );
  await db.query("select public.save_school_draft($1,5,$2,false)", [
    school,
    {
      ...payload,
      stats: [
        {
          ...payload.stats[0],
          total_students: null,
          total_teachers: null,
          grade11_graduates: null,
        },
      ],
    },
  ]);
  await login("authenticated", admin);
  await db.query("select public.review_school($1,6,'unpublish',null)", [school]);
  await login("anon");
  assert.equal(await count("school_publications"), 0);
  await login("authenticated", editor);
  assert.equal(await count("school_publications"), 0);
  await login("authenticated", admin);
  await db.query("delete from public.school_editor_assignments where school_id=$1 and user_id=$2", [
    school,
    editor,
  ]);
  await login("authenticated", editor);
  assert.equal(await count("schools"), 0);
  await denied("select public.save_school_draft($1,7,$2,false)", [school, payload]);
  await login("authenticated", admin);
  const renamedPayload = {
    ...payload,
    info: {
      ...payload.info,
      slug: "renamed-fixture",
      territory_slug: "ylai-talaa",
      village_slug: "ylai-talaa",
    },
  };
  await db.query("select public.save_school_draft($1,7,$2,false)", [school, renamedPayload]);
  await denied("select public.save_school_draft($1,0,$2,false)", [
    "00000000-0000-4000-8000-000000000099",
    payload,
  ]);
  assert.equal(
    (await db.query("select slug from public.school_publications where school_id=$1", [school]))
      .rows[0].slug,
    "fixture-school",
  );
  await db.query("select public.review_school($1,8,'publish',null)", [school]);
  await db.query("insert into public.school_editor_assignments values($1,$2)", [school, editor]);
  await login("authenticated", editor);
  await denied("select public.save_school_draft($1,9,$2,false)", [school, payload]);
  await denied("select public.save_school_draft($1,9,$2,false)", [
    school,
    { ...renamedPayload, info: { ...renamedPayload.info, slug: "another-slug" } },
  ]);
  await db.query("select public.save_school_draft($1,9,$2,false)", [school, renamedPayload]);
  await login("anon");
  const renamed = (await db.query("select slug,document from public.school_publications")).rows[0];
  assert.equal(renamed.slug, "renamed-fixture");
  assert.equal(renamed.document.info.territory_slug, "ylai-talaa");
  await db.exec("reset role");
  for (const table of [
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
    "school_publications",
  ]) {
    const rules = (
      await db.query(
        "select confdeltype from pg_constraint where contype='f' and conrelid=$1::regclass and confrelid='public.schools'::regclass",
        [`public.${table}`],
      )
    ).rows;
    assert.deepEqual(
      rules.map((r) => r.confdeltype),
      ["r"],
    );
  }
  await denied("delete from public.schools where id=$1", [school]);
  assert.equal(await count("school_ort_years"), 2);
  assert.equal(await count("school_year_stats"), 1);
  const latestMetadata = (
    await db.query("select created_at,updated_at,revision from public.schools where id=$1", [
      school,
    ])
  ).rows[0];
  assert.deepEqual(latestMetadata.created_at, originalTimestamps.created_at);
  assert.ok(new Date(latestMetadata.updated_at) >= new Date(originalTimestamps.updated_at));
  assert.equal(latestMetadata.revision, 10);
  await db.query("insert into public.school_editor_assignments values($1,$2)", [other, outsider]);
  await db.query("delete from auth.users where id=$1", [outsider]);
  assert.equal(
    (
      await db.query("select count(*) n from public.school_editor_assignments where user_id=$1", [
        outsider,
      ])
    ).rows[0].n,
    0,
  );
  assert.equal(await count("schools"), 2);
  await assert.rejects(() =>
    db.exec(fs.readFileSync("supabase/migrations/20261112000000_schools.sql", "utf8")),
  );
  await db.exec("rollback");
  assert.equal(await count("schools"), 2);
  assert.deepEqual(await existingPolicies(), oldPolicies);
  console.log(
    "All 20 requested Schools security/integrity scenarios plus grant, identity, cascade and aggregate tests passed",
  );
  // Dedicated isolated fixtures for the additive migration. Never uses production IDs.
  await login("authenticated", admin);
  const createAuto = async (name) =>
    (await db.query("select public.create_school_auto($1) id", [name])).rows[0].id;
  const autoName = "М. Алиев атындагы орто мектеби";
  const autoIds = [
    await createAuto(autoName),
    await createAuto(autoName),
    await createAuto(autoName),
  ];
  assert.deepEqual(
    (
      await db.query("select slug from public.schools where id=any($1::uuid[]) order by slug", [
        autoIds,
      ])
    ).rows.map((r) => r.slug),
    [
      "m-aliev-atyndagy-orto-mektebi",
      "m-aliev-atyndagy-orto-mektebi-2",
      "m-aliev-atyndagy-orto-mektebi-3",
    ],
  );
  const target = autoIds[0];
  await db.query("insert into public.school_editor_assignments values($1,$2)", [target, editor]);
  await login("authenticated", editor);
  await db.query("select public.save_school_draft($1,0,$2,false)", [target, basicDraft]);
  assert.equal(
    (await db.query("select revision,status from public.schools where id=$1", [target])).rows[0]
      .revision,
    1,
  );
  await db.query("select public.save_school_draft($1,1,$2,true)", [target, untouched.payload]);
  assert.equal(
    (await db.query("select status from public.schools where id=$1", [target])).rows[0].status,
    "review",
  );
  await denied("select public.set_school_archived($1,2,true)", [target]);
  await denied("select public.permanently_delete_school($1,2,$2)", [target, "Basic fixture"]);
  await denied("select public.create_school_auto('Forbidden')");
  await login("anon");
  await denied("select public.create_school_auto('Forbidden')");
  await denied("select public.set_school_archived($1,2,true)", [target]);
  await denied("select public.permanently_delete_school($1,2,$2)", [target, "Basic fixture"]);
  await login("authenticated", admin);
  await db.query("select public.save_school_draft($1,2,$2,false)", [target, payload]);
  await db.query("select public.review_school($1,3,'publish',null)", [target]);
  const childTables = [
    "school_editor_assignments",
    "school_year_stats",
    "school_ort_years",
    "school_achievements",
    "school_ort_resources",
  ];
  const privateRows = async (id) => {
    const result = {};
    for (const table of childTables)
      result[table] = (
        await db.query(`select * from public.${table} where school_id=$1 order by 1,2`, [id])
      ).rows;
    return result;
  };
  const beforeArchive = await privateRows(target);
  const publication = (
    await db.query(
      "select document,published_at from public.school_publications where school_id=$1",
      [target],
    )
  ).rows[0];
  await db.query("select public.set_school_archived($1,4,true)", [target]);
  assert.deepEqual(await privateRows(target), beforeArchive);
  assert.deepEqual(
    (
      await db.query(
        "select document,published_at from public.school_publications where school_id=$1",
        [target],
      )
    ).rows[0],
    publication,
  );
  await denied("select public.review_school($1,5,'publish',null)", [target]);
  await denied("select public.save_school_draft($1,5,$2,false)", [target, payload]);
  await denied("delete from public.schools where id=$1", [target]);
  await login("anon");
  assert.equal(
    (await db.query("select * from public.school_publications where school_id=$1", [target])).rows
      .length,
    0,
  );
  await login("authenticated", editor);
  assert.equal(
    (await db.query("select * from public.schools where id=$1", [target])).rows.length,
    0,
  );
  await denied("select public.save_school_draft($1,5,$2,false)", [target, payload]);
  await login("authenticated", admin);
  await db.query("select public.set_school_archived($1,5,false)", [target]);
  assert.deepEqual(await privateRows(target), beforeArchive);
  assert.deepEqual(
    (await db.query("select status,is_archived from public.schools where id=$1", [target])).rows[0],
    { status: "draft", is_archived: false },
  );
  assert.equal(
    (
      await db.query("select is_published from public.school_publications where school_id=$1", [
        target,
      ])
    ).rows[0].is_published,
    false,
  );
  await denied("select public.permanently_delete_school($1,6,$2)", [target, "Approved fixture"]);
  await db.query("select public.set_school_archived($1,6,true)", [target]);
  await denied("select public.permanently_delete_school($1,7,'wrong name')", [target]);
  await denied("select public.permanently_delete_school($1,6,'Approved fixture')", [target]);
  const otherBeforeDelete = (await db.query("select * from public.schools where id=$1", [school]))
    .rows;
  const otherChildren = await privateRows(school);
  // Fail late, after several child DELETEs, and verify statement-level atomic rollback.
  await db.exec("reset role");
  await db.exec(`create function public.test_block_school_delete() returns trigger language plpgsql as $$ begin raise exception 'isolated failure'; end $$;
    create trigger test_delete_failure before delete on public.school_ort_resources for each row execute function public.test_block_school_delete();`);
  await login("authenticated", admin);
  await denied("select public.permanently_delete_school($1,7,'Approved fixture')", [target]);
  assert.deepEqual(await privateRows(target), beforeArchive);
  assert.equal(
    (await db.query("select * from public.schools where id=$1", [target])).rows.length,
    1,
  );
  assert.deepEqual(
    (
      await db.query(
        "select document,published_at from public.school_publications where school_id=$1",
        [target],
      )
    ).rows[0],
    publication,
  );
  await db.exec("reset role");
  await db.exec(
    "drop trigger test_delete_failure on public.school_ort_resources; drop function public.test_block_school_delete()",
  );
  await login("authenticated", admin);
  await db.query("select public.permanently_delete_school($1,7,'Approved fixture')", [target]);
  for (const table of [...childTables, "school_publications"])
    assert.equal(
      (await db.query(`select * from public.${table} where school_id=$1`, [target])).rows.length,
      0,
    );
  assert.equal(
    (await db.query("select * from public.schools where id=$1", [target])).rows.length,
    0,
  );
  assert.deepEqual(
    (await db.query("select * from public.schools where id=$1", [school])).rows,
    otherBeforeDelete,
  );
  assert.deepEqual(await privateRows(school), otherChildren);
  assert.deepEqual(await existingPolicies(), oldPolicies);
  assert.equal(await adminFunction(), oldAdminFunction);
  assert.deepEqual(await existingGrants(), oldGrants);
  console.log(
    "Basic save/submit, auto slug collisions, archive/restore, authorization, exact-name deletion and atomic rollback tests passed",
  );
  await testEditorAccess({ db, login, denied, admin, editor, school, payload, privateRows });
} finally {
  await db.close();
}
