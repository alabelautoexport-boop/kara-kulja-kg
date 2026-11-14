-- Local School Media source only. Apply separately after review.
begin;
create table public.school_media (
 id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools on delete restrict,
 kind text not null check(kind in ('cover','gallery')), state text not null default 'pending' check(state in ('pending','ready')),
 in_draft boolean not null default false, sort_order integer not null default 0 check(sort_order between 0 and 14),
 main_key text generated always as ('schools/'||school_id::text||'/'||kind||'/'||id::text||case when kind='cover' then '/main.webp' else '/image.webp' end) stored,
 thumb_key text generated always as ('schools/'||school_id::text||'/'||kind||'/'||id::text||case when kind='cover' then '/card.webp' else '/thumb.webp' end) stored,
 mime_type text not null default 'image/webp' check(mime_type='image/webp'),
 width integer, height integer, thumb_width integer, thumb_height integer, bytes integer, thumb_bytes integer,
 main_sha256 text, thumb_sha256 text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 public_promotion_attempted_at timestamptz,
 check(not in_draft or state='ready'),
 check(state<>'ready' or (width is not null and height is not null and thumb_width is not null and thumb_height is not null and bytes is not null and thumb_bytes is not null and main_sha256 is not null and thumb_sha256 is not null)),
 check(width between 1 and 1600 and height between 1 and 1600),
 check(thumb_width between 1 and case when kind='cover' then 960 else 480 end and thumb_height between 1 and case when kind='cover' then 960 else 480 end),
 check(bytes between 1 and case when kind='cover' then 409600 else 307200 end),
 check(thumb_bytes between 1 and case when kind='cover' then 153600 else 71680 end),
 check(main_sha256 ~ '^[a-f0-9]{64}$' and thumb_sha256 ~ '^[a-f0-9]{64}$')
);
create unique index school_media_one_cover on public.school_media(school_id) where kind='cover' and in_draft;
create unique index school_media_gallery_order on public.school_media(school_id,sort_order) where kind='gallery' and in_draft;
create table public.school_media_cleanup_jobs (
 id uuid primary key default gen_random_uuid(), school_id uuid not null,
 main_key text not null, thumb_key text not null, attempts integer not null default 0,
 created_at timestamptz not null default now(), completed_at timestamptz,
 unique(main_key), check(main_key ~ '^schools/[0-9a-f-]{36}/(cover|gallery)/[0-9a-f-]{36}/(main|image)\.webp$'),
 check(thumb_key ~ '^schools/[0-9a-f-]{36}/(cover|gallery)/[0-9a-f-]{36}/(card|thumb)\.webp$')
);
alter table public.school_media enable row level security;
alter table public.school_media_cleanup_jobs enable row level security;
revoke all on public.school_media,public.school_media_cleanup_jobs from public,anon,authenticated;
grant select on public.school_media to authenticated;
grant select,update on public.school_media_cleanup_jobs to service_role;
grant select on public.school_media,public.school_publications,public.schools to service_role;
create policy school_media_private_read on public.school_media for select to authenticated using(public.can_edit_school(school_id));

create function public.can_manage_school_media(p_school_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.schools s where s.id=p_school_id and (
 coalesce(public.is_admin(),false) or (not s.is_archived and s.status<>'review' and exists(select 1 from public.school_editor_assignments a where a.school_id=s.id and a.user_id=auth.uid()))));
$$;
revoke all on function public.can_manage_school_media(uuid) from public,anon;
grant execute on function public.can_manage_school_media(uuid) to authenticated;

create function public.guard_school_media_count() returns trigger language plpgsql set search_path=public as $$
begin
 perform 1 from public.schools where id=new.school_id for update;
 if new.in_draft and new.kind='gallery' and (select count(*) from public.school_media where school_id=new.school_id and kind='gallery' and in_draft and id<>new.id)>=15 then raise exception 'Gallery limit is 15'; end if;
 return new;
end; $$;
revoke all on function public.guard_school_media_count() from public,anon,authenticated;
create trigger school_media_count before insert or update on public.school_media for each row execute function public.guard_school_media_count();

