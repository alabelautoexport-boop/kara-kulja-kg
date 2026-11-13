# Schools - local review

## Current access/UI decision

The latest decision freezes statistics, achievements and preparation resources in both workspaces, simplifies the teacher form and defers school-account provisioning. Their records remain intact, including IDs, via the new additive `20261112222229_schools_active_editor.sql` migration and versioned save RPC. Earlier applied and unapplied migrations remain unchanged. News now has independent access preparation. See [editor-access.md](editor-access.md) for the current architecture, deployment order and test commands. The notes below describe earlier implementation stages; the new freeze rule supersedes editing those three collections.

## Additive Admin refinement (12 November 2026)

The user reports `20261112000000_schools.sql` is already applied in production and a real draft school `aliev` exists. That migration and school are untouched. The following migration is **local only, not remotely applied**: `20261112213822_schools_admin_refinement.sql`. Review it before deployment. No production requests or fixture changes are needed for the isolated tests.

- Save diagnosis: `parseOrtScores("")` returned an invalid token; adding an otherwise empty ORT row disabled both save controls. Native required/pattern validation in optional rows could prevent `onSubmit` or `reportValidity` from reaching the RPC. A successful refresh changed the form's revision key and unmounted it before its success message could survive. These are reproducible code paths, not an assertion about exactly which fields were present in the production user's form.
- Form validation is explicit and visible. Save and submit both prepare a payload using `school-form-validation.ts`, then call the same existing draft RPC. Fully empty optional rows are omitted. ORT defaults alone do not count as entered data; modifying a new row's fields marks it entered. Partial rows are rejected with section/row details; invalid score tokens are listed. Buttons are not silently disabled by score validation. `noValidate` avoids native validation swallowing submit before the visible error summary.
- After successful RPC and server reload, the workspace (outside the revision-keyed form) retains the success message. The record/revision/status refresh without creating a second school. No ORT, achievement, resource or yearly-stat data is required for basic save or submission.
- ORT rows are added explicitly. Academic year defaults to exam year minus one through exam year, and remains editable. Editing an automatically suggested year updates it; an independently edited academic year is preserved. The six sample scores are only a placeholder. Live summaries include minimum. Existing-year removal is a text action with confirmation. Empty, untouched new blocks show no red warning and can be removed with a text action.
- School creation calls Admin-only `create_school_auto(name)`: same KG/RU transliteration convention as News, lowercase ASCII slug, 96-character base, fallback `school`. Unique-index-backed `INSERT ... ON CONFLICT DO NOTHING` retries with `-2`, `-3`, etc., including concurrent inserts. Admin can still change the slug afterward; editor identity/location restrictions remain server enforced. Initial creation has no manual slug input. This new creation RPC needs the reviewed additive migration; there is no unsafe client-side fallback.
- `is_archived` / `archived_at` are additive. Admin archive hides the approved snapshot while preserving its document/publication timestamp and all private data/assignments. Existing content FKs remain RESTRICT. A trigger prevents existing save/review RPCs from modifying an archived school and rolls back an attempted archived publication. Assigned editors cannot read/edit archived private records. Restore resets to draft, leaves the snapshot hidden and requires explicit review/publication; it never republishes automatically.
- Permanent deletion is available only for archived schools to Admin. The dialog requires the exact KG school name. The RPC independently checks Admin, existence, revision, archived state and exact name, locks the parent, explicitly deletes assignments, stats, ORT, achievements, resources, publication, then the school, in one atomic statement. No direct DELETE grant on schools. A test deliberately fails after earlier child deletions and verifies complete rollback; other schools stay unchanged.
- Existing snapshots are a current approved document, not an immutable version-history ledger. Archive preserves all publication data the existing architecture stores; no new history ledger is claimed.

The tests below now apply both migrations to disposable PGlite only and additionally cover payload preparation, basic save/submit, generated slugs/collisions, lifecycle authorization, preservation and rollback. The original review/deployment notes below describe the initial implementation; the already-applied migration must not be replayed remotely.

