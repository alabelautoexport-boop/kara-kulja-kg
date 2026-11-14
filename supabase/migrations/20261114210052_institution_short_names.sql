-- Minimal independent localized catalog names. Full official names and existing architecture stay intact.
begin;
alter table public.schools add column short_name_kg text not null default '' check(length(short_name_kg)<=120);
alter table public.schools add column short_name_ru text not null default '' check(length(short_name_ru)<=120);
alter table public.schools add column short_name_en text not null default '' check(length(short_name_en)<=120);
alter table public.kindergartens add column short_name_kg text not null default '' check(length(short_name_kg)<=120);
alter table public.kindergartens add column short_name_ru text not null default '' check(length(short_name_ru)<=120);
alter table public.kindergartens add column short_name_en text not null default '' check(length(short_name_en)<=120);

create or replace function public.save_school_draft(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; info jsonb:=p_payload->'info'; next_type text; field text; next_short jsonb;
begin
 if not coalesce(public.can_edit_school(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 select * into s from public.schools where id=p_school_id for update;
 if not found then raise exception 'School not found' using errcode='P0002'; end if;
 if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
 if jsonb_typeof(info) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 next_short:=jsonb_build_object('short_name_kg',s.short_name_kg,'short_name_ru',s.short_name_ru,'short_name_en',s.short_name_en);
 foreach field in array array['short_name_kg','short_name_ru','short_name_en'] loop
   if info ? field then
     if jsonb_typeof(info->field) is distinct from 'string' or length(info->>field)>120 then
       raise exception 'Invalid short name' using errcode='22023';
     end if;
     if not coalesce(public.is_admin(),false) and info->>field is distinct from next_short->>field then
       raise exception 'Only Admin can change short names' using errcode='42501';
     end if;
     next_short:=jsonb_set(next_short,array[field],info->field);
   end if;
 end loop;
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
 update public.schools set short_name_kg=next_short->>'short_name_kg',short_name_ru=next_short->>'short_name_ru',short_name_en=next_short->>'short_name_en',school_type=next_type,
   source_metadata=case when info ? 'source_metadata' then info->'source_metadata' else source_metadata end
 where id=p_school_id;
end;
$$;

create or replace function public.review_school_media_internal(p_school_id uuid,p_revision integer,p_action text,p_note text,p_media_verified boolean,p_actor uuid) returns void
language plpgsql security definer set search_path = public as $$
declare selected_type text; short_names jsonb;
begin
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') then
   raise exception 'Not authorized' using errcode='42501';
 end if;
 select school_type,jsonb_build_object('short_name_kg',short_name_kg,'short_name_ru',short_name_ru,'short_name_en',short_name_en) into selected_type,short_names from public.schools where id=p_school_id for update;
 if p_action='publish' and selected_type is null then raise exception 'School type required' using errcode='22023'; end if;
 perform public.review_school_before_institution_types(p_school_id,p_revision,p_action,p_note,p_media_verified,p_actor);
 if p_action='publish' then
   update public.school_publications set document=jsonb_set(document,'{info}',(document->'info')||short_names||jsonb_build_object('school_type',selected_type))
    where school_id=p_school_id;
 end if;
end;
$$;

create or replace function public.save_kindergarten(p_id uuid,p_revision integer,p_payload jsonb,p_publish boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare k public.kindergartens; approved jsonb; field text;
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
 if p_payload is null or jsonb_typeof(p_payload) is distinct from 'object' or octet_length(p_payload::text)>65536 or p_publish is null then
   raise exception 'Invalid payload' using errcode='22023';
 end if;
 foreach field in array array['short_name_kg','short_name_ru','short_name_en','type','name_kg','name_ru','name_en','address_kg','address_ru','address_en','territory_slug','village_slug'] loop
   if (field in ('type','name_kg','territory_slug','village_slug') or p_payload ? field) and jsonb_typeof(p_payload->field) is distinct from 'string' then
     raise exception 'Invalid institution field' using errcode='22023';
   end if;
 end loop;
 select * into k from public.kindergartens where id=p_id for update;
 if not found then raise exception 'Kindergarten not found' using errcode='P0002'; end if;
 if p_revision is null or p_revision<>k.revision then raise exception 'Revision conflict'; end if;
 if p_payload ? 'slug' and p_payload->>'slug' is distinct from k.slug then raise exception 'Slug is immutable' using errcode='22023'; end if;
 update public.kindergartens set
   short_name_kg=coalesce(p_payload->>'short_name_kg',k.short_name_kg),short_name_ru=coalesce(p_payload->>'short_name_ru',k.short_name_ru),short_name_en=coalesce(p_payload->>'short_name_en',k.short_name_en),
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
     'short_name_kg',k.short_name_kg,'short_name_ru',k.short_name_ru,'short_name_en',k.short_name_en,
     'type',k.type,'name_kg',k.name_kg,'name_ru',k.name_ru,'name_en',k.name_en,
     'address_kg',k.address_kg,'address_ru',k.address_ru,'address_en',k.address_en,
     'territory_slug',k.territory_slug,'village_slug',k.village_slug));
   insert into public.kindergarten_publications(kindergarten_id,slug,document)
     values(k.id,k.slug,approved)
   on conflict(kindergarten_id) do update set document=excluded.document,is_published=true,published_at=now();
 end if;
end;
$$;
commit;
