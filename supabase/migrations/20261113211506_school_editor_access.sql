-- LOCAL ONLY. Extends existing assignments; does not rewrite School Media/News migrations.
begin;
-- Match the reviewed production role contract without rewriting historical migrations
-- or silently changing any existing profile's role value.
alter table public.profiles alter column role drop default;
alter table public.profiles alter column role drop not null;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('owner','admin','editor'));

alter table public.school_editor_assignments
 add column username text,
 add column is_active boolean not null default true,
 add column created_at timestamptz not null default now(),
 add column updated_at timestamptz not null default now(),
 add constraint school_editor_username check(username is null or (length(username) between 3 and 40 and username ~ '^[a-z0-9]+(-[a-z0-9]+)*$'));
create unique index school_managed_username on public.school_editor_assignments(username) where username is not null;
create unique index school_managed_school on public.school_editor_assignments(school_id) where username is not null;
create unique index school_managed_user on public.school_editor_assignments(user_id) where username is not null;
grant select,insert,update,delete on public.school_editor_assignments to service_role;
grant select on public.profiles to service_role;

create function public.managed_school_identity(p_school_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.school_editor_assignments a
 join auth.users u on u.id=a.user_id join public.profiles p on p.id=u.id
 where a.school_id=p_school_id and a.username is not null and p.role is null
 and u.email='school-'||a.username||'@editors.kara-kulja.invalid'
 and u.raw_app_meta_data->>'school_editor_managed'='true'
 and coalesce(u.raw_app_meta_data->>'news_editor_managed','false')<>'true'
 and (select count(*) from public.school_editor_assignments x where x.user_id=u.id)=1
 and not exists(select 1 from public.news_editor_assignments n where n.user_id=u.id));
$$;
revoke all on function public.managed_school_identity(uuid) from public,anon,authenticated;
grant execute on function public.managed_school_identity(uuid) to service_role;

create function public.guard_managed_school_assignment() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 perform 1 from auth.users where id=new.user_id for update;
 if new.username is not null then
  if not exists(select 1 from auth.users u join public.profiles p on p.id=u.id where u.id=new.user_id and p.role is null
   and u.email='school-'||new.username||'@editors.kara-kulja.invalid'
   and u.raw_app_meta_data->>'school_editor_managed'='true'
   and coalesce(u.raw_app_meta_data->>'news_editor_managed','false')<>'true')
   or exists(select 1 from public.news_editor_assignments where user_id=new.user_id)
   or exists(select 1 from public.school_editor_assignments where user_id=new.user_id and school_id<>new.school_id)
   then raise exception 'Invalid managed school identity'; end if;
 elsif exists(select 1 from public.school_editor_assignments where user_id=new.user_id and username is not null and school_id<>new.school_id)
 then raise exception 'Managed editor has one school'; end if;
 new.updated_at:=now();return new;
end; $$;
revoke all on function public.guard_managed_school_assignment() from public,anon,authenticated;
create trigger managed_school_assignment before insert or update on public.school_editor_assignments for each row execute function public.guard_managed_school_assignment();
create function public.guard_news_school_separation() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 perform 1 from auth.users where id=new.user_id for update;
 if exists(select 1 from public.school_editor_assignments where user_id=new.user_id and username is not null)
 or exists(select 1 from auth.users where id=new.user_id and raw_app_meta_data->>'school_editor_managed'='true') then raise exception 'School and News identities must be separate'; end if;
 return new;
end; $$;
revoke all on function public.guard_news_school_separation() from public,anon,authenticated;
create trigger news_school_separation before insert or update on public.news_editor_assignments for each row execute function public.guard_news_school_separation();

create function public.school_editor_session_allowed(p_school_id uuid,p_user_id uuid,p_session_id text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.school_editor_assignments a join public.schools s on s.id=a.school_id
 where a.school_id=p_school_id and a.user_id=p_user_id and a.is_active and not s.is_archived and
 (a.username is null or (public.managed_school_identity(a.school_id) and exists(select 1 from auth.sessions x where x.user_id=a.user_id and x.id::text=p_session_id))));
$$;
revoke all on function public.school_editor_session_allowed(uuid,uuid,text) from public,anon,authenticated;
create or replace function public.can_edit_school(p_school_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select coalesce(public.is_admin(),false) or public.school_editor_session_allowed(p_school_id,auth.uid(),auth.jwt()->>'session_id');
$$;
create or replace function public.can_manage_school_media(p_school_id uuid) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.schools s where s.id=p_school_id and (coalesce(public.is_admin(),false) or (s.status<>'review' and public.can_edit_school(s.id))));
$$;
create function public.current_school_editor_school() returns uuid
language sql stable security definer set search_path=public as $$
 select a.school_id from public.school_editor_assignments a where a.user_id=auth.uid() and a.username is not null
 and public.managed_school_identity(a.school_id) and public.school_editor_session_allowed(a.school_id,auth.uid(),auth.jwt()->>'session_id') limit 1;
