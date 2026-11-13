# Schools migration security review

## Current freeze/access follow-up

`20261112222229_schools_active_editor.sql` preserves the exact dormant rows by removing their DML from the active save path, for both Admin and school editor. The internal writer is revoked from frontend roles; both save entry points retain permission/revision checks and teacher identity restrictions. `20261112222231_news_editor_access.sql` changes only News management authorization, preserves is_admin and public News reading, and grants no school scope. All changes remain local. Current details and limitations: [editor-access.md](editor-access.md).

## Additive follow-up

Production application of `20261112000000_schools.sql` is now confirmed by the user. The original file remains unchanged. `20261112213822_schools_admin_refinement.sql` adds archive support, guarded updates, collision-safe automatic creation and an Admin-only atomic deletion RPC. This new migration has only been tested locally with PGlite and has NOT been applied remotely. The real production school `aliev` has not been accessed or changed by the automated tests.

The follow-up retains all table grants and RLS policies, existing `is_admin()` and News policies/ACLs, and all RESTRICT FKs. It updates only the Schools-specific access helper to exclude archived schools from editor scope. New RPCs independently verify Admin and are executable only by authenticated users, with internal helpers revoked from PUBLIC/anon/authenticated. Archive flips the existing snapshot visibility in the same parent-locking transaction. The archive update trigger prevents the old save/review RPCs from republishing or modifying archived records. Restore requires subsequent explicit publication. Permanent deletion requires archive, matching revision and exact name, explicitly deletes children before the parent, and has tested atomic rollback. Direct school deletion remains forbidden to frontend roles.

The original review follows as historical context; its staging recommendation is not an instruction to reapply an already-applied migration.

## Decision and scope

The corrected migration passes isolated PostgreSQL/PGlite checks and is suitable for the next **reviewed staging deployment** as a one-time migration. This is not an unconditional production certification: production schema/role membership were not queried. Confirm the existing `profiles`, `auth.users`, `auth.uid()` and `is_admin()` contract against staging/production before an explicitly authorized deployment. No remote database, users, assignments, school records, Storage or Edge Functions were changed during this review. No commit/push.

Reviewed the entire Schools migration, both existing checked-in News migrations, `schools-data.ts`, AdminGuard, Admin auth and the school editor form. The existing role constraint remains `user`/`admin`; assignment scope is separate from site-wide Admin privileges.

## Findings fixed

1. **Editor identity/location mutation:** `save_school_draft` previously allowed an assigned editor to change territory/village. The RPC now rejects non-Admin slug/location changes with SQLSTATE 42501, including clearing an existing assignment. The form disables editor location controls. Admin can manage these fields.
2. **Destructive parent cascades:** five historical/content FKs formerly cascaded school deletion. They now use `ON DELETE RESTRICT`. Even owner-level deletion fails while related records exist; unpublish preserves data. Any future hard deletion requires an explicit reviewed archival/removal procedure.
3. **Missing Admin slug-management path:** the private draft API/form now supports an Admin-only slug change, constrained by the existing unique slug/format checks. Published slug/data stays unchanged until an Admin publish, preserving the snapshot model.
4. **Silent save for missing school:** an Admin save to an unknown/null school UUID now raises `School not found` before mutation.
5. **Inherited privilege hardening:** table REVOKE now also covers PUBLIC. Tests simulate broad default PUBLIC privileges and confirm they do not leak SELECT, write or TRUNCATE access. This is defense against inherited defaults, not a claim that production had such grants.
6. Added a partial `(slug) WHERE is_published` publication index for the actual public listing/filter path.

No public layout, route, News behavior, Admin role, `is_admin()` definition/grant, GA4, R2 or existing policies changed. No new tables were needed for these corrections.

## Table integrity

