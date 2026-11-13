-- Local review only. No changes to profiles roles or public.is_admin().
begin;
create table public.news_editor_assignments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check(username ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(username) between 3 and 40),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.news_editor_assignments enable row level security;
revoke all on public.news_editor_assignments from public,anon,authenticated;
grant select on public.news_editor_assignments to authenticated;
grant select,insert,update,delete on public.news_editor_assignments to service_role;
create policy news_access_admin_read on public.news_editor_assignments for select to authenticated using(public.is_admin());

create function public.can_manage_news() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and (coalesce(public.is_admin(),false) or exists (
    select 1 from public.news_editor_assignments a
    join auth.sessions s on s.user_id=a.user_id
      and s.id::text=(auth.jwt()->>'session_id')
    where a.user_id=auth.uid() and a.is_active
  ));
$$;
revoke all on function public.can_manage_news() from public,anon;
grant execute on function public.can_manage_news() to authenticated;

-- The public published-news policy and all table grants remain unchanged.
alter policy news_admin_read_all on public.news using(public.can_manage_news());
alter policy news_admin_insert on public.news with check(public.can_manage_news());
alter policy news_admin_update on public.news using(public.can_manage_news()) with check(public.can_manage_news());
alter policy news_admin_delete on public.news using(public.can_manage_news());

-- Additional username-based throttle for the public PIN login proxy.
-- This schema is not exposed, contains no PINs, passwords or emails.
create schema editor_access_private;
revoke all on schema editor_access_private from public,anon,authenticated;
create table editor_access_private.login_attempts (
  username text primary key,
  started_at timestamptz not null,
  attempts integer not null
);
revoke all on editor_access_private.login_attempts from public,anon,authenticated;
alter table editor_access_private.login_attempts enable row level security;
-- Read-only gate: successful authentication never spends a failure allowance.
create function public.can_attempt_news_login(p_username text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.news_editor_assignments where username=p_username and is_active)
    and not exists(select 1 from editor_access_private.login_attempts
      where username=p_username and attempts>=8 and started_at>now()-interval '15 minutes');
$$;
-- Serialize completion per username. A late success may not unlock a bucket
-- which has already reached eight failures; only window expiry unblocks it.
create function public.finish_news_login_attempt(p_username text,p_success boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare bucket editor_access_private.login_attempts;
begin
  if p_success is null or not exists(select 1 from public.news_editor_assignments where username=p_username and is_active) then return false; end if;
  insert into editor_access_private.login_attempts values(p_username,now(),0) on conflict do nothing;
  select * into bucket from editor_access_private.login_attempts where username=p_username for update;
  if bucket.started_at<=now()-interval '15 minutes' then
    update editor_access_private.login_attempts set attempts=0,started_at=now() where username=p_username;
    bucket.attempts:=0;
  end if;
  if bucket.attempts>=8 then return false; end if;
  if p_success then
    -- Keep a stable lockable row across concurrent completion requests.
    update editor_access_private.login_attempts set attempts=0,started_at=now() where username=p_username;
    return true;
  end if;
  update editor_access_private.login_attempts set
    started_at=case when attempts=0 then now() else started_at end,
    attempts=attempts+1 where username=p_username;
  return false;
end;
$$;
revoke all on function public.can_attempt_news_login(text),public.finish_news_login_attempt(text,boolean) from public,anon,authenticated;
grant execute on function public.can_attempt_news_login(text),public.finish_news_login_attempt(text,boolean) to service_role;
commit;
