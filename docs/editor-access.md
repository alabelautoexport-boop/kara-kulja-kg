# News and School access refinement

Current security correction: [news-editor-pin-derivation.md](news-editor-pin-derivation.md). Visible PINs are no longer Auth passwords: both credential functions use a shared HMAC-SHA-256 helper and require the server-only NEWS_EDITOR_AUTH_PEPPER secret. Per the latest user confirmation all three Schools migrations are already applied in production; News Editor migration is still unapplied. No remote actions were performed in this correction.

Latest pre-production corrections are recorded in [news-editor-preproduction.md](news-editor-preproduction.md): production profile role is NULL, only failed logins count toward throttling, News Editor JWTs require a live Auth session, and media dependencies are pinned. No architecture redesign or remote changes were performed. The file manifest and Git snapshot below describe the preceding consolidated refinement.

Local implementation only. No migrations applied remotely, Edge Functions deployed, or production Auth users provisioned. Existing production school `aliev` is untouched. GA4 and public content are unchanged.

## School workspaces

`/school-admin` has the school name as its heading, editable director/work phones, address in the current editor language, academic year, anonymous ORT years/scores/preview, Save and Submit. The school selector is shown only when multiple assigned schools exist. Names/slug/location and review/publication/lifecycle controls are Main Admin only. ORT academic year is suggested and remains editable. Existing integer 1-300 defensive input validation and all summaries/distribution remain.

Statistics, achievements and ORT resources are frozen in both School Editor and Main Admin forms. Their UI implementation is retained behind a false feature flag for later restoration, their tables/publication support and existing records are retained. Assignment architecture is retained; school-editor account provisioning is not implemented, and the UUID assignment controls are hidden pending the later access-management work.

New migration `20261112222229_schools_active_editor.sql` extends, rather than edits, earlier migrations. The old save function becomes a private, revoked internal writer, now touching only the school record and ORT. The public wrapper retains authorization/revision checks and rejects teacher changes to localized school names as well as the original slug/location restrictions. The three frozen collections receive no DELETE, INSERT or UPDATE, so their complete rows and IDs survive. Even old clients supplying empty/different arrays cannot erase or replace frozen data. Tables, foreign keys, public snapshots, archive and explicit Admin permanent deletion remain available. Permanent deletion deliberately still deletes all target school children after strong confirmation; freezing does not disable that separately authorized lifecycle action.

The frontend calls the versioned `save_school_active_draft` entry point and sends only `info` and `ort`. Until the new migration is applied it fails explicitly; it does not fall back to a legacy destructive save. A single lock/revision transaction protects the same parent for saves, publication, archive and deletion. The already-applied `20261112000000_schools.sql` and unapplied `20261112213822_schools_admin_refinement.sql` are unchanged.

## News authorization

New migration `20261112222231_news_editor_access.sql` adds `news_editor_assignments` (`user_id`, unique `username`, `is_active`, `created_at`), with RLS and Main Admin SELECT only from frontend roles. There are no password/PIN columns. Assignment writes are reserved to service_role in the authenticated Main Admin provisioning function. Editors cannot self-assign or inspect the directory.

`can_manage_news()` uses a fixed search_path and is executable only by authenticated users. It returns Main Admin OR an active News assignment whose user ID/session_id matches a live `auth.sessions` row. Only the News Editor branch requires that session lookup; Main Admin behavior is unchanged. `is_admin()`, its ACL, profiles roles and the public published-News policy are unchanged. Only four existing News management policies use the helper; UPDATE includes both USING and WITH CHECK.

The three dedicated routes are `/news-admin`, `/news-admin/new`, `/news-admin/:id/edit`. `EditorAreaGuard` verifies server-backed access before mounting private News components, observes Auth identity changes and rechecks on window focus. Main Admin routes still use AdminGuard/is_admin. `/school-admin` additionally requires Admin or a school visible under school RLS. A News assignment grants no school scope. The separate route shells do not offer site Admin or Schools links. The News list, editor, feature/publication controls, cover/gallery optimization and media/delete operations are shared with existing Admin News components. The only NewsForm change is its post-create route destination. The only news-media function change is its authorization gate from is_admin to can_manage_news; all R2 operations are unchanged.