An additional isolated browser fixture is available after a build: `node scripts/test-schools-form-ui.mjs`, then open `http://127.0.0.1:8082`. It bundles the real form/translations with in-memory Schools RPC and territory stubs, never imports the Supabase client or production school data, and serves only on loopback. It supports basic save/submit, empty/partial/valid ORT, forced RPC failure, language switching, archive/restore and exact-name confirmation checks. Stop it with Ctrl+C. It is not a public route or production asset.

## Scope and routes

- `/schools`: approved schools, optional territory/village filters once data exists.
- `/schools/:slug`: general information, four yearly indicators, aggregate ORT results and trends, achievements, preparation resources.
- `/school-admin`: existing Supabase Auth session, separate restricted KG/RU workspace and login.
- `/admin/schools`: existing AdminGuard, school creation, review/publication, assignments by existing Auth user's UUID.
- No header/footer navigation change. No school seed, uploads, history, coordinates, student directory, ranking, or YouTube feature.
- Public KG/RU/EN uses `useI18n`, localized field fallback to KG, and the existing structured missing-value helper. Admin uses `useAdminI18n`.

## Existing foundation inspected

The checked-in foundation migration restricts `profiles.role` to `user` and `admin`. Existing `is_admin()` and AdminGuard/News policies remain unchanged. No new role is needed: school assignments grant scope, not site-wide privileges. The live remote schema was NOT altered or assumed to match without later deployment review. Supabase client types follow the existing manually maintained News interface pattern; no generated database type file exists.

## Migration (not remotely applied)

`supabase/migrations/20261112000000_schools.sql` creates:

1. `schools`: private workspace general information, Admin-managed canonical slug and location, current academic year, revision, review status/note.
2. `school_editor_assignments`: Auth user ID + school ID. Only site Admin can insert/delete assignments; editors can only read their own.
3. `school_year_stats`: one row per school/academic year, nullable student/teacher/Grade 11 counts.
4. `school_ort_years`: school, calendar year, associated academic year, private numeric JSONB `scores` array.
5. `school_achievements`: localized title/description, date, optional simple category.
6. `school_ort_resources`: localized title/description, type, optional HTTP(S) URL, year/source. File URLs work as ordinary links; no new upload/storage backend.
7. `school_publications`: explicitly approved public-safe JSON snapshot, visibility, publication timestamp. No raw score arrays.

No changes to profiles, Auth triggers, is_admin, News, existing RLS, Storage, R2, Edge Functions or secrets. No remote migration commands run.

## Authorization and workflow

- Private tables grant SELECT only to authenticated users, constrained by `can_edit_school` RLS (assigned school or existing Admin).
- Workspace mutations go through the security-definer `save_school_draft` RPC with explicit assignment/Admin verification and fixed search_path. There are no direct workspace write grants.
- `create_school` and `review_school` explicitly require existing `is_admin()`; no school-editor create/delete/publish permissions.
- Slug and territory/village changes are Admin-only in `save_school_draft`; the editor form makes location read-only. Admin slug/location changes stay private until republished. A missing school UUID is rejected, not silently accepted.
- Editor can save draft or submit review. Review locks editor writes until Admin returns corrections or publishes. Revision checks reject stale/NULL revisions; each save is atomic.
- Saving changes after publication leaves the old approved snapshot unchanged. Draft changes are never instantly public. Publishing rebuilds a snapshot from normalized server rows and server-derived ORT summaries. Returning changes retains any last approved snapshot; unpublish explicitly hides it.
- Only published snapshots are visible to anon. Authenticated editors can also see published snapshots, but not hidden ones. Only Admin can read hidden snapshots.
- Removing an assignment immediately revokes server access; switching Auth accounts clears local workspace state. Existing News login remains Admin-only. School login never changes roles or uses service credentials.
- User accounts must already exist in Supabase Auth. Account creation/invitation and user directory management are deliberately not added.
- Important school-linked data uses `ON DELETE RESTRICT`: school deletion cannot silently cascade through stats, ORT years, achievements, resources or publications. Assignment links alone retain cascade cleanup. Unpublish is the normal non-destructive action.
- Explicit table revokes cover PUBLIC as well as anon/authenticated. A partial published-slug index supports public listing queries. Detailed table/policy/grant review: [schools-security-review.md](schools-security-review.md).