create function public.register_school_media(p_school_id uuid,p_kind text) returns public.school_media
language plpgsql security definer set search_path=public as $$
declare result public.school_media;
begin
 perform 1 from public.schools where id=p_school_id for update;
 if not coalesce(public.can_manage_school_media(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 if (select count(*) from public.school_media where school_id=p_school_id and not in_draft and created_at>now()-interval '48 hours')>=40 then raise exception 'Too many pending uploads'; end if;
 insert into public.school_media(school_id,kind) values(p_school_id,p_kind) returning * into result;
 return result;
end; $$;
revoke all on function public.register_school_media(uuid,text) from public,anon;
grant execute on function public.register_school_media(uuid,text) to authenticated;

-- Only the authenticated Edge Function's service client can attest inspected bytes.
create function public.complete_school_media(p_id uuid,p_actor uuid,p_main jsonb,p_thumb jsonb) returns void
language plpgsql security definer set search_path=public as $$
declare m public.school_media;s public.schools;
begin
 select * into m from public.school_media where id=p_id;
 select * into s from public.schools where id=m.school_id for update;
 if s.id is null or not (exists(select 1 from public.profiles where id=p_actor and role='admin') or
 (not s.is_archived and s.status<>'review' and exists(select 1 from public.school_editor_assignments where school_id=s.id and user_id=p_actor))) then raise exception 'Not authorized' using errcode='42501'; end if;
 if m.state<>'pending' then raise exception 'Immutable media'; end if;
 update public.school_media set state='ready',width=(p_main->>'width')::int,height=(p_main->>'height')::int,bytes=(p_main->>'bytes')::int,
 thumb_width=(p_thumb->>'width')::int,thumb_height=(p_thumb->>'height')::int,thumb_bytes=(p_thumb->>'bytes')::int,
 main_sha256=p_main->>'sha256',thumb_sha256=p_thumb->>'sha256',updated_at=now() where id=m.id and state='pending';
end; $$;
revoke all on function public.complete_school_media(uuid,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.complete_school_media(uuid,uuid,jsonb,jsonb) to service_role;

-- Keep old callers working: omission means preserve, never clear.
alter function public.save_school_workspace_internal(uuid,integer,jsonb,boolean) rename to save_school_before_media;
revoke all on function public.save_school_before_media(uuid,integer,jsonb,boolean) from public,anon,authenticated;
create function public.save_school_workspace_internal(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path=public as $$
declare ids uuid[];cover_id uuid;gallery_ids uuid[];item jsonb;slot int:=0;
begin
 if p_payload ? 'media' then
  perform 1 from public.schools where id=p_school_id for update;
  if not coalesce(public.can_manage_school_media(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  if jsonb_typeof(p_payload->'media') is distinct from 'object' or jsonb_typeof(p_payload->'media'->'gallery') is distinct from 'array' then raise exception 'Invalid media'; end if;
  cover_id:=nullif(p_payload->'media'->>'cover','')::uuid;
  select coalesce(array_agg(value::uuid order by ordinal),'{}'::uuid[]) into gallery_ids
  from jsonb_array_elements_text(p_payload->'media'->'gallery') with ordinality as requested(value,ordinal);
  ids:=gallery_ids||case when cover_id is null then '{}'::uuid[] else array[cover_id] end;
  if cardinality(gallery_ids)>15 or cardinality(ids)<>(select count(distinct x) from unnest(ids) x) or
   exists(select 1 from unnest(ids) requested(asset_id) where not exists(select 1 from public.school_media m where m.id=requested.asset_id and m.school_id=p_school_id and m.state='ready')) or
   (cover_id is not null and not exists(select 1 from public.school_media where id=cover_id and kind='cover')) or
   exists(select 1 from public.school_media where id=any(gallery_ids) and kind<>'gallery') then raise exception 'Invalid media selection'; end if;
 end if;
 perform public.save_school_before_media(p_school_id,p_revision,p_payload,p_submit);
 if p_payload ? 'media' then
  update public.school_media set in_draft=false,updated_at=now() where school_id=p_school_id and in_draft;
  update public.school_media set in_draft=true,sort_order=0,updated_at=now() where id=cover_id;
  foreach cover_id in array gallery_ids loop
   update public.school_media set in_draft=true,sort_order=slot,updated_at=now() where id=cover_id;slot:=slot+1;
  end loop;
 end if;
end; $$;
revoke all on function public.save_school_workspace_internal(uuid,integer,jsonb,boolean) from public,anon,authenticated;

create function public.collect_unused_school_media(p_school_id uuid,p_all boolean default false) returns void
language plpgsql security definer set search_path=public as $$
declare m public.school_media;
begin
 for m in select * from public.school_media where school_id=p_school_id and (p_all or (not in_draft and created_at<now()-interval '48 hours' and not exists(
 select 1 from public.school_publications p where p.school_id=p_school_id and (p.document->'media'->'cover'->>'asset_id'=school_media.id::text or exists(select 1 from jsonb_array_elements(coalesce(p.document->'media'->'gallery','[]')) g where g->>'asset_id'=school_media.id::text))))) for update loop
  insert into public.school_media_cleanup_jobs(school_id,main_key,thumb_key) values(m.school_id,m.main_key,m.thumb_key) on conflict(main_key) do nothing;
  delete from public.school_media where id=m.id;
 end loop;
end; $$;
revoke all on function public.collect_unused_school_media(uuid,boolean) from public,anon,authenticated;
-- A service-only sweep has no all-assets flag. Permanent deletion invokes the internal function.
create function public.sweep_school_media(p_school_id uuid) returns void language plpgsql security definer set search_path=public as $$
begin perform 1 from public.schools where id=p_school_id for update;perform public.collect_unused_school_media(p_school_id,false);end; $$;
revoke all on function public.sweep_school_media(uuid) from public,anon,authenticated;
grant execute on function public.sweep_school_media(uuid) to service_role;
-- Internal publication implementation. Browser callers cannot attest storage promotion.
create function public.review_school_media_internal(p_school_id uuid,p_revision integer,p_action text,p_note text,p_media_verified boolean,p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; approved jsonb;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role='admin') then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found or p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if p_action='publish' then
    if not p_media_verified and exists(select 1 from public.school_media where school_id=s.id and in_draft) then raise exception 'Media promotion required'; end if;
    select jsonb_build_object(
      'info',jsonb_build_object('slug',s.slug,'name_kg',s.name_kg,'name_ru',s.name_ru,'name_en',s.name_en,'territory_slug',s.territory_slug,'village_slug',s.village_slug,'director_name',s.director_name,'director_phone',s.director_phone,'office_phone',s.office_phone,'address_kg',s.address_kg,'address_ru',s.address_ru,'address_en',s.address_en,'current_academic_year',s.current_academic_year),
      'media',jsonb_build_object('cover',(select jsonb_build_object('asset_id',m.id,'kind',m.kind,'main_key',m.main_key,'thumb_key',m.thumb_key,'width',m.width,'height',m.height,'thumb_width',m.thumb_width,'thumb_height',m.thumb_height) from public.school_media m where m.school_id=s.id and m.in_draft and m.kind='cover' and m.state='ready'), 'gallery',coalesce((select jsonb_agg(jsonb_build_object('asset_id',m.id,'kind',m.kind,'main_key',m.main_key,'thumb_key',m.thumb_key,'width',m.width,'height',m.height,'thumb_width',m.thumb_width,'thumb_height',m.thumb_height) order by m.sort_order) from public.school_media m where m.school_id=s.id and m.in_draft and m.kind='gallery' and m.state='ready'),'[]')),
      'stats',coalesce((select jsonb_agg(to_jsonb(t)-'school_id' order by academic_year desc) from public.school_year_stats t where school_id=s.id),'[]'),
      'ort',coalesce((select jsonb_agg(jsonb_build_object('year',year,'academic_year',academic_year,'summary',public.school_ort_summary(scores)) order by year desc) from public.school_ort_years where school_id=s.id),'[]'),
      'achievements',coalesce((select jsonb_agg(to_jsonb(a)-'school_id' order by date desc) from public.school_achievements a where school_id=s.id),'[]'),
      'resources',coalesce((select jsonb_agg(to_jsonb(r)-'school_id' order by year desc nulls last) from public.school_ort_resources r where school_id=s.id),'[]')
    ) into approved;
    insert into public.school_publications(school_id,slug,document) values(s.id,s.slug,approved)
    on conflict(school_id) do update set document=excluded.document,slug=excluded.slug,is_published=true,published_at=now();
    update public.schools set status='published',review_note=null,revision=revision+1,updated_at=now() where id=s.id;
  perform public.collect_unused_school_media(s.id,false);
  elsif p_action='return' then
    update public.schools set status='draft',review_note=p_note,revision=revision+1,updated_at=now() where id=s.id;
  elsif p_action='unpublish' then
    update public.school_publications set is_published=false where school_id=s.id;
    update public.schools set status='draft',revision=revision+1,updated_at=now() where id=s.id;
  else raise exception 'Invalid action'; end if;
end;
$$;
revoke all on function public.review_school_media_internal(uuid,integer,text,text,boolean,uuid) from public,anon,authenticated,service_role;
create or replace function public.review_school(p_school_id uuid,p_revision integer,p_action text,p_note text default null) returns void
language plpgsql security definer set search_path=public as $$
begin
 perform public.review_school_media_internal(p_school_id,p_revision,p_action,p_note,false,auth.uid());
end; $$;

-- Ordered, exact reviewed set, including inspected hashes. Never returned publicly.
create function public.school_media_publication_set(p_school_id uuid) returns jsonb
language sql stable security definer set search_path=public as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'school_id',m.school_id,'kind',m.kind,'state',m.state,
 'main_key',m.main_key,'thumb_key',m.thumb_key,'main_sha256',m.main_sha256,'thumb_sha256',m.thumb_sha256)
 order by m.kind,m.sort_order,m.id),'[]') from public.school_media m where m.school_id=p_school_id and m.in_draft;
$$;
revoke all on function public.school_media_publication_set(uuid) from public,anon,authenticated,service_role;
create function public.prepare_school_media_publication(p_school_id uuid,p_revision integer) returns jsonb
language plpgsql security definer set search_path=public as $$
declare s public.schools;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into s from public.schools where id=p_school_id for update;
 if not found or s.revision is distinct from p_revision then raise exception 'Revision conflict'; end if;
 -- Durable candidate record before any R2 side effect, including ambiguous network failures.
 -- Referenced draft/review/publication assets are NOT queued for deletion.
 update public.school_media set public_promotion_attempted_at=now() where school_id=s.id and in_draft;
 return public.school_media_publication_set(s.id);
end; $$;
revoke all on function public.prepare_school_media_publication(uuid,integer) from public,anon;
grant execute on function public.prepare_school_media_publication(uuid,integer) to authenticated;

create function public.finish_school_media_publication(p_school_id uuid,p_revision integer,p_actor uuid,p_media jsonb,p_note text default null) returns void
language plpgsql security definer set search_path=public as $$
begin
 perform 1 from public.schools where id=p_school_id for update;
 if p_media is distinct from public.school_media_publication_set(p_school_id) then raise exception 'Reviewed media changed'; end if;
 -- Only the server may call this after every immutable public write/HEAD succeeds.
 perform public.review_school_media_internal(p_school_id,p_revision,'publish',p_note,true,p_actor);
end; $$;
revoke all on function public.finish_school_media_publication(uuid,integer,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.finish_school_media_publication(uuid,integer,uuid,jsonb,text) to service_role;

create function public.record_school_media_promotion_failure(p_school_id uuid,p_assets uuid[]) returns void
language plpgsql security definer set search_path=public as $$
declare m public.school_media;
begin
 perform 1 from public.schools where id=p_school_id for update;
 for m in select * from public.school_media where school_id=p_school_id and id=any(p_assets) and not in_draft
 and not exists(select 1 from public.school_publications p where p.school_id=p_school_id and
 (p.document->'media'->'cover'->>'asset_id'=school_media.id::text or exists(select 1 from jsonb_array_elements(coalesce(p.document->'media'->'gallery','[]')) g where g->>'asset_id'=school_media.id::text))) for update loop
  insert into public.school_media_cleanup_jobs(school_id,main_key,thumb_key) values(m.school_id,m.main_key,m.thumb_key) on conflict(main_key) do nothing;
  delete from public.school_media where id=m.id;
 end loop;
 -- Still referenced assets retain public_promotion_attempted_at; the existing sweep collects
 -- them only after references disappear. Never destroy a retriable reviewed selection.
end; $$;
revoke all on function public.record_school_media_promotion_failure(uuid,uuid[]) from public,anon,authenticated;
grant execute on function public.record_school_media_promotion_failure(uuid,uuid[]) to service_role;

create or replace function public.permanently_delete_school(p_school_id uuid,p_revision integer,p_confirm_name text) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if not s.is_archived then raise exception 'Archive school before permanent deletion' using errcode='22023'; end if;
  if p_confirm_name is distinct from s.name_kg then raise exception 'School name confirmation required' using errcode='22023'; end if;
  perform public.collect_unused_school_media(s.id,true);
  delete from public.school_editor_assignments where school_id=s.id;
  delete from public.school_year_stats where school_id=s.id;
  delete from public.school_ort_years where school_id=s.id;
  delete from public.school_achievements where school_id=s.id;
  delete from public.school_ort_resources where school_id=s.id;
  delete from public.school_publications where school_id=s.id;
  delete from public.schools where id=s.id;
end;
$$;

commit;