AdminGuard now also rechecks the unchanged is_admin-based helper on Auth changes/window focus. Both guards invalidate private News query cache on identity changes; a denied News/Admin check clears it too. This prevents a previously opened privileged UI or cached drafts from remaining displayed after switching to an editor account.

| Account | News management | School private content | Main Admin | Assignments | Publish News | Publish Schools |
| --- | --- | --- | --- | --- | --- | --- |
| Main Admin | Yes | All | Yes | Yes, through authorized management paths | Yes | Yes |
| News Editor | Yes | No | No | No | Yes | No |
| School Editor | No | Assigned school only | No | No | No | No |
| Anonymous | Published News only | Published snapshots only | No | No | No | No |

Permissions are independent explicit grants, never inferred from a site-wide profile role or user-editable metadata. Dedicated News accounts must have an existing profile with role exactly NULL. The prepared management function rejects owner/admin/editor roles, school-assigned targets and accounts not marked as its own managed Auth users.

## Login and PIN

Editors see only Логин / PIN-код / Войти (KG Кирүү). No email field is shown. A server-only deterministic mapping uses `news-${username}@editors.kara-kulja.invalid`. This is an internal, non-deliverable Auth identifier; frontend code does not contain the mapping, and custom Edge responses omit emails/Auth user objects. As with any Supabase account, the authenticated Auth SDK's own user/session APIs may expose that account's identity to its owner; the internal identifier is not treated as a secret or authorization mechanism.

`manage-editor-access` verifies the Bearer JWT with Auth getUser, then calls is_admin using the caller's JWT before privileged operations. Its server-only client creates confirmed Auth users without assigning any site role; the production trigger inserts a profile with role NULL. It generates an unbiased eight-digit PIN with Web Crypto and creates the assignment. Assignment insertion failure compensates by deleting only the just-created user. Existing-target operations require the actual assignment, matching Auth user/email, controlled app_metadata marker, existing NULL-role profile and no school assignments. No user_metadata is trusted for authorization.

The visible PIN is not the Auth password. The server derives a 68-character internal password using HMAC-SHA-256 over the username and PIN with NEWS_EDITOR_AUTH_PEPPER; only that derived password reaches Auth. Neither credential is stored in assignment tables or logs. Only create/reset returns the visible PIN once; the UI retains it only in ephemeral state. Reset deactivates the assignment, updates Auth with the new derived password (terminating existing refresh sessions), then restores its previous active state. `can_manage_news()` checks the live Auth session row, rejecting old JWTs even after reactivation. Main Admin sessions and the existing failure-only limiter are unchanged. A missing pepper fails before Auth password operations; no raw-PIN fallback exists.

`news-editor-login` keeps its public password-exchange endpoint and all username/PIN/user-ID/assignment rechecks. A read-only gate checks the limit before Auth. Only invalid credentials record a failure; successful authentication clears earlier failures. Eight failures lock the username until its 15-minute window expires; even a late in-flight success cannot unlock it. SQL completion locks serialize counter changes. Unknown, disabled, invalid and blocked logins return the same generic public error. Auth service failures do not count as an incorrect PIN. Responses are no-store, and no PIN/body combinations are logged. Gateway JWT verification stays true for management and news-media, false only for login.

## Deployment review, not executed