$$;
revoke all on function public.current_school_editor_school() from public,anon;
grant execute on function public.current_school_editor_school() to authenticated;
-- Own assignment may be read only while it still authorizes the current session.
alter policy assignments_read on public.school_editor_assignments using(public.is_admin() or (user_id=auth.uid() and public.can_edit_school(school_id)));

-- Upload completion rechecks the exact authenticated session after the R2 writes.
alter function public.complete_school_media(uuid,uuid,jsonb,jsonb) rename to complete_school_media_before_access;
revoke all on function public.complete_school_media_before_access(uuid,uuid,jsonb,jsonb) from public,anon,authenticated,service_role;
create function public.complete_school_media(p_id uuid,p_actor uuid,p_main jsonb,p_thumb jsonb,p_session_id text default null) returns void
language plpgsql security definer set search_path=public as $$
declare sid uuid;
begin
 select school_id into sid from public.school_media where id=p_id;
 perform 1 from public.schools where id=sid for update;
 if not exists(select 1 from public.profiles where id=p_actor and role='admin') and not
 (public.school_editor_session_allowed(sid,p_actor,p_session_id) and exists(select 1 from public.schools where id=sid and status<>'review')) then raise exception 'Not authorized' using errcode='42501'; end if;
 perform public.complete_school_media_before_access(p_id,p_actor,p_main,p_thumb);
end; $$;
revoke all on function public.complete_school_media(uuid,uuid,jsonb,jsonb,text) from public,anon,authenticated;
grant execute on function public.complete_school_media(uuid,uuid,jsonb,jsonb,text) to service_role;

-- No browser-provided Auth user ID: resolve only the managed school assignment.
create function public.revoke_school_editor_sessions(p_school_id uuid) returns void
language plpgsql security definer set search_path=public as $$
declare target uuid;
begin
 if not public.managed_school_identity(p_school_id) then raise exception 'Invalid managed identity'; end if;
 select user_id into target from public.school_editor_assignments where school_id=p_school_id and username is not null for update;
 update public.school_editor_assignments set updated_at=now() where school_id=p_school_id and user_id=target;
 delete from auth.refresh_tokens where user_id=target::text;
 delete from auth.sessions where user_id=target;
end; $$;
revoke all on function public.revoke_school_editor_sessions(uuid) from public,anon,authenticated;
grant execute on function public.revoke_school_editor_sessions(uuid) to service_role;

create table editor_access_private.school_login_attempts(username text primary key,started_at timestamptz not null default now(),attempts integer not null default 0,locked_until timestamptz);
alter table editor_access_private.school_login_attempts enable row level security;
revoke all on editor_access_private.school_login_attempts from public,anon,authenticated;
create function public.can_attempt_school_login(p_username text) returns boolean
language sql stable security definer set search_path=public as $$
 select exists(select 1 from public.school_editor_assignments a where a.username=p_username and a.is_active)
 and not exists(select 1 from editor_access_private.school_login_attempts where username=p_username and locked_until>now());
$$;
create function public.finish_school_login_attempt(p_username text,p_success boolean) returns boolean
language plpgsql security definer set search_path=public as $$
declare b editor_access_private.school_login_attempts;
begin
 if p_success is null or not exists(select 1 from public.school_editor_assignments where username=p_username and is_active) then return false; end if;
 insert into editor_access_private.school_login_attempts(username) values(p_username) on conflict do nothing;
 select * into b from editor_access_private.school_login_attempts where username=p_username for update;
 if b.locked_until>now() then return false; end if;
 if b.locked_until is not null or b.started_at<=now()-interval '15 minutes' then b.attempts:=0; end if;
 if p_success then update editor_access_private.school_login_attempts set attempts=0,locked_until=null,started_at=now() where username=p_username;return true; end if;
 update editor_access_private.school_login_attempts set attempts=b.attempts+1,locked_until=case when b.attempts+1>=8 then now()+interval '15 minutes' else null end,started_at=case when b.attempts=0 then now() else started_at end where username=p_username;
 return false;
end; $$;
revoke all on function public.can_attempt_school_login(text),public.finish_school_login_attempt(text,boolean) from public,anon,authenticated;
grant execute on function public.can_attempt_school_login(text),public.finish_school_login_attempt(text,boolean) to service_role;
commit;
