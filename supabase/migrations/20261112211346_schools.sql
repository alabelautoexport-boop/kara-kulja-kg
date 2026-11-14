-- Local review only. This migration does not change profiles, is_admin, News or Storage.
begin;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_kg text not null check (length(trim(name_kg)) between 1 and 300),
  name_ru text, name_en text,
  territory_slug text, village_slug text,
  director_name text, director_phone text, office_phone text,
  address_kg text, address_ru text, address_en text,
  current_academic_year text check (current_academic_year is null or current_academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  status text not null default 'draft' check (status in ('draft','review','published')),
  review_note text,
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.school_editor_assignments (
  school_id uuid not null references public.schools on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  primary key (school_id,user_id)
);
create index school_assignments_user on public.school_editor_assignments(user_id);
create index schools_location on public.schools(territory_slug,village_slug);

create function public.can_edit_school(p_school_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.is_admin(),false) or exists (
    select 1 from public.school_editor_assignments where school_id=p_school_id and user_id=auth.uid()
  );
$$;
revoke all on function public.can_edit_school(uuid) from public,anon;
grant execute on function public.can_edit_school(uuid) to authenticated;

create table public.school_year_stats (
  school_id uuid not null references public.schools on delete restrict,
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  total_students integer check (total_students>=0),
  total_teachers integer check (total_teachers>=0),
  grade11_graduates integer check (grade11_graduates>=0),
  primary key(school_id,academic_year)
);
-- 1-300 is a defensive application input range, NOT an official ORT maximum.
create function public.valid_school_ort_scores(p_scores jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare s jsonb;
begin
  if p_scores is null or jsonb_typeof(p_scores) is distinct from 'array' then return false; end if;
  if jsonb_array_length(p_scores) not between 1 and 10000 then return false; end if;
  for s in select value from jsonb_array_elements(p_scores) loop
    if jsonb_typeof(s)<>'number' then return false; end if;
    if s::text::numeric < 1 or s::text::numeric > 300 or trunc(s::text::numeric) <> s::text::numeric then return false; end if;
  end loop;
  return true;
end;
$$;
create function public.school_ort_summary(p_scores jsonb) returns jsonb
language sql immutable set search_path = public as $$
  select jsonb_build_object(
    'participants',count(*),'average',round(avg(s),2),
    'median',percentile_cont(0.5) within group(order by s),'minimum',min(s),'maximum',max(s),
    'over200',count(*) filter(where s>=200),
    'distribution',jsonb_build_array(
      count(*) filter(where s<110),count(*) filter(where s between 110 and 129),
      count(*) filter(where s between 130 and 149),count(*) filter(where s between 150 and 169),
      count(*) filter(where s between 170 and 189),count(*) filter(where s between 190 and 199),
      count(*) filter(where s>=200)))
  from (select value::text::numeric s from jsonb_array_elements(p_scores)) q;
$$;
create table public.school_ort_years (
  school_id uuid not null references public.schools on delete restrict,
  year integer not null check(year between 2000 and 2200),
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  scores jsonb not null check(public.valid_school_ort_scores(scores)),
  primary key(school_id,year)
);
create table public.school_achievements (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools on delete restrict,
  date date not null,
  title_kg text not null check(length(trim(title_kg)) between 1 and 300), title_ru text, title_en text,
  description_kg text not null check(length(trim(description_kg)) between 1 and 3000), description_ru text, description_en text,
  category text check(category in ('olympiad','sport','competition','district','regional','national','international','other'))
);
create index school_achievements_school on public.school_achievements(school_id);
create table public.school_ort_resources (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools on delete restrict,
  title_kg text not null check(length(trim(title_kg)) between 1 and 300), title_ru text, title_en text,
  description_kg text, description_ru text, description_en text,
  type text not null check(type in ('official','practice','material','document','website','course','announcement','other')),
  url text check(url is null or url ~ '^https?://[^[:space:]]+$'),
  year integer check(year between 2000 and 2200), source text
);
create index school_resources_school on public.school_ort_resources(school_id);
-- Only the publish RPC can write this approved snapshot. It never copies raw scores.
create table public.school_publications (
  school_id uuid primary key references public.schools on delete restrict,
  slug text not null unique,
  document jsonb not null,
  is_published boolean not null default true,
  published_at timestamptz not null default now()
);
create index school_publications_published_slug on public.school_publications(slug) where is_published;

alter table public.schools enable row level security;
alter table public.school_editor_assignments enable row level security;
alter table public.school_year_stats enable row level security;
alter table public.school_ort_years enable row level security;
alter table public.school_achievements enable row level security;
alter table public.school_ort_resources enable row level security;
alter table public.school_publications enable row level security;

create policy schools_private_read on public.schools for select to authenticated using(public.can_edit_school(id));
create policy assignments_read on public.school_editor_assignments for select to authenticated using(user_id=auth.uid() or public.is_admin());
create policy assignments_admin on public.school_editor_assignments for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy stats_private_read on public.school_year_stats for select to authenticated using(public.can_edit_school(school_id));
create policy ort_private_read on public.school_ort_years for select to authenticated using(public.can_edit_school(school_id));
create policy achievements_private_read on public.school_achievements for select to authenticated using(public.can_edit_school(school_id));
create policy resources_private_read on public.school_ort_resources for select to authenticated using(public.can_edit_school(school_id));
create policy publications_approved_read on public.school_publications for select to anon,authenticated using(is_published);
create policy publications_admin_read on public.school_publications for select to authenticated using(public.is_admin());

revoke all on public.schools,public.school_editor_assignments,public.school_year_stats,public.school_ort_years,
  public.school_achievements,public.school_ort_resources,public.school_publications from public,anon,authenticated;
grant select on public.schools,public.school_editor_assignments,public.school_year_stats,public.school_ort_years,
  public.school_achievements,public.school_ort_resources to authenticated;
grant insert,delete on public.school_editor_assignments to authenticated;
grant select on public.school_publications to anon,authenticated;

create function public.create_school(p_slug text,p_name_kg text) returns uuid
language plpgsql security definer set search_path = public as $$
declare result uuid;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  insert into public.schools(slug,name_kg) values(p_slug,p_name_kg) returning id into result;
  return result;
end;
$$;

-- Atomic replacement of a private workspace, with optimistic concurrency control.
create function public.save_school_draft(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare current_school public.schools; item jsonb; info jsonb:=p_payload->'info';
  site_admin boolean:=coalesce(public.is_admin(),false);
begin
  if not coalesce(public.can_edit_school(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_revision is null or p_payload is null or jsonb_typeof(info) is distinct from 'object' or octet_length(p_payload::text)>2000000 then raise exception 'Invalid payload'; end if;
  select * into current_school from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if current_school.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if not site_admin and (
    (info ? 'slug' and (info->>'slug') is distinct from current_school.slug) or
    nullif(info->>'territory_slug','') is distinct from current_school.territory_slug or
    nullif(info->>'village_slug','') is distinct from current_school.village_slug
  ) then raise exception 'Only Admin can change school identity or location' using errcode='42501'; end if;
  if current_school.status='review' and not site_admin then raise exception 'Under review'; end if;
  update public.schools set
    slug=case when info ? 'slug' then info->>'slug' else current_school.slug end,
    name_kg=info->>'name_kg',name_ru=info->>'name_ru',name_en=info->>'name_en',
    territory_slug=nullif(info->>'territory_slug',''),village_slug=nullif(info->>'village_slug',''),
    director_name=info->>'director_name',director_phone=info->>'director_phone',office_phone=info->>'office_phone',
    address_kg=info->>'address_kg',address_ru=info->>'address_ru',address_en=info->>'address_en',
    current_academic_year=nullif(info->>'current_academic_year',''),
    status=case when p_submit then 'review' else 'draft' end,review_note=null,revision=revision+1,updated_at=now()
    where id=p_school_id;
  delete from public.school_year_stats where school_id=p_school_id;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'stats','[]')) loop
    insert into public.school_year_stats values(p_school_id,item->>'academic_year',
      nullif(item->>'total_students','')::integer,nullif(item->>'total_teachers','')::integer,nullif(item->>'grade11_graduates','')::integer);
  end loop;
  delete from public.school_ort_years where school_id=p_school_id;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'ort','[]')) loop
    insert into public.school_ort_years values(p_school_id,(item->>'year')::integer,item->>'academic_year',item->'scores');
  end loop;
  delete from public.school_achievements where school_id=p_school_id;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'achievements','[]')) loop
    insert into public.school_achievements(school_id,date,title_kg,title_ru,title_en,description_kg,description_ru,description_en,category)
    values(p_school_id,(item->>'date')::date,item->>'title_kg',item->>'title_ru',item->>'title_en',
      item->>'description_kg',item->>'description_ru',item->>'description_en',nullif(item->>'category',''));
  end loop;
  delete from public.school_ort_resources where school_id=p_school_id;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'resources','[]')) loop
    insert into public.school_ort_resources(school_id,title_kg,title_ru,title_en,description_kg,description_ru,description_en,type,url,year,source)
    values(p_school_id,item->>'title_kg',item->>'title_ru',item->>'title_en',item->>'description_kg',item->>'description_ru',item->>'description_en',
      item->>'type',nullif(item->>'url',''),nullif(item->>'year','')::integer,item->>'source');
  end loop;
