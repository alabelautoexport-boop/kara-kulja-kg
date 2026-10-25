create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_kg text not null,
  title_ru text,
  title_en text,
  excerpt_kg text,
  excerpt_ru text,
  excerpt_en text,
  body_kg text,
  body_ru text,
  body_en text,
  cover_image text,
  media_folder_id uuid not null default gen_random_uuid(),
  published_at timestamptz,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at before update on public.news
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.news enable row level security;

drop policy if exists "profiles_read_own" on public.profiles;
create policy "profiles_read_own" on public.profiles
for select to authenticated
using (id = auth.uid());

drop policy if exists "profiles_admin_read_all" on public.profiles;
create policy "profiles_admin_read_all" on public.profiles
for select to authenticated
using (public.is_admin());

drop policy if exists "published_news_public_read" on public.news;
create policy "published_news_public_read" on public.news
for select to anon, authenticated
using (is_published = true and published_at is not null);

drop policy if exists "news_admin_read_all" on public.news;
create policy "news_admin_read_all" on public.news
for select to authenticated
using (public.is_admin());

drop policy if exists "news_admin_insert" on public.news;
create policy "news_admin_insert" on public.news
for insert to authenticated
with check (public.is_admin());

drop policy if exists "news_admin_update" on public.news;
create policy "news_admin_update" on public.news
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "news_admin_delete" on public.news;
create policy "news_admin_delete" on public.news
for delete to authenticated
using (public.is_admin());

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.news from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on table public.profiles to authenticated;
grant select on table public.news to anon, authenticated;
grant insert, update, delete on table public.news to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news',
  'news',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "news_media_public_read" on storage.objects;
create policy "news_media_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'news');

drop policy if exists "news_media_admin_insert" on storage.objects;
create policy "news_media_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'news' and public.is_admin());

drop policy if exists "news_media_admin_update" on storage.objects;
create policy "news_media_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'news' and public.is_admin())
with check (bucket_id = 'news' and public.is_admin());

drop policy if exists "news_media_admin_delete" on storage.objects;
create policy "news_media_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'news' and public.is_admin());

