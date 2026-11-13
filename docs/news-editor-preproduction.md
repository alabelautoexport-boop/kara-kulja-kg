# News Editor pre-production correction

Subsequent credential correction: [news-editor-pin-derivation.md](news-editor-pin-derivation.md). The human PIN is now converted server-side to an HMAC-derived Auth password. The role/session/throttle checks described below remain in force. All three Schools migrations have since been confirmed applied by the user; the News migration is still unapplied.

All changes remain local and uncommitted. No migration applied remotely, Edge Function deployed, real Auth user created, or production data modified. GA4, the untracked People backup and prior Schools work remain untouched.

## Root cause and role correction

The previous implementation inferred `profiles.role = 'user'` from the historical checked-in foundation migration. The user confirmed production has owner/admin/editor/NULL and its new-user trigger leaves role NULL. That mismatch would reject dedicated newly created News accounts during reset/enable/disable.

`isManagedNewsEditor` now requires all of: actual assignment, matching Auth user ID, expected synthetic email, trusted app_metadata marker, existing profile with role strictly NULL, and no school assignments. owner/admin/editor/user/undefined roles are rejected. No profile role is assigned or added, no production role constraint or is_admin function is changed.

## Failed-login accounting

The still-unapplied `20261112222231_news_editor_access.sql` is corrected in place; no new migration was created.

- `can_attempt_news_login` checks active assignment and whether eight failures block the current 15-minute window. It does not increment a counter.
- Auth `invalid_credentials` calls `finish_news_login_attempt(username,false)`, recording one failure.
- Successful Auth plus matching returned user and active-assignment recheck calls the same completion function with true, clearing previous failures to zero. Successful logins never consume failure allowance.
- The stable counter row is locked at completion to serialize updates. Eight failures block subsequent authentication until window expiry; a late success cannot clear an already blocked bucket. The first failure starts the window. Expired buckets reset normally.
- Auth availability/rate-limit errors do not count as incorrect PINs. All public unknown/disabled/blocked/invalid cases retain the same generic 401 response. No PINs or username/PIN combinations are logged.
- These controls supplement normal Supabase Auth rate limits. Already-in-flight Auth requests cannot be retroactively stopped, but a successful completion cannot unlock a bucket which became blocked concurrently.

## Reset and live sessions

Current official Supabase documentation maps each JWT `session_id` to `auth.sessions` and recommends checking the row when an old access JWT must become unusable immediately: [User sessions](https://supabase.com/docs/guides/auth/sessions#how-to-ensure-an-access-token-jwt-cannot-be-used-after-a-user-signs-out).

Verified current Auth implementation: Admin password update calls `user.UpdatePassword(tx,nil)` in [admin.go](https://github.com/supabase/auth/blob/master/internal/api/admin.go); the nil-session branch calls `Logout` for all of that user's sessions in [user.go](https://github.com/supabase/auth/blob/master/internal/models/user.go). This terminates existing refresh sessions. This is verification of the current documented/source contract, not a claim that production Auth was invoked or its deployed build inspected.

The reset flow remains deactivate -> Auth Admin password update -> restore previous active state. No new Auth-secret queries or direct writes to auth.sessions were added. The News assignment branch of `can_manage_news` now requires both current user ID and JWT session_id to match an existing Auth session. Missing, removed, malformed or another user's session is denied. An old JWT cannot borrow a new session of the same user. Thus deleting sessions on reset rejects old News tokens even after immediate re-enable; a new PIN sign-in creates a new live session and works immediately.

The Main Admin branch still delegates unchanged to is_admin and is not subjected to the News session rule. No SELECT on auth.sessions is granted to frontend roles. The fixed-search-path SECURITY DEFINER function reads only session IDs/user IDs internally; no Auth secrets are returned. News RLS, frontend access checks and news-media all use the same authorization helper.

## Configuration and dependency evidence

`news-editor-login.verify_jwt=false`, `manage-editor-access.verify_jwt=true`, `news-media.verify_jwt=true` are explicit in config.toml. Cryptographic eight-digit PIN generation is unchanged.

All three functions now pin Supabase JS to `2.118.0`. news-media pins `@aws-sdk/client-s3` to `3.1167.0`. The S3 version was read from the actual Deno resolved graph with `deno info --json` before editing, and matches the previous local type-check's cached resolution. The floating Supabase @2 had meanwhile resolved to 2.119.0; it was pinned back to the specifically required, tested 2.118.0. No versions were guessed. No app dependency/package/lock files changed.

## Exact files changed in this correction

Paths relative to `C:/PROJECTS/kara-kulja-legacy-main`:

```text
docs/editor-access.md
docs/news-editor-preproduction.md
scripts/test-editor-access.mjs
scripts/test-news-editor-functions.mjs
supabase/config.toml
supabase/functions/_shared/managed-news-editor.ts
supabase/functions/manage-editor-access/index.ts
supabase/functions/news-editor-login/handler.ts
supabase/functions/news-editor-login/index.ts
supabase/functions/news-media/index.ts
supabase/migrations/20261112222231_news_editor_access.sql
```

## Regression coverage

The real managed-account predicate is exercised with NULL, owner/admin/editor/other roles, missing profile/Auth user/assignment, mismatched email/marker and school assignment. Handler tests exercise repeated successful logins, bad PIN counting, clearing, blocked calls avoiding Auth, generic unknown-name response equality, reset ordering and new-PIN sign-in. The actual news-media JWT/RPC gate is bundled with isolated SDK adapters and tested for Admin, active News Editor, School Editor, disabled News Editor and removed News session.

PGlite tests model the confirmed nullable production role contract only in disposable fixture setup. They exercise actual migration SQL, exact is_admin definition/ACL preservation, live session/user matching, old JWT rejection after simulated Auth session removal, fresh-session acceptance, disabled-account denial, Main Admin/School Editor isolation, failure-only SQL accounting and expiry. No Auth sessions or users are changed remotely. R2 operation source remains byte-identical to HEAD after normalizing only authorization, test export and dependency pins.

## Final validation

- `node scripts/test-news-editor-functions.mjs`: passed, including all new role/PIN/throttle/reset/media cases.
- `node scripts/test-schools.mjs`: passed against disposable local PGlite, including real SQL session and failure-counter regression cases.
- `node scripts/test-schools-form-ui.mjs`: passed.
- Deno type-check for manage-editor-access, news-editor-login and news-media: passed with exact pinned packages.
- Focused ESLint on the changed Edge TypeScript files: passed without errors/warnings.
- `npm.cmd run build`: passed.
- `npm.cmd run build:static`: passed.
- `git diff --check`: passed; only existing LF/CRLF normalization notices.
- Starting hashes still match for routeTree.gen.ts, GA4 root, original Schools migration, previous Schools refinement and People backup. No frontend source, .env or app package files changed in this correction.

Final Git state: `main...origin/main`, no staged files, the existing and new Schools/News work remains uncommitted. The People backup remains untouched and untracked. No commit/push, remote migration, function deployment or real Auth-user creation occurred.