end;
$$;

create function public.review_school(p_school_id uuid,p_revision integer,p_action text,p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; approved jsonb;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found or p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if p_action='publish' then
    select jsonb_build_object(
      'info',to_jsonb(s)-array['status','review_note','revision','created_at','updated_at'],
      'stats',coalesce((select jsonb_agg(to_jsonb(t)-'school_id' order by academic_year desc) from public.school_year_stats t where school_id=s.id),'[]'),
      'ort',coalesce((select jsonb_agg(jsonb_build_object('year',year,'academic_year',academic_year,'summary',public.school_ort_summary(scores)) order by year desc) from public.school_ort_years where school_id=s.id),'[]'),
      'achievements',coalesce((select jsonb_agg(to_jsonb(a)-'school_id' order by date desc) from public.school_achievements a where school_id=s.id),'[]'),
      'resources',coalesce((select jsonb_agg(to_jsonb(r)-'school_id' order by year desc nulls last) from public.school_ort_resources r where school_id=s.id),'[]')
    ) into approved;
    insert into public.school_publications(school_id,slug,document) values(s.id,s.slug,approved)
    on conflict(school_id) do update set document=excluded.document,slug=excluded.slug,is_published=true,published_at=now();
    update public.schools set status='published',review_note=null,revision=revision+1,updated_at=now() where id=s.id;
  elsif p_action='return' then
    update public.schools set status='draft',review_note=p_note,revision=revision+1,updated_at=now() where id=s.id;
  elsif p_action='unpublish' then
    update public.school_publications set is_published=false where school_id=s.id;
    update public.schools set status='draft',revision=revision+1,updated_at=now() where id=s.id;
  else raise exception 'Invalid action'; end if;
end;
$$;
revoke all on function public.create_school(text,text),public.save_school_draft(uuid,integer,jsonb,boolean),public.review_school(uuid,integer,text,text) from public,anon;
grant execute on function public.create_school(text,text),public.save_school_draft(uuid,integer,jsonb,boolean),public.review_school(uuid,integer,text,text) to authenticated;
revoke all on function public.valid_school_ort_scores(jsonb),public.school_ort_summary(jsonb) from public,anon,authenticated;
commit;
