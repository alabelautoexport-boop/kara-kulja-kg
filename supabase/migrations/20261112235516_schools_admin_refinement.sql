-- Review locally; do not apply to production automatically.
-- Extends the already-applied 20261112000000_schools.sql without rewriting it.
begin;

alter table public.schools add column is_archived boolean not null default false;
alter table public.schools add column archived_at timestamptz;

create or replace function public.can_edit_school(p_school_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.is_admin(),false) or exists (
    select 1 from public.school_editor_assignments a
    join public.schools s on s.id=a.school_id
    where a.school_id=p_school_id and a.user_id=auth.uid() and not s.is_archived
  );
$$;

-- The existing save/review RPCs lock schools before mutation. This guard also
-- rolls back any snapshot write made by review_school on an archived school.
create function public.guard_archived_school() returns trigger
language plpgsql set search_path = public as $$
begin
  if old.is_archived and new.is_archived then
    raise exception 'School archived';
  end if;
  return new;
end;
$$;
create trigger schools_archive_guard before update on public.schools
for each row execute function public.guard_archived_school();

-- Same Cyrillic transliteration as the existing News slug generator.
create function public.school_slug_base(p_name text) returns text
language plpgsql immutable set search_path = public as $$
declare result text := lower(trim(p_name)); pair text[];
begin
  foreach pair slice 1 in array array[
    ['а','a'],['б','b'],['в','v'],['г','g'],['д','d'],['е','e'],['ё','yo'],['ж','zh'],['з','z'],
    ['и','i'],['й','y'],['к','k'],['л','l'],['м','m'],['н','n'],['ң','ng'],['о','o'],['ө','o'],
    ['п','p'],['р','r'],['с','s'],['т','t'],['у','u'],['ү','u'],['ф','f'],['х','kh'],['ц','ts'],
    ['ч','ch'],['ш','sh'],['щ','shch'],['ъ',''],['ы','y'],['ь',''],['э','e'],['ю','yu'],['я','ya']
  ] loop result := replace(result,pair[1],pair[2]); end loop;
  result := trim(both '-' from left(trim(both '-' from regexp_replace(result,'[^a-z0-9]+','-','g')),96));
  return coalesce(nullif(result,''),'school');
end;
$$;

create function public.create_school_auto(p_name_kg text) returns uuid
language plpgsql security definer set search_path = public as $$
declare base text; candidate text; suffix integer := 1; result uuid;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  if p_name_kg is null or length(trim(p_name_kg)) not between 1 and 300 then
    raise exception 'Invalid school name' using errcode='22023';
  end if;
  base := public.school_slug_base(p_name_kg);
  loop
    candidate := base || case when suffix=1 then '' else '-' || suffix::text end;
    -- The unique constraint arbitrates concurrent inserts; no check-then-insert race.
    insert into public.schools(slug,name_kg) values(candidate,trim(p_name_kg))
      on conflict(slug) do nothing returning id into result;
    if result is not null then return result; end if;
    suffix := suffix+1;
  end loop;
end;
$$;

create function public.set_school_archived(p_school_id uuid,p_revision integer,p_archived boolean) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if p_archived is null then raise exception 'Invalid archive state' using errcode='22023'; end if;
  if s.is_archived=p_archived then return; end if;
  -- Keep the snapshot and its publication timestamp; restore never republishes.
  update public.school_publications set is_published=false where school_id=s.id;
  update public.schools set is_archived=p_archived,
    archived_at=case when p_archived then now() else null end,
    status='draft',revision=revision+1,updated_at=now() where id=s.id;
end;
$$;

create function public.permanently_delete_school(p_school_id uuid,p_revision integer,p_confirm_name text) returns void
language plpgsql security definer set search_path = public as $$
declare s public.schools;
begin
  if not coalesce(public.is_admin(),false) then raise exception 'Not authorized' using errcode='42501'; end if;
  select * into s from public.schools where id=p_school_id for update;
  if not found then raise exception 'School not found' using errcode='P0002'; end if;
  if p_revision is null or s.revision<>p_revision then raise exception 'Revision conflict'; end if;
  if not s.is_archived then raise exception 'Archive school before permanent deletion' using errcode='22023'; end if;
  if p_confirm_name is distinct from s.name_kg then raise exception 'School name confirmation required' using errcode='22023'; end if;
  delete from public.school_editor_assignments where school_id=s.id;
  delete from public.school_year_stats where school_id=s.id;
  delete from public.school_ort_years where school_id=s.id;
  delete from public.school_achievements where school_id=s.id;
  delete from public.school_ort_resources where school_id=s.id;
  delete from public.school_publications where school_id=s.id;
  delete from public.schools where id=s.id;
end;
$$;

revoke all on function public.school_slug_base(text),public.guard_archived_school() from public,anon,authenticated;
revoke all on function public.create_school_auto(text),public.set_school_archived(uuid,integer,boolean),
  public.permanently_delete_school(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.create_school_auto(text),public.set_school_archived(uuid,integer,boolean),
  public.permanently_delete_school(uuid,integer,text) to authenticated;
-- All table grants, RLS policies and existing RESTRICT foreign keys stay intact.
commit;
