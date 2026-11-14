# School Media - local implementation, not deployed

Baseline: `feb042178226fc6ab9194623b45b41adabbb3785`.
The migration and `school-media` function must be reviewed and deployed separately.
No bucket, credential, user, migration or function is created remotely by this implementation.

## Configuration

Server-only function environment names:

- `SCHOOL_MEDIA_PRIVATE_BUCKET`: an actually private R2 bucket, with public access disabled.
- `R2_BUCKET_NAME`: existing public media bucket; must differ from the private bucket.
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- Standard Supabase function variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

For production review: existing public bucket is `kara-kulja-media`; recommended private bucket is
`kara-kulja-schools-private`, configured as `SCHOOL_MEDIA_PRIVATE_BUCKET=kara-kulja-schools-private`.
The private bucket must have neither a public custom domain nor public `r2.dev` access enabled.
The R2 API token needs Object Read + Write permission for both buckets. Keep
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` server-only;
never place R2 credentials in `VITE_*` variables. This document does not create buckets or secrets.

Never prefix private credentials with `VITE_`. Never put real values into source or this document.
The frontend uses the existing public Supabase configuration only.
Published media base remains `https://media.kara-kulja.kg`.

## Data and lifecycle

`school_media` is private, RLS-protected and has no browser INSERT/UPDATE/DELETE grants.
Assigned editors may register uploads only while their school is neither archived nor under review.
Admin can authorize uploads for any existing school, but the Admin UI remains read-only.
The server inspects both WebP variants, writes immutable private objects and attests their metadata through a service-only RPC.
It rechecks the actual actor's assignment/role and school state at completion.

An upload does not alter the current draft selection. The editor's Save/Submit sends only selected asset IDs;
the SQL transaction validates ownership, kinds, readiness, uniqueness, ordering and gallery limit, then updates references together with school information/ORT.
Omitting `media` preserves references for old clients and Admin identity saves.
Failed/abandoned uploads remain private and are eligible for collection after 48 hours.

`review_school` uses explicit public info fields and explicit media descriptors.
The snapshot contains only approved cover/gallery keys and dimensions, never hashes, upload state, filenames, EXIF/GPS, user identity or raw ORT arrays.
Existing publications without media remain valid.

Admin publishing with media uses `school-media`:

1. The caller's JWT and current Admin role authorize preparation of the exact reviewed media set and revision.
2. Preparation durably records promotion candidates before any R2 side effect; it does not publish.
3. Every required main/card/image/thumb variant is promoted to public R2. Conditional writes prevent overwrite; retries accept an existing matching SHA-256 object.
4. Only after every promotion succeeds does the service-only final RPC lock the school, recheck the revision and exact reviewed set, recheck the actor's Admin role and atomically commit the whitelist snapshot.
5. Direct browser `review_school` calls cannot publish a school with draft media, bypassing promotion.

There is no transaction spanning PostgreSQL and R2. A first or partial copy failure never calls the publication RPC.
A rejected final transaction leaves the previous publication unchanged. Admin receives a localized failure, not a publication success.
Copied but unused objects are preferred over a public snapshot with missing objects.
An interrupted final RPC response can have an unknown outcome; reload canonical Admin state before retrying.

Replacing or removing draft media never overwrites/deletes a published object.
Return preserves the last snapshot; unpublish/archive hides the school, restore does not publish.
Previously approved direct public R2 URLs may remain accessible after unpublish: this is inherent to the requested public-copy architecture.
Strict URL revocation would require a separate gated media delivery design.

## Cleanup

