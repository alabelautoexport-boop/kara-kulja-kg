# Supabase deployment

The migration in `migrations/20261024000000_news_admin_foundation.sql` creates the admin profile model, News data model, RLS policies, and the public-read/admin-write `news` Storage bucket.

The follow-up migration in `migrations/20261024010000_news_r2_gallery.sql` adds the ordered `gallery_images` JSON array used by the R2-backed News gallery. Apply this migration after the original foundation migration.

## First administrator

1. Apply the migration to the intended Supabase project.
2. In Supabase Authentication, create the administrator user with email and password.
3. Copy that user's UUID.
4. In the Supabase SQL Editor, run:

```sql
insert into public.profiles (id, role)
values ('<REAL_AUTH_USER_UUID>', 'admin')
on conflict (id) do update set role = excluded.role;
```

The migration backfills existing Auth users, and the `on_auth_user_created` trigger creates profiles for future users. No Data API policy allows users to change their own role.

## News media Edge Function

News media writes and deletes are handled by `functions/news-media`. The function requires a valid user JWT, calls `public.is_admin()` with that user's database context, and restricts every object operation to `news/{media_folder_id}/` in the existing `kara-kulja-media` R2 bucket.

Set these Edge Function secrets with values from the existing Cloudflare R2 configuration:

```powershell
supabase secrets set R2_ACCOUNT_ID=<account-id>
supabase secrets set R2_ACCESS_KEY_ID=<access-key-id>
supabase secrets set R2_SECRET_ACCESS_KEY=<secret-access-key>
supabase secrets set R2_BUCKET_NAME=kara-kulja-media
supabase secrets set R2_PUBLIC_BASE_URL=https://media.kara-kulja.kg
```

Do not prefix the R2 credentials with `VITE_`. Supabase supplies its own `SUPABASE_URL` and Auth key variables to the function runtime.

Deploy the function with JWT verification enabled:

```powershell
supabase functions deploy news-media
```

The website invokes the deployed function through `supabase.functions.invoke`. The static frontend never receives R2 credentials.

## Legacy Supabase Storage

The applied foundation migration created a public Storage bucket named `news` and these `storage.objects` policies:

- `news_media_public_read`
- `news_media_admin_insert`
- `news_media_admin_update`
- `news_media_admin_delete`

Active News code no longer uses this bucket. Do not remove it or its policies until the bucket has been checked for required files. A later cleanup can first list the bucket, migrate or confirm deletion of any remaining files, then remove the four policies and the empty bucket in a separate reviewed migration.