1. Keep the original applied Schools migration intact.
2. Review/apply the existing unapplied Schools refinement, then the new Schools active-editor migration, then News editor access migration, in timestamp order.
3. Review the new `supabase/config.toml` function settings. Deploy `manage-editor-access`, `news-editor-login` and the authorization-only news-media update only with explicit deployment authorization. Existing server-side Supabase service/public keys are used; no R2 credentials or .env changes are introduced here.
4. Publish the frontend after its required RPCs/functions exist. Before that the new access controls intentionally report unconfigured access instead of falling back to unsafe behavior.
5. Main Admin may then create News Editor access manually and communicate the new PIN separately. No users are created automatically on deployment. School-editor provisioning remains deferred.

No live password login, media upload or production assignment test is claimed: endpoints/migrations have deliberately not been deployed/applied.

## Local verification

- `node scripts/test-schools.mjs` uses a supplied module path or the existing OS-temp PGlite installation. It runs earlier security/integrity tests before testing new additive migrations in a disposable database. Checks include exact frozen-row preservation, names/slug/location restrictions, News CRUD, disabled assignment revocation, self-assignment rejection, matrix isolation, unchanged is_admin/public News policy, service-only throttle, and route guard bindings.
- `node scripts/test-schools-form-ui.mjs` now runs actual SchoolForm SSR assertions and exits. `--serve` additionally opens the isolated browser fixture on 127.0.0.1:8082, with real form/translations and in-memory RPC stubs only. Toggle School Editor/Admin and KG/RU; no Supabase client is imported into this fixture.
- `node scripts/test-news-editor-functions.mjs` bundles the real pure handlers and uses in-memory operations, checking authorization-before-mutation, PIN shape/one-time responses, managed targets, failure compensation, enable/disable ordering, invalid logins, rate-limit denial and returned identity. It also checks no service role/email mapping reaches the frontend and news-media still verifies the JWT.
- `node scripts/test-route-guards-ui.mjs` serves real AdminGuard/EditorAreaGuard with an in-memory Auth/RPC adapter at 127.0.0.1:8083. Browser checks exercised Admin -> School Editor -> News Editor -> disabled News Editor (same user ID) -> anonymous without remounting the guards. Private content matched the matrix and disappeared on identity/revocation changes. No Supabase SDK or production account is used in that fixture.
- Build/static build, focused ESLint and diff checks are run separately. Edge Functions require a later integration test against the reviewed deployment; local tests are not production execution.

## Exact files changed in this refinement

Paths below are relative to `C:/PROJECTS/kara-kulja-legacy-main`. Other pre-existing uncommitted Schools files remain in the working tree and are not new changes in this task. The generated route tree changed because three real News Editor routes were added.

```text
docs/editor-access.md
docs/schools.md
docs/schools-security-review.md
scripts/static-export.mjs
scripts/test-editor-access.mjs
scripts/test-news-editor-functions.mjs
scripts/test-route-guards-ui.mjs
scripts/test-schools-form-ui.mjs
scripts/test-schools.mjs
src/components/admin/AdminGuard.tsx
src/components/admin/AdminShell.tsx
src/components/admin/EditorAreaGuard.tsx
src/components/admin/NewsEditorAccessManagement.tsx
src/components/admin/NewsEditorLogin.tsx
src/components/admin/NewsEditorPages.tsx
src/components/admin/NewsForm.tsx
src/components/admin/NewsList.tsx
src/components/admin/SchoolForm.tsx
src/components/admin/SchoolWorkspace.tsx
src/lib/admin-i18n.ts
src/lib/editor-access.ts
src/lib/editor-auth.ts
src/lib/school-form-validation.ts
src/lib/schools-data.ts
src/routeTree.gen.ts
src/routes/admin.tsx
src/routes/admin_.news.tsx
src/routes/news-admin.tsx
src/routes/news-admin_.new.tsx
src/routes/news-admin_.$id.edit.tsx
src/routes/school-admin.tsx
supabase/config.toml
supabase/functions/_shared/editor-credentials.ts
supabase/functions/manage-editor-access/handler.ts
supabase/functions/manage-editor-access/index.ts
supabase/functions/news-editor-login/handler.ts
supabase/functions/news-editor-login/index.ts
supabase/functions/news-media/index.ts
supabase/migrations/20261112222229_schools_active_editor.sql
supabase/migrations/20261112222231_news_editor_access.sql
```