`school_media_cleanup_jobs` is an internal outbox without browser access.
Permanent school deletion enqueues every variant before deleting media records, in the same SQL transaction.
Unused assets older than 48 hours can be collected only if neither the draft nor the retained snapshot references them.
Collection removes metadata before queue execution, preventing reattachment of a queued asset.
Failed promotion attempts use this same cleanup architecture. Unreferenced attempted assets are immediately queued and their metadata removed, idempotently.
Assets still referenced by the current draft/review or retained publication are never queued; their durable `public_promotion_attempted_at` record remains for retry and later collection after references disappear.
This also covers timed-out writes and request interruption before failure recording. No second cleanup queue is introduced.
The Admin-only `cleanup` action sweeps one school and attempts up to 50 jobs from both buckets.
Completed jobs are marked only after both deletions succeed; retry is idempotent.
Permanent-delete frontend requests cleanup best-effort; queue entries survive network failures.
A future operator can call this action for a school UUID, including a permanently deleted school.
No scheduler or remote cleanup run is installed or executed here.

## Storage layout

Private and public buckets use identical, server-generated keys:

```text
schools/{schoolId}/cover/{assetId}/main.webp
schools/{schoolId}/cover/{assetId}/card.webp
schools/{schoolId}/gallery/{assetId}/image.webp
schools/{schoolId}/gallery/{assetId}/thumb.webp
```

Asset IDs are immutable UUIDs; the client cannot choose an upload key.
Device filenames are ignored and never persisted.
R2 credentials should have only the required bucket permissions.

## Image profiles

Every image is decoded and re-encoded, including small existing WebP files.
Sources: JPEG/PNG/WebP and AVIF if the browser decoder supports it; no SVG, HEIC or URL input.
Source caps: 20 MiB, 24,000,000 pixels, 8192 px per side.
JPEG/PNG/WebP dimensions are checked before decode where headers allow it;
decoded dimensions are checked again (AVIF may require decode before dimension validation).
Native image orientation is applied before drawing. Alpha is preserved; no background is painted.
Outputs use UUID filenames and clean WebP containers, with no EXIF/XMP chunks.

| Variant | Maximum long side | Target upper size | Hard maximum |
|---|---:|---:|---:|
| Cover main | 1600 | 300 KiB | 400 KiB |
| Cover card | 960 | 130 KiB | 150 KiB |
| Gallery image | 1600 | 220 KiB | 300 KiB |
| Gallery thumb | 480 | 50 KiB | 70 KiB |

Encoding starts at quality 0.86, tries 0.82/0.78 and, only if needed, dimension factors 0.9/0.8.
No upscale or crop. If output cannot fit the cap, no original-file fallback is uploaded.
The server independently checks MIME, container, forbidden metadata, variant geometry and size.
Its dependency-free validator lives in `supabase/functions/_shared/school-image-format.ts`,
entirely within the Edge deployment directory. It checks RIFF/WEBP signatures and exact length,
chunk boundaries/zero padding, static VP8/VP8L/VP8X headers, ordering and consistent dimensions.
EXIF/XMP/animation chunks and their VP8X flags, reserved flags and unexpected chunks are rejected.
Static alpha remains supported. This is container/header validation, not a complete entropy decoder.
Preview returns validated `image/webp`, `nosniff`, `no-store`. The browser fetches authorized preview
bytes directly because the installed functions SDK otherwise treats this MIME as text.
School-media CORS permits only the production apex/www origins and localhost/127.0.0.1 on port 8080,
with `Vary: Origin`; unknown/missing origins receive no allow-origin header. JWT and database
authorization remain mandatory, and `[functions.school-media] verify_jwt = true` remains enabled.
Browser encoding is tested with injectable synthetic fixtures; real-phone orientation/color quality still merits visual acceptance testing.

## Local verification

- `node scripts/test-schools.mjs`: disposable PGlite, including the media migration.
- `node scripts/test-school-media.mjs`: optimizer and in-memory Edge handler.
- `node scripts/test-school-media-editor.mjs`: real React components and mocked media API.
- Existing Schools form/navigation/public suites.
- React DOM tests use the same temporary jsdom installation as the existing Schools navigation suite.
- Deno check: `npx.cmd --yes deno check --no-config --no-lock --node-modules-dir=none supabase/functions/school-media/index.ts`.

No test connects to production Supabase or R2.
