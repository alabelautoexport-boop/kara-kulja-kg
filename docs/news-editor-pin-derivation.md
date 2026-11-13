# News Editor PIN derivation security correction

No architecture redesign, remote migration, function deployment, production user/secret creation, commit or push. The user confirms all three Schools migrations are already applied; none of those files changed. The News Editor migration remains unapplied and unchanged by this fix. Existing uncommitted work, GA4, People backup and supabase.zip are preserved.

## Shared server-only derivation

`supabase/functions/_shared/news-editor-auth-password.ts` exports `deriveNewsEditorAuthPassword(username,pin)`. It validates canonical username and exactly eight numeric PIN characters, then reads `Deno.env.get("NEWS_EDITOR_AUTH_PEPPER")`. Missing, blank or shorter-than-32-byte pepper causes a generic configuration exception; handlers fail closed and never fall back to the raw PIN.

Web Crypto HMAC-SHA-256 signs UTF-8 `kara-kulja:news-editor-auth:v1\0` followed by `username:pin`, using the pepper as the HMAC key. The non-extractable CryptoKey is used only for signing. The full 256-bit MAC becomes 64 lowercase hexadecimal characters. A fixed `Ne1!` prefix supplies uppercase/lowercase/digit/special character classes. The resulting internal password is 68 ASCII bytes, below bcrypt's 72-byte limit. It is deterministic for the same key/username/PIN, and changes with any of those inputs. The public context prefix is not a secret.

Both management and login handlers import the identical helper. Create and reset generate the existing cryptographic visible PIN, derive the internal password before any Auth credential operation, and pass only the internal password to their Auth adapters. Responses contain only username plus visible PIN. Login validates the human inputs, checks the existing limiter, derives server-side, and passes the synthetic email plus derived password to Auth. Only session tokens are returned on login. No derived password, pepper or internal email is sent to the browser or stored in public tables. No credential values are logged.

## Required production secret (not set in this task)

Before deploying/using the two credential functions, the production owner must create **one strong randomly generated secret of at least 32 random bytes** outside this repository, and store its encoded value only as the Supabase Edge Function secret named **NEWS_EDITOR_AUTH_PEPPER**. Both functions must receive the same production value. Production secret generation, configuration and deployment were deliberately NOT performed here.

Do not place its actual value in source, Git, config.toml, .env, frontend environment, VITE_* variables, browser code, API responses or logs. The tests use a clearly labelled fixed public fixture in a mocked Deno environment; it is not a production key and must never be reused for deployment.

Use the same stable value while these credentials are in use. Rotating it requires coordinated Admin PIN resets to replace the stored Auth passwords under the new derivation; changing the secret alone does not revoke existing sessions. Any earlier development/staging account created with a raw-PIN password needs an Admin reset before using this version. No automatic account conversion or production mutation is included.

## Existing protections retained

NULL-role managed-account checks; owner/admin/editor rejection; no school assignment; matching Auth ID, synthetic email and app_metadata marker; active assignments; JWT session_id/live auth.sessions validation; reset deactivation and Auth session invalidation; eight failed attempts and 15-minute window; successful-login counter clearing; generic public errors; no username enumeration in public responses; unchanged Main Admin and independent School Editor access. The crypto PIN generator, media operations, dependency pins and JWT configuration are unchanged.

## Exact files changed in this task

Paths relative to C:/PROJECTS/kara-kulja-legacy-main:

```text
supabase/functions/_shared/news-editor-auth-password.ts
supabase/functions/manage-editor-access/handler.ts
supabase/functions/news-editor-login/handler.ts
scripts/test-news-editor-functions.mjs
docs/editor-access.md
docs/news-editor-preproduction.md
docs/news-editor-pin-derivation.md
```

## Regression verification

Tests exercise the actual shared Web Crypto helper and real create/reset/login handlers with an isolated Auth adapter, never production Auth. An independent Node HMAC calculation verifies the derivation. Binding to username, PIN and pepper is tested. A captured Auth account password differs from the returned human PIN; direct authentication with the raw PIN is rejected, authentication with the derived password succeeds, and normal username/PIN login through the handler succeeds. Reset changes the internal password, old PIN fails, new PIN succeeds, and responses contain no internal password. Missing/weak pepper prevents create/reset/password authentication without returning a PIN, changing active state, or counting a configuration failure as a bad PIN. Existing role, throttle, reset-session and media-gate tests remain.

No live Supabase password attempt was made, because creating production users and deploying functions are explicitly out of scope. SQL/PGlite tests still verify real session-authorization and limiter SQL in an isolated database.

## Final results

- News/security handler suite including explicit direct-Auth-bypass regression: passed.
- Existing Schools/PGlite SQL/security suite and School form SSR checks: passed.
- Deno type-check of manage-editor-access, news-editor-login and news-media: passed.
- Focused ESLint for the changed Edge TypeScript files: passed.
- `npm.cmd run build`: passed.
- `npm.cmd run build:static`: passed.
- `git diff --check`: passed (existing LF/CRLF notices only).
- Final client assets contain neither NEWS_EDITOR_AUTH_PEPPER references nor the HMAC derivation context.
- All three applied Schools migrations, the unapplied News migration, routeTree, GA4 root and People backup have the same starting/final hashes. No SQL migration or config.toml changed in this task.
- Git remains `main...origin/main`, with existing and new uncommitted work; staging is empty. People backup and the pre-existing supabase.zip remain untracked and untouched. No production secret was generated/set, no real Auth users created, no function deployed, no remote SQL applied, and no commit/push occurred.