| Table | Primary/unique keys | FKs and delete rules | Fields, indexes, timestamps |
| --- | --- | --- | --- |
| schools | UUID PK; unique format-checked slug | No user ownership FK; access is by assignments | Required nonblank KG name; RU/EN, phones, director, address and location optional. Territory/village are canonical slugs into the existing TS catalog, not SQL FK-backed catalog tables. Admin UI restricts village options by territory; trusted Admin must verify canonical pairing. Current academic year is nullable YYYY-YYYY; status constrained; created_at default; updated_at and revision advance in every successful save/review RPC. Location composite index. |
| school_year_stats | (school_id, academic_year) PK | schools RESTRICT | One school/year; nullable nonnegative integer student/teacher/Grade 11 counts. PK covers school query/FK lookup. |
| school_ort_years | (school_id, ORT calendar year) PK | schools RESTRICT | Academic year required; numeric JSONB scores must contain 1-10,000 integer values in technical range 1-300; invalid/null/nested/string/boolean items reject the whole transaction. PK covers school query/FK lookup. |
| school_achievements | UUID PK | schools RESTRICT | Required date, nonblank KG title/description; optional translations/category. School index. Repeated titles/dates are not a reliable natural key, so no arbitrary uniqueness on content. |
| school_ort_resources | UUID PK | schools RESTRICT | Required KG title/type; optional description, HTTP(S) URL, year/source/translations. School index. Reusing a document URL is permitted. |
| school_editor_assignments | (school_id, user_id) PK | schools CASCADE; auth.users CASCADE | Duplicate assignments rejected. PK indexes school_id; separate user_id index. Deleting an Auth account removes access links only, never school results. |
| school_publications | school_id PK; unique slug | schools RESTRICT | Required approved document/visibility; published_at advances only on publish. Unique slug and partial published-slug index. Unpublish changes visibility and school revision/updated_at, not the last publication date. |

The private child tables are **workspace rows atomically replaced by save**, not an independent historical audit ledger. Their change timestamp is the parent school's updated_at/revision committed in the same transaction; duplicating updated_at on replace-only child rows is unnecessary. Assignment links have no separate audit timestamp. There is no immutable publication-version history: the current approved snapshot remains stable until the next Admin publication. No such extra tables were introduced. Academic-year checks validate the existing YYYY-YYYY format; they do not infer a missing year or enforce a new district calendar convention.

## All RLS policies and operation paths

All seven tables have RLS enabled. There is no public-safe SECURITY DEFINER view: public reads use an approved snapshot table instead.

| Table | SELECT policies / USING | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| schools | `schools_private_read`: authenticated `can_edit_school(id)` | No client grant/policy; Admin `create_school` RPC only | No client grant/policy; authorized save/review RPC only | No client grant/policy, including Admin UI; unpublish instead |
| school_year_stats | `stats_private_read`: authenticated `can_edit_school(school_id)` | No client grant/policy; authorized save RPC | No client grant/policy | No client grant/policy; replacement inside authorized save RPC |
| school_ort_years | `ort_private_read`: same assigned/Admin scope | Same as stats | Same as stats | Same as stats |
| school_achievements | `achievements_private_read`: same assigned/Admin scope | Same as stats | Same as stats | Same as stats |
| school_ort_resources | `resources_private_read`: same assigned/Admin scope | Same as stats | Same as stats | Same as stats |
| school_editor_assignments | `assignments_read`: own user_id or Admin; `assignments_admin` additionally permits Admin | Authenticated table grant, but `assignments_admin` WITH CHECK requires is_admin | No UPDATE grant; `assignments_admin` also has is_admin USING/WITH CHECK, so no reassignment loophole | Authenticated grant but `assignments_admin` USING requires is_admin; editor delete affects zero rows |
| school_publications | `publications_approved_read`: anon/authenticated is_published; `publications_admin_read`: authenticated is_admin for hidden snapshots | No client grant/policy; Admin publication RPC only | Same | No client grant/policy |

For private data tables there is deliberately no permissive UPDATE policy/WITH CHECK: the table write capability is absent altogether. In the save RPC, every child `school_id` is the independently authorized `p_school_id`. Payload child IDs, parent IDs and injected school_id fields are not trusted or copied. Direct FK UPDATE attempts fail; passing another school's UUID to the RPC fails; injected payload FKs cannot move records. Editors cannot create/delete schools, self-assign, delete assignments, promote themselves, publish or write News.