## Final validation results

- Schools/PGlite suite, including new frozen-data and News access matrix tests: passed.
- School Editor/Admin real-component SSR UI suite: passed.
- News provisioning/login pure handler tests: passed.
- Real guard browser fixture: Admin, School Editor, News Editor, disabled News Editor with unchanged user ID, anonymous passed.
- Browser School Editor: basic save, KG/RU, ORT submit, hidden technical/frozen sections passed.
- Local `/news-admin` login page: login/PIN only, RU/KG passed; no production credentials submitted.
- `npm.cmd run build`: passed.
- `npm.cmd run build:static`: passed, including `/news-admin` and `/news-admin/new` export.
- Focused frontend/Edge ESLint: passed without warnings. Existing `admin-i18n.ts` formatting is preserved; its code rules were checked with prettier/prettier disabled.
- Deno type check of prepared functions and news-media: passed.
- `git diff --check`: passed (only Git LF/CRLF normalization notices).
- Additional application `tsc` still reports the three previously existing errors in MapPoiLayers, VillageMapBlock and villages route; no new error was reported in this refinement.
- Protected hashes (GA4 root, original Schools migration, previous unapplied refinement, untracked backup) match the starting state. No .env or package dependency files were changed. No migrations deployed/applied remotely, no production Auth users created, no commit or push.

Final Git status (pre-existing uncommitted Schools work is intentionally retained):

```text
## main...origin/main
 M scripts/static-export.mjs
 M src/components/admin/AdminGuard.tsx
 M src/components/admin/AdminShell.tsx
 M src/components/admin/NewsForm.tsx
 M src/lib/admin-i18n.ts
 M src/routeTree.gen.ts
 M src/routes/admin.tsx
 M src/routes/admin_.news.tsx
 M supabase/functions/news-media/index.ts
?? docs/editor-access.md
?? docs/schools-security-review.md
?? docs/schools.md
?? scripts/test-editor-access.mjs
?? scripts/test-news-editor-functions.mjs
?? scripts/test-route-guards-ui.mjs
?? scripts/test-schools-form-ui.mjs
?? scripts/test-schools.mjs
?? src/components/admin/EditorAreaGuard.tsx
?? src/components/admin/NewsEditorAccessManagement.tsx
?? src/components/admin/NewsEditorLogin.tsx
?? src/components/admin/NewsEditorPages.tsx
?? src/components/admin/NewsList.tsx
?? src/components/admin/SchoolForm.tsx
?? src/components/admin/SchoolLifecycleActions.tsx
?? src/components/admin/SchoolWorkspace.tsx
?? src/components/site/Schools.tsx
?? src/lib/editor-access.ts
?? src/lib/editor-auth.ts
?? src/lib/people-data_GITHUB_BACKUP.ts
?? src/lib/school-errors.ts
?? src/lib/school-form-validation.ts
?? src/lib/school-ort.ts
?? src/lib/schools-copy.ts
?? src/lib/schools-data.ts
?? src/routes/admin_.schools.tsx
?? src/routes/news-admin.tsx
?? src/routes/news-admin_.$id.edit.tsx
?? src/routes/news-admin_.new.tsx
?? src/routes/school-admin.tsx
?? src/routes/schools.tsx
?? src/routes/schools_.$slug.tsx
?? supabase/config.toml
?? supabase/functions/_shared/
?? supabase/functions/manage-editor-access/
?? supabase/functions/news-editor-login/
?? supabase/migrations/20261112000000_schools.sql
?? supabase/migrations/20261112213822_schools_admin_refinement.sql
?? supabase/migrations/20261112222229_schools_active_editor.sql
?? supabase/migrations/20261112222231_news_editor_access.sql
```
