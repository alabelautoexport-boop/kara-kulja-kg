-- Architecture only. No bulk institution import. Existing IDs and slugs stay unchanged.
begin;

create function public.valid_institution_source(p_source jsonb) returns boolean
language sql immutable set search_path = public as $$
 select coalesce(jsonb_typeof(p_source)='object' and octet_length(p_source::text)<=32768 and
   (p_source='{}'::jsonb or (
     jsonb_typeof(p_source->'source_file')='string' and length(trim(p_source->>'source_file')) between 1 and 300 and
     jsonb_typeof(p_source->'source_sheet')='string' and length(trim(p_source->>'source_sheet')) between 1 and 100 and
     jsonb_typeof(p_source->'source_row')='number' and p_source->>'source_row' ~ '^[1-9][0-9]{0,6}$' and
     jsonb_typeof(p_source->'excel_number')='number' and p_source->>'excel_number' ~ '^[1-9][0-9]{0,6}$' and
     jsonb_typeof(p_source->'original_name')='string' and
     jsonb_typeof(p_source->'original_address')='string'
   )),false);
$$;

create function public.valid_institution_location(p_territory text,p_village text) returns boolean
language sql immutable set search_path = public as $$
 select exists(select 1 from (values
    ('kara-kulja','kara-kulja'),
    ('kara-kulja','biy-myrza'),
    ('kara-kulja','birinchi-may'),
    ('kara-kulja','sary-kamysh'),
    ('alaikuu','kok-art'),
    ('alaikuu','kan-korgon'),
    ('alaikuu','boru-tokoy'),
    ('alaikuu','zhele-dobo'),
    ('alaikuu','ara-bulak'),
    ('alaikuu','sai-talaa'),
    ('alaikuu','kaiyn-talaa'),
    ('alaikuu','kyzyl-zhar'),
    ('alaikuu','kuyotash'),
    ('alaikuu','chychyrkanak'),
    ('alaikuu','koo-chaty'),
    ('alaikuu','terek'),
    ('kara-guz','zhany-talaa'),
    ('kara-guz','altyn-kurok'),
    ('kara-guz','zhetim-dobo'),
    ('kara-guz','kalmatay'),
    ('kara-guz','kara-zhygach'),
    ('kara-guz','nasirdin'),
    ('kara-guz','kenesh'),
    ('kara-guz','por'),
    ('kara-kochkor','kara-kochkor'),
    ('kara-kochkor','ak-kyya'),
    ('kara-kochkor','sary-bulak-kara-kochkor'),
    ('kara-kochkor','zhany-talap'),
    ('kara-kochkor','zhiyde'),
    ('kara-kochkor','oktyabr'),
    ('kara-kochkor','togotoy'),
    ('kara-kochkor','yntymak'),
    ('oy-tal','sary-bee'),
    ('oy-tal','kara-tash'),
    ('oy-tal','terek-suu'),
    ('oy-tal','nichke-suu'),
    ('oy-tal','oy-tal'),
    ('oy-tal','konduk'),
    ('ryspai-abdykadyrov','sary-kungoy'),
    ('ryspai-abdykadyrov','sary-bulak'),
    ('ryspai-abdykadyrov','toguz-bulak'),
    ('ryspai-abdykadyrov','konokbay-talaa'),
    ('ryspai-abdykadyrov','tegerek-saz'),
    ('ryspai-abdykadyrov','kara-bulak'),
    ('ryspai-abdykadyrov','kyzyl-bulak'),
    ('ylai-talaa','tokbay-talaa'),
    ('ylai-talaa','buyga'),
    ('ylai-talaa','besh-kempir'),
    ('ylai-talaa','orto-talaa'),
    ('ylai-talaa','ylai-talaa'),
    ('ylai-talaa','sai'),
    ('ylai-talaa','sharkyratma'),
    ('ylai-talaa','zhylkol'),
    ('ylai-talaa','sary-tash')
 ) as locations(territory,village) where territory=p_territory and village=p_village);
$$;
revoke all on function public.valid_institution_source(jsonb),public.valid_institution_location(text,text) from public,anon;
grant execute on function public.valid_institution_source(jsonb),public.valid_institution_location(text,text) to authenticated;

alter table public.schools add column school_type text
 check(school_type in ('general','secondary','basic','primary','boarding','school'));
alter table public.schools add column source_metadata jsonb not null default '{}'::jsonb
 check(public.valid_institution_source(source_metadata));

