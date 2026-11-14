# School Editor access - local source, not deployed

Baseline: `feb042178226fc6ab9194623b45b41adabbb3785`.
Existing production School Media migration is `20261113205931_school_media` and school-media v1 is already deployed.
Do not reapply that migration. This implementation adds only the new local
`20261113211506_school_editor_access.sql` migration. No production migration, Auth operation,
function deployment or R2 operation is performed by the local test suite.

## Identity and credentials

Assigned editors use `/school-admin`, a username and an eight-digit PIN, not an email.
The internal namespace is `school-{username}@editors.kara-kulja.invalid`.
The Auth account must have `app_metadata.school_editor_managed=true`, no News marker,
a profile with NULL role, exactly one intended managed school assignment and no News assignment.
Only lowercase 3-40 character alphanumeric/hyphen usernames are accepted; hyphens separate nonempty groups.
Owner/Admin/editor profiles cannot be provisioned as managed School Editors.
Legacy NULL-username assignments retain their existing DB access model; they do not become PIN accounts automatically.

The new **server-only** secret is `SCHOOL_EDITOR_AUTH_PEPPER`. Use a cryptographically random
value with at least 32 bytes of entropy, stored only in Supabase Edge Function Secrets.
No real value belongs in source, migrations, logs, `.env` committed to Git, database or `VITE_*`.
It is separate from `NEWS_EDITOR_AUTH_PEPPER`; rotating it invalidates existing derived credentials,
so plan a reset of managed PINs if it is changed.

The internal password is `Se1!` followed by the full hex HMAC-SHA-256 over
`kara-kulja:school-editor-auth:v1\0{username}:{pin}`. It is 68 ASCII bytes.
The visible PIN cannot be used directly with Supabase email/password authentication.
PINs are shown once after create/reset, live only in component memory, and are cleared on close/unmount.
Only Auth's password hash persists; neither plaintext PIN nor derived password is stored in application tables.

## Authorization and revocation

The database assignment is authoritative, with active status checked in school read/write/media policies.
Managed reads and writes also require the JWT `session_id` to exist in `auth.sessions` for that user.
`can_edit_school` permits review-state reads but archived schools block editor access.
The existing save functions and media registration enforce review-state write restrictions.
Media completion now rechecks active assignment and the exact session supplied by the verified Edge request.
Admin behavior is unchanged.

Reset and disable first make the assignment inactive. Reset updates the derived Auth password;
disable bans the Auth account. Both call the service-only `revoke_school_editor_sessions(schoolId)` RPC,
which resolves the managed user from that school, removes their refresh tokens and deletes sessions.
No caller-supplied Auth user ID is accepted. Enable unbans, revokes any residual sessions and reactivates
the same assignment/account. Reset preserves disabled state. A failed intermediate Auth operation leaves
access inactive, rather than restoring it without confirmed revocation. Admin can retry the operation.
Auth and DB changes do not form one transaction: failed assignment insertion triggers deletion of the newly
created Auth account; if the Auth service itself is unavailable, an unassigned NULL-role account has no school access.

SQL prevents managed School/News assignments from mixing. The managed identity validator checks Auth
app metadata, exact email, profile and assignment structure independently. `user_metadata` is never trusted.
Private media preview, ORT saves and School data all lose authorization after revocation even if a JWT has not expired.
Frontend polling/focus refresh clears lost access and observes Admin return/review changes; DB checks enforce security immediately.

## Login limiter

`editor_access_private.school_login_attempts` is separate from the News limiter and is not exposed to browsers.
Only incorrect Auth credentials spend an allowance; malformed input, absent/disabled/archived identities,
infrastructure failures and successful logins do not spend it. Eight failures lock the username for
15 minutes from the eighth failure. Success clears the failure count unless already locked; late successes
cannot unlock the bucket. All denied login responses use the same generic error.
The login function revalidates identity and current session after Auth sign-in, before returning tokens.
It also compares the assignment's `updated_at` generation before/after Auth sign-in; reset/disable/revoke
change that generation, so an in-flight old-credential login cannot return a session across those operations.
Rejected newly issued sessions are signed out without returning them.

## Future production review/deployment order (NOT executed)

1. Review the new migration, function source, tests and Auth schema compatibility, including `auth.sessions`
   and `auth.refresh_tokens`. Take the normal database backup. Preserve the existing School Media migration history.
2. Configure `SCHOOL_EDITOR_AUTH_PEPPER` only in Edge Function Secrets; retain existing Supabase/R2 secrets.
3. Apply only the new School Editor access migration after approval.
4. Deploy `manage-school-editor-access` with `verify_jwt=true` and `school-editor-login` with `verify_jwt=false`.
   Deploy the updated `school-media` source with `verify_jwt=true` before provisioning managed editors:
   it now passes the verified session ID to media completion. Version 1 cannot attest a managed session;
   the new database wrapper deliberately denies such managed completions until the updated source is deployed.
5. Build/publish the frontend, then provision test school access through Main Admin and validate create/reset,
   old-session revocation, disable/enable, school isolation, review/return/archive and private media.
6. Verify existing News login/media/RLS without changing News secrets or functions.

No bucket needs to be created for this access feature. School Media's private/public R2 architecture is unchanged.
Do not introduce service-role or R2 credentials into frontend configuration.

## Local checks

- `node scripts/test-schools.mjs` includes both media and new access migrations in disposable PGlite.
- `node scripts/test-school-editor-functions.mjs`: HMAC, managed identities, Auth/R2 mocks, limiter/management failures.
- `node scripts/test-school-editor-ui.mjs`: real React login/workspace/access UI with isolated fixtures.
- Existing News Editor, School Media, Admin form/navigation/public suites.
- Deno type-check all three affected School functions, focused ESLint, build/static build and diff check.

The responsive components use existing min-width, wrapping, padding and minimum 44px control conventions.
375px behavior is reviewed through source/jsdom; it is not a real-device or screenshot test.