## ORT validation and calculation

`src/lib/school-ort.ts` provides immediate browser preview. `school_ort_summary` computes authoritative publication values in PostgreSQL. No editor-entered average is trusted or stored.

- Plain decimal integer tokens separated by spaces, commas, semicolons or newlines. Repeated spaces are formatting, but explicit empty comma/semicolon/line items, including a trailing separator/blank line, are invalid. An empty or whitespace-only input is invalid.
- If any token is invalid, no partial score array or aggregate preview is returned; saving/submitting is blocked until the whole list is corrected. The calculator rejects invalid numeric inputs instead of silently filtering them. Zero, negative, fractional, nonnumeric, nonfinite and above-limit values are rejected. Server validates numeric JSON elements, not numeric strings, and the transactional save rolls back the entire submission on any invalid score.
- **1-300 is a defensive application input range, NOT an authoritative ORT maximum or passing score.** Both layers enforce the same guard; SQL also limits each year's array to 10,000 values and the RPC payload to 2 MB. The editor asks for the actual certificate score, without presenting a technical ceiling as an official maximum.
- Mean = sum/count, rounded to 2 decimal places; standard sorted odd/even median; min/max; participant count; count >=200; seven nonoverlapping ranges up to109, 110-129, 130-149, 150-169, 170-189, 190-199, 200+.
- A year with no score entries cannot be saved: remove that ORT-year row if results are not available. Having no ORT years is allowed. The pure calculator still represents an empty collection with zero participants/counts and NULL mean/median/min/max, but the editor never previews or saves an empty year's array.
- Public current-year participants are matched by academic year, not inferred from a different year's exam.
- No student identity fields are accepted or stored. Free-text achievements/resources must still be checked by Admin for personal information before publication. No automated name detector is claimed.
- Optional teacher subject breakdown is not required and is deferred; the total teacher metric is implemented.

## Verification

`scripts/test-schools.mjs` transpiles the pure TS calculator using existing TypeScript and runs local assertions. It then uses a supplied external PGlite package path to apply the existing foundation (without Storage) and the Schools migration in a disposable in-memory PostgreSQL database. PGlite is test-only, installed in the OS temporary directory, NOT added to application dependencies. No credentials or remote connections are used.

Example (PowerShell):

```powershell
npm.cmd install --prefix "$env:TEMP\kara-kulja-schools-db-tests" --no-save --no-package-lock @electric-sql/pglite
node scripts/test-schools.mjs "$env:TEMP\kara-kulja-schools-db-tests\node_modules\@electric-sql\pglite\dist\index.js"
```

Assertions cover boundaries, parsing, empty/even medians, JS/SQL aggregate parity, anonymous SELECT denial for raw scores/workspaces, assignment isolation, role escalation/News/create/publish/direct-write denial, stale revisions, review lock, snapshot isolation after further edits, unpublish and assignment removal. Existing Admin/News policies are exercised from the checked-in foundation. Browser checks use temporary local-only fixtures (removed before final build), not seeded records. Real Auth/editor/Admin integration must still be tested on a reviewed staging database after migration approval.

Before publishing: review the migration and validation guard, apply to staging separately, create real schools/editor assignments, test at least two assigned users plus one unassigned user, review the public snapshot for identifying text, then plan production migration/deployment explicitly. Until then public routes report unavailable data and admin operations cannot succeed on the unmigrated remote database. Dynamic school URLs use the existing Fornex SPA rewrite; only `/schools` and admin entry routes are statically exported with an empty seed.
