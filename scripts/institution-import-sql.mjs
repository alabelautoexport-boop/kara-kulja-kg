// Generates a reviewed DML transaction only. This module never opens a database connection.
export function institutionImportSql(plan) {
  const tag = "$institution_import_v3$";
  const literal = JSON.stringify(plan);
  if (literal.includes(tag)) throw new Error("Unexpected import delimiter in source data");
  const protectedState = `select jsonb_build_object(
    'annual',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by school_id,academic_year)::text,'[]')) from public.school_year_stats x),
    'ort',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by school_id,year)::text,'[]')) from public.school_ort_years x),
    'achievements',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]')) from public.school_achievements x),
    'resources',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]')) from public.school_ort_resources x),
    'media',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]')) from public.school_media x),
    'editors',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by school_id,user_id)::text,'[]')) from public.school_editor_assignments x),
    'profiles',(select md5(coalesce(jsonb_agg(to_jsonb(x) order by id)::text,'[]')) from public.profiles x),
    'auth_ids',(select md5(coalesce(jsonb_agg(id order by id)::text,'[]')) from auth.users)
  )`;
  const fixedSchoolState = `select jsonb_agg(jsonb_build_object('id',id,'slug',slug,'year',current_academic_year,'director',director_name,'director_phone',director_phone,'office_phone',office_phone) order by slug) from public.schools where id in ('5f36794c-a680-4b93-9bb0-873538f54dbb','13e261af-16f4-4455-9873-fcc06e44b14d')`;
  const fixedPublications = `select jsonb_agg(jsonb_build_object('id',school_id,'slug',slug,'published_at',published_at,'sections',document-'info','other_info',(document->'info')-array['name_kg','name_ru','name_en','address_kg','address_ru','address_en','short_name_kg','short_name_ru','short_name_en','school_type']) order by slug) from public.school_publications where school_id in ('5f36794c-a680-4b93-9bb0-873538f54dbb','13e261af-16f4-4455-9873-fcc06e44b14d')`;
  return `-- Approved final Excel import: 2 updates, 51 new schools, 56 new kindergartens, all published.
-- No DDL and no annual/ORT/media/editor/account writes. Source text is data, never executable SQL.
begin;
set local standard_conforming_strings=on;
select pg_advisory_xact_lock(61253356);
lock table public.schools,public.kindergartens,public.school_publications,public.kindergarten_publications in share row exclusive mode;
do ${tag}
declare
 payload jsonb := '${literal.replaceAll("'", "''")}'::jsonb;
 item jsonb; info jsonb; s public.schools; k public.kindergartens;
 before_state jsonb; after_state jsonb; old_school_state jsonb; old_publications jsonb;
 school_state jsonb; publication_state jsonb; public_info jsonb;
 base text; candidate text; suffix integer; found_id uuid;
begin
 if jsonb_array_length(payload->'schools')<>53 or jsonb_array_length(payload->'kindergartens')<>56 then raise exception 'Unexpected source counts'; end if;
 -- A complete identical rerun is a no-op. Partial/unrelated state always fails closed.
 if (select count(*) from public.schools)=53 and (select count(*) from public.kindergartens)=56 then
   if exists(select 1 from jsonb_array_elements(payload->'schools') p where not exists(
     select 1 from public.schools existing_school where existing_school.source_metadata->>'source_sha256'=payload->>'sha256'
       and existing_school.source_metadata->>'excel_number'=p->>'number' and to_jsonb(existing_school) @> (p->'info') and existing_school.status='published'))
    or exists(select 1 from jsonb_array_elements(payload->'kindergartens') p where not exists(
     select 1 from public.kindergartens existing_garden where existing_garden.source_metadata->>'source_sha256'=payload->>'sha256'
       and existing_garden.source_metadata->>'excel_number'=p->>'number' and to_jsonb(existing_garden) @> (p->'info') and existing_garden.status='published'))
    or (select count(*) from public.school_publications where is_published)<>53
    or (select count(*) from public.kindergarten_publications where is_published)<>56
   then raise exception 'Completed import differs from reviewed plan; no overwrite'; end if;
   return;
 end if;
 if (select count(*) from public.schools)<>2 or (select count(*) from public.kindergartens)<>0 then raise exception 'Unexpected existing institutions; review before import'; end if;
 for item in select value from jsonb_array_elements(payload->'schools') where value ? 'existing_id' loop
   select * into s from public.schools where id=(item->>'existing_id')::uuid for update;
   if not found or s.slug<>item->>'existing_slug' or s.revision<>(item->>'expected_revision')::integer or s.is_archived or s.status<>'published' then
     raise exception 'Existing school identity/revision changed; no overwrite';
   end if;
 end loop;
 ${protectedState} into before_state;
 ${fixedSchoolState} into old_school_state;
 ${fixedPublications} into old_publications;
 for item in select value from jsonb_array_elements(payload->'schools') loop
   info:=item->'info';
   if not public.valid_institution_source(info->'source_metadata') or not public.valid_institution_location(info->>'territory_slug',info->>'village_slug') then raise exception 'Invalid school source/location'; end if;
   if item ? 'existing_id' then
     update public.schools set
       name_kg=info->>'name_kg',name_ru=info->>'name_ru',name_en=info->>'name_en',
       short_name_kg=info->>'short_name_kg',short_name_ru=info->>'short_name_ru',short_name_en=info->>'short_name_en',
       address_kg=info->>'address_kg',address_ru=info->>'address_ru',address_en=info->>'address_en',
       school_type=info->>'school_type',territory_slug=info->>'territory_slug',village_slug=info->>'village_slug',source_metadata=info->'source_metadata',
       revision=revision+1,updated_at=now()
     where id=(item->>'existing_id')::uuid returning * into s;
   else
     base:=public.school_slug_base(info->>'name_kg');suffix:=1;found_id:=null;
     loop
       candidate:=base||case when suffix=1 then '' else '-'||suffix::text end;
       insert into public.schools(slug,name_kg,name_ru,name_en,short_name_kg,short_name_ru,short_name_en,address_kg,address_ru,address_en,school_type,territory_slug,village_slug,source_metadata,status,revision)
       values(candidate,info->>'name_kg',info->>'name_ru',info->>'name_en',info->>'short_name_kg',info->>'short_name_ru',info->>'short_name_en',info->>'address_kg',info->>'address_ru',info->>'address_en',info->>'school_type',info->>'territory_slug',info->>'village_slug',info->'source_metadata','published',1)
       on conflict(slug) do nothing returning id into found_id;
       exit when found_id is not null;suffix:=suffix+1;
     end loop;
     select * into s from public.schools where id=found_id;
   end if;
   -- Explicit public whitelist; never to_jsonb(s) or source metadata.
   public_info:=jsonb_build_object('slug',s.slug,'name_kg',s.name_kg,'name_ru',s.name_ru,'name_en',s.name_en,
     'short_name_kg',s.short_name_kg,'short_name_ru',s.short_name_ru,'short_name_en',s.short_name_en,
     'address_kg',s.address_kg,'address_ru',s.address_ru,'address_en',s.address_en,'school_type',s.school_type,
     'territory_slug',s.territory_slug,'village_slug',s.village_slug,
     'director_name',coalesce(s.director_name,''),'director_phone',coalesce(s.director_phone,''),'office_phone',coalesce(s.office_phone,''),'current_academic_year',coalesce(s.current_academic_year,''));
   insert into public.school_publications as published(school_id,slug,document,is_published)
    values(s.id,s.slug,jsonb_build_object('info',public_info,'stats','[]'::jsonb,'ort','[]'::jsonb,'achievements','[]'::jsonb,'resources','[]'::jsonb,'media',jsonb_build_object('cover',null,'gallery','[]'::jsonb)),true)
   on conflict(school_id) do update set document=jsonb_set(published.document,'{info}',(published.document->'info')||(public_info-array['director_name','director_phone','office_phone','current_academic_year'])),is_published=true;
 end loop;
 for item in select value from jsonb_array_elements(payload->'kindergartens') loop
   info:=item->'info';base:=public.school_slug_base(info->>'name_kg');suffix:=1;found_id:=null;
   loop
     candidate:=base||case when suffix=1 then '' else '-'||suffix::text end;
     insert into public.kindergartens(slug,type,name_kg,name_ru,name_en,short_name_kg,short_name_ru,short_name_en,address_kg,address_ru,address_en,territory_slug,village_slug,source_metadata,status,revision)
     values(candidate,info->>'type',info->>'name_kg',info->>'name_ru',info->>'name_en',info->>'short_name_kg',info->>'short_name_ru',info->>'short_name_en',info->>'address_kg',info->>'address_ru',info->>'address_en',info->>'territory_slug',info->>'village_slug',info->'source_metadata','published',1)
     on conflict(slug) do nothing returning id into found_id;
     exit when found_id is not null;suffix:=suffix+1;
   end loop;
   select * into k from public.kindergartens where id=found_id;
   insert into public.kindergarten_publications(kindergarten_id,slug,document,is_published)
    values(k.id,k.slug,jsonb_build_object('info',jsonb_build_object(
      'name_kg',k.name_kg,'name_ru',k.name_ru,'name_en',k.name_en,'type',k.type,
      'short_name_kg',k.short_name_kg,'short_name_ru',k.short_name_ru,'short_name_en',k.short_name_en,
      'address_kg',k.address_kg,'address_ru',k.address_ru,'address_en',k.address_en,'territory_slug',k.territory_slug,'village_slug',k.village_slug)),true);
 end loop;
 ${protectedState} into after_state;
 ${fixedSchoolState} into school_state;
 ${fixedPublications} into publication_state;
 if after_state is distinct from before_state or school_state is distinct from old_school_state or publication_state is distinct from old_publications then raise exception 'Protected related data changed; import rolled back'; end if;
 if (select count(*) from public.schools)<>53 or (select count(*) from public.kindergartens)<>56 or
    (select count(*) from public.school_publications where is_published)<>53 or (select count(*) from public.kindergarten_publications where is_published)<>56 then raise exception 'Unexpected final counts'; end if;
 if exists(select 1 from public.schools group by lower(regexp_replace(name_kg,'[[:space:][:punct:]]','','g')),territory_slug,village_slug having count(*)>1)
    or exists(select 1 from public.kindergartens group by lower(regexp_replace(name_kg,'[[:space:][:punct:]]','','g')),territory_slug,village_slug having count(*)>1)
    or exists(select 1 from public.schools where short_name_kg='' or short_name_ru='' or short_name_en='')
    or exists(select 1 from public.kindergartens where short_name_kg='' or short_name_ru='' or short_name_en='') then raise exception 'Duplicate or missing catalog name; import rolled back'; end if;
end;
${tag};
commit;
select jsonb_build_object('schools',(select count(*) from public.schools),'kindergartens',(select count(*) from public.kindergartens),'published_schools',(select count(*) from public.school_publications where is_published),'published_kindergartens',(select count(*) from public.kindergarten_publications where is_published)) as import_result;
`;
}