## SECURITY DEFINER and grants

- `can_edit_school`: stable SECURITY DEFINER, fixed search_path public, fully qualified public tables/functions and auth.uid. Authenticated EXECUTE only; returns assignment/Admin scope, not private records. Temporary relation shadowing is tested and cannot forge assignments.
- `create_school`: SECURITY DEFINER, same safe namespace; existing `is_admin()` check before insert. Slug/name constraints apply.
- `save_school_draft`: SECURITY DEFINER, same safe namespace; explicit authorization, payload-size/type/revision checks, row lock, missing-row rejection, review lock and protected identity/location guard. Known fields only; each replacement is transactional. Unknown extra payload fields cannot set role, publication status, revision or FK identity.
- `review_school`: SECURITY DEFINER, same safe namespace; is_admin check, school row lock, exact revision and action validation. Builds the approved projection and server ORT summaries, never the scores array.
- `valid_school_ort_scores` / `school_ort_summary`: immutable invoker helpers; EXECUTE revoked from PUBLIC/anon/authenticated. Publication's privileged RPC uses the helpers after table validation.
- All table privileges explicitly revoked from PUBLIC/anon/authenticated before narrowly granting SELECT, and INSERT/DELETE on assignments only. Private tables are not readable by anon. No app role has direct workspace/publication writes or TRUNCATE. Service/owner maintenance roles are privileged by design and must never be exposed in the client.
- Existing is_admin EXECUTE ACL, definition, profiles/News table ACLs and policies are compared before/after migration in the test database and remain identical. Existing AdminGuard and Admin login continue requiring is_admin; the editor is an ordinary Auth user, not an Admin role.

## Public API and publication safety

`getPublishedSchools` and `getPublishedSchool` select only `school_id, slug, document, published_at` from school_publications with is_published=true. RLS independently enforces visibility if the client drops that filter. No public query needs private score rows or helper RPC access. Profile, yearly stats, aggregates, achievements and resources are all from the last approved snapshot. New draft and review content cannot overwrite it. Returning changes retains any last approved snapshot; unpublish explicitly hides it.

The current SQL profile/content projection uses `to_jsonb` with explicit removal of private control/FK columns, while ORT uses an explicit summary-only projection. The current schema is safe; future additions of private columns must also update/review the publication projection instead of assuming new columns are private automatically.

Raw ORT data has numeric scores only, no student identity columns. Server aggregate parity tests cover participant count, rounded mean, odd/even median, min/max, 200+ and all boundaries 109/110,129/130,149/150,169/170,189/190,199/200. Every valid score belongs to exactly one bucket. Range 1-300 is a defensive input guard only; 110 is not declared an official passing mark.

Free-text moderation remains necessary: an Admin must reject identifying student text in achievements/resources. Aggregates for very small cohorts may reveal a score (particularly maximum or a singleton average); any future small-cohort suppression policy requires a separate product/privacy decision, not an invented rule in this migration.

## Local checks and deployment prerequisites

The existing PGlite suite is expanded to cover all 20 requested scenarios, plus PUBLIC default privileges, helper EXECUTE denial, unchanged News/Admin ACL/policies, temp-schema shadowing, identity/location restrictions, Admin slug/location changes, whole-document snapshot stability during review, correction return, unpublish, revocation, NULL indicators, missing UUID, parent-delete restriction, Auth-account cascade isolation and timestamp/revision behavior. Fixtures exist only in a disposable in-memory DB. No production users, schools or assignments were created.

Run with the local test-only PGlite installation described in schools.md; application dependencies are unchanged. The migration is transactional and follows one-time Supabase conventions: a second run should fail instead of overwriting an existing installation. There are no unrelated DROP/ALTER/INSERT statements against production News/profiles/Storage content. Do not apply remotely as part of this review. First compare the live foundation contract, review the new DDL and grants, then obtain separate staging/production deployment approval.