-- Wrap the active save contract. The existing Auth/media/ORT save stack remains intact.
alter function public.save_school_draft(uuid,integer,jsonb,boolean) rename to save_school_before_institution_types;
revoke all on function public.save_school_before_institution_types(uuid,integer,jsonb,boolean) from public,anon,authenticated,service_role;
create function public.save_school_draft(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; info jsonb:=p_payload->'info'; next_type text;
begin
 if not coalesce(public.can_edit_school(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into s from public.schools where id=p_school_id for update;
 if not found then raise exception 'School not found' using errcode='P0002'; end if;
 if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
 if jsonb_typeof(info) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 next_type:=case when info ? 'school_type' then nullif(info->>'school_type','') else s.school_type end;
 if next_type is not null and next_type not in ('general','secondary','basic','primary','boarding','school') then
   raise exception 'Invalid school type' using errcode='22023';
 end if;
 if not coalesce(public.is_admin(),false) and
   (next_type is distinct from s.school_type or info ? 'source_metadata') then
   raise exception 'Only Admin can change school type or provenance' using errcode='42501';
 end if;
 if info ? 'source_metadata' and not public.valid_institution_source(info->'source_metadata') then
   raise exception 'Invalid source metadata' using errcode='22023';
 end if;
 perform public.save_school_before_institution_types(p_school_id,p_revision,p_payload,p_submit);
 update public.schools set school_type=next_type,
   source_metadata=case when info ? 'source_metadata' then info->'source_metadata' else source_metadata end
 where id=p_school_id;
end;
$$;
revoke all on function public.save_school_draft(uuid,integer,jsonb,boolean) from public,anon;
grant execute on function public.save_school_draft(uuid,integer,jsonb,boolean) to authenticated;

-- Both plain and R2 media publications call this one protected internal entry.
alter function public.review_school_media_internal(uuid,integer,text,text,boolean,uuid) rename to review_school_before_institution_types;
revoke all on function public.review_school_before_institution_types(uuid,integer,text,text,boolean,uuid) from public,anon,authenticated,service_role;
create function public.review_school_media_internal(p_school_id uuid,p_revision integer,p_action text,p_note text,p_media_verified boolean,p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare selected_type text;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') then
   raise exception 'Not authorized' using errcode='42501';
 end if;
 select school_type into selected_type from public.schools where id=p_school_id for update;
 if p_action='publish' and selected_type is null then raise exception 'School type required' using errcode='22023'; end if;
 perform public.review_school_before_institution_types(p_school_id,p_revision,p_action,p_note,p_media_verified,p_actor);
 if p_action='publish' then
   update public.school_publications set document=jsonb_set(document,'{info,school_type}',to_jsonb(selected_type))
    where school_id=p_school_id;
 end if;
end;
$$;
revoke all on function public.review_school_media_internal(uuid,integer,text,text,boolean,uuid) from public,anon,authenticated,service_role;

create table public.kindergartens (
 id uuid primary key default gen_random_uuid(),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=120),
 type text not null check(type in ('kindergarten','school_preschool')),
 name_kg text not null check(length(trim(name_kg)) between 1 and 300),
 name_ru text not null default '' check(length(name_ru)<=300),
 name_en text not null default '' check(length(name_en)<=300),
 address_kg text not null default '' check(length(address_kg)<=2000),
 address_ru text not null default '' check(length(address_ru)<=2000),
 address_en text not null default '' check(length(address_en)<=2000),
 territory_slug text not null,
 village_slug text not null,
 status text not null default 'draft' check(status in ('draft','published')),
 revision integer not null default 0 check(revision>=0),
 source_metadata jsonb not null default '{}'::jsonb check(public.valid_institution_source(source_metadata)),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(public.valid_institution_location(territory_slug,village_slug))
);
create table public.kindergarten_publications (
 kindergarten_id uuid primary key references public.kindergartens(id) on delete restrict,
 slug text not null unique,
 document jsonb not null check(jsonb_typeof(document->'info')='object' and not document ? 'source_metadata'),
 is_published boolean not null default true,
 published_at timestamptz not null default now()
);
create index kindergartens_location_type_idx on public.kindergartens(territory_slug,village_slug,type);
alter table public.kindergartens enable row level security;
alter table public.kindergarten_publications enable row level security;
revoke all on public.kindergartens,public.kindergarten_publications from public,anon,authenticated;
grant select on public.kindergartens to authenticated;
grant select on public.kindergarten_publications to anon,authenticated;
create policy kindergartens_admin_read on public.kindergartens for select to authenticated using ((select public.is_admin()));
create policy kindergarten_publications_read on public.kindergarten_publications for select to anon,authenticated
 using (is_published);
-- No direct client writes, including Admin. Whitelisted RPCs own revisions and snapshots.

create function public.save_kindergarten(p_id uuid,p_revision integer,p_payload jsonb,p_publish boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kindergartens; approved jsonb; field text;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>65536 or p_publish is null then
   raise exception 'Invalid payload' using errcode='22023';
 end if;
 foreach field in array array['type','name_kg','name_ru','name_en','address_kg','address_ru','address_en','territory_slug','village_slug'] loop
   if (field in ('type','name_kg','territory_slug','village_slug') or p_payload ? field) and jsonb_typeof(p_payload->field) is distinct from 'string' then
     raise exception 'Invalid institution field' using errcode='22023';
   end if;
 end loop;
 select * into k from public.kindergartens where id=p_id for update;
 if not found then raise exception 'Kindergarten not found' using errcode='P0002'; end if;
 if p_revision is null or p_revision<>k.revision then raise exception 'Revision conflict'; end if;
 if p_payload ? 'slug' and p_payload->>'slug' is distinct from k.slug then raise exception 'Slug is immutable' using errcode='22023'; end if;
 update public.kindergartens set
   type=p_payload->>'type',name_kg=p_payload->>'name_kg',
   name_ru=coalesce(p_payload->>'name_ru',''),name_en=coalesce(p_payload->>'name_en',''),
   address_kg=coalesce(p_payload->>'address_kg',''),address_ru=coalesce(p_payload->>'address_ru',''),address_en=coalesce(p_payload->>'address_en',''),
   territory_slug=p_payload->>'territory_slug',village_slug=p_payload->>'village_slug',
   source_metadata=case when p_payload ? 'source_metadata' then p_payload->'source_metadata' else source_metadata end,
   status=case when p_publish then 'published' else 'draft' end,
   revision=revision+1,updated_at=now()
 where id=p_id returning * into k;
 if p_publish then
   approved:=jsonb_build_object('info',jsonb_build_object(
     'type',k.type,'name_kg',k.name_kg,'name_ru',k.name_ru,'name_en',k.name_en,
     'address_kg',k.address_kg,'address_ru',k.address_ru,'address_en',k.address_en,
     'territory_slug',k.territory_slug,'village_slug',k.village_slug));
   insert into public.kindergarten_publications(kindergarten_id,slug,document)
     values(k.id,k.slug,approved)
   on conflict(kindergarten_id) do update set document=excluded.document,is_published=true,published_at=now();
 end if;
end;
$$;

create function public.create_kindergarten(p_payload jsonb,p_publish boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare created uuid; base text; candidate text; suffix integer:=1;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>65536 then
   raise exception 'Invalid payload' using errcode='22023';
 end if;
 base:=public.school_slug_base(p_payload->>'name_kg');
 loop
   candidate:=base||case when suffix=1 then '' else '-'||suffix::text end;
   insert into public.kindergartens(slug,type,name_kg,territory_slug,village_slug)
     values(candidate,p_payload->>'type',p_payload->>'name_kg',p_payload->>'territory_slug',p_payload->>'village_slug')
   on conflict(slug) do nothing returning id into created;
   exit when created is not null;
   suffix:=suffix+1;
 end loop;
 perform public.save_kindergarten(created,0,p_payload,p_publish);
 return created;
end;
$$;

create function public.unpublish_kindergarten(p_id uuid,p_revision integer) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kindergartens;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into k from public.kindergartens where id=p_id for update;
 if not found then raise exception 'Kindergarten not found' using errcode='P0002'; end if;
 if p_revision is null or k.revision<>p_revision then raise exception 'Revision conflict'; end if;
 update public.kindergarten_publications set is_published=false where kindergarten_id=p_id;
 update public.kindergartens set status='draft',revision=revision+1,updated_at=now() where id=p_id;
end;
$$;
revoke all on function public.create_kindergarten(jsonb,boolean),public.save_kindergarten(uuid,integer,jsonb,boolean),public.unpublish_kindergarten(uuid,integer) from public,anon;
grant execute on function public.create_kindergarten(jsonb,boolean),public.save_kindergarten(uuid,integer,jsonb,boolean),public.unpublish_kindergarten(uuid,integer) to authenticated;

-- Only the two explicitly approved existing identities are aligned, not imported.
-- Guard by BOTH known ID and slug; do not manufacture records if either is absent.
update public.schools set school_type='general'
 where (id='5f36794c-a680-4b93-9bb0-873538f54dbb' and slug='zhiyde')
    or (id='13e261af-16f4-4455-9873-fcc06e44b14d' and slug='b-eshmanbetov-atyndagy-orto-mektebi');
update public.schools set name_kg='Баки Эшмамбетов атындагы жалпы билим берүү мектеби',revision=revision+1,updated_at=now()
 where id='13e261af-16f4-4455-9873-fcc06e44b14d' and slug='b-eshmanbetov-atyndagy-orto-mektebi';
update public.school_publications p set document=jsonb_set(jsonb_set(p.document,
 '{info,school_type}',to_jsonb(s.school_type)),'{info,name_kg}',to_jsonb(s.name_kg))
 from public.schools s where p.school_id=s.id and
 ((s.id='5f36794c-a680-4b93-9bb0-873538f54dbb' and s.slug='zhiyde')
 or (s.id='13e261af-16f4-4455-9873-fcc06e44b14d' and s.slug='b-eshmanbetov-atyndagy-orto-mektebi'));
-- Publication timestamps, is_published, foreign keys and all annual/media/editor rows are preserved.
commit;
