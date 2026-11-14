-- Local review only. Preserve dormant rows for BOTH old and new clients.
begin;
alter function public.save_school_draft(uuid,integer,jsonb,boolean) rename to save_school_workspace_internal;
revoke all on function public.save_school_workspace_internal(uuid,integer,jsonb,boolean) from public,anon,authenticated;

create or replace function public.save_school_workspace_internal(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; item jsonb; info jsonb:=p_payload->'info'; site_admin boolean:=coalesce(public.is_admin(),false);
begin
  if not coalesce(public.can_edit_school(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_revision is null or p_payload is null or jsonb_typeof(info) is distinct from 'object' or octet_length(p_payload::text)>2000000 then raise exception 'Invalid payload'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if not site_admin and (
    (info ? 'slug' and info->>'slug' is distinct from s.slug) or
    nullif(info->>'territory_slug','') is distinct from s.territory_slug or
    nullif(info->>'village_slug','') is distinct from s.village_slug
  ) then raise exception 'Only Admin can change school identity or location' using errcode='42501'; end if;
  if s.status='review' and not site_admin then raise exception 'Under review'; end if;
  update public.schools set
    slug=case when info ? 'slug' then info->>'slug' else s.slug end,
    name_kg=info->>'name_kg',name_ru=info->>'name_ru',name_en=info->>'name_en',
    territory_slug=nullif(info->>'territory_slug',''),village_slug=nullif(info->>'village_slug',''),
    director_name=info->>'director_name',director_phone=info->>'director_phone',office_phone=info->>'office_phone',
    address_kg=info->>'address_kg',address_ru=info->>'address_ru',address_en=info->>'address_en',
    current_academic_year=nullif(info->>'current_academic_year',''),
    status=case when p_submit then 'review' else 'draft' end,review_note=null,revision=revision+1,updated_at=now() where id=s.id;
  delete from public.school_ort_years where school_id=s.id;
  for item in select value from jsonb_array_elements(coalesce(p_payload->'ort','[]')) loop
    insert into public.school_ort_years values(s.id,(item->>'year')::integer,item->>'academic_year',item->'scores');
  end loop;
  -- Deliberately no DML on the three frozen collections. Their IDs stay intact.
end;
$$;

create function public.save_school_draft(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools; info jsonb:=p_payload->'info';
begin
  if not coalesce(public.can_edit_school(p_school_id),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if p_payload is null or jsonb_typeof(info) is distinct from 'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
  if not coalesce(public.is_admin(),false) and (
    info->>'name_kg' is distinct from s.name_kg or
    nullif(info->>'name_ru','') is distinct from nullif(s.name_ru,'') or
    nullif(info->>'name_en','') is distinct from nullif(s.name_en,'')
  ) then raise exception 'Only Admin can change school identity' using errcode='42501'; end if;
  -- Ignore supplied dormant arrays; preserve the actual rows, including IDs.
  perform public.save_school_workspace_internal(s.id,p_revision,p_payload,p_submit);
end;
$$;

-- Versioned frontend entry point: absent migration must fail, never erase data.
create function public.save_school_active_draft(p_school_id uuid,p_revision integer,p_payload jsonb,p_submit boolean default false) returns void
language sql security invoker set search_path = public as $$
  select public.save_school_draft(p_school_id,p_revision,p_payload,p_submit);
$$;
revoke all on function public.save_school_draft(uuid,integer,jsonb,boolean),public.save_school_active_draft(uuid,integer,jsonb,boolean) from public,anon;
grant execute on function public.save_school_draft(uuid,integer,jsonb,boolean),public.save_school_active_draft(uuid,integer,jsonb,boolean) to authenticated;
commit;
