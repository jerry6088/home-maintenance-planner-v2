
-- Home Maintenance Planner V31 Cloud
-- Run this in Supabase SQL Editor once.

create extension if not exists pgcrypto;

create schema if not exists private;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (household_id,user_id)
);

create table if not exists public.household_state (
  household_id uuid primary key references public.households(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.task_photo_index (
  id uuid primary key,
  household_id uuid not null references public.households(id) on delete cascade,
  ref_key text not null,
  object_path text not null unique,
  original_name text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists household_members_user_idx on public.household_members(user_id);
create index if not exists task_photo_index_household_ref_idx on public.task_photo_index(household_id,ref_key);

create or replace function private.is_household_member(hid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.household_members hm
    where hm.household_id = hid
      and hm.user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_household_member(uuid) from public;
grant execute on function private.is_household_member(uuid) to authenticated;

create or replace function public.create_household(p_name text, p_display_name text default '')
returns table(household_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
  code text;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  insert into public.households(name, owner_id)
  values (coalesce(nullif(trim(p_name),''),'My Household'), (select auth.uid()))
  returning id, households.invite_code into hid, code;

  insert into public.household_members(household_id,user_id,display_name,role)
  values (hid,(select auth.uid()),coalesce(p_display_name,''),'owner');

  insert into public.household_state(household_id,state,updated_by)
  values (hid,'{}'::jsonb,(select auth.uid()));

  return query select hid,code;
end;
$$;

create or replace function public.join_household(p_invite_code text, p_display_name text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  hid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select h.id into hid
  from public.households h
  where upper(h.invite_code)=upper(trim(p_invite_code))
  limit 1;

  if hid is null then
    raise exception 'Invalid household code';
  end if;

  insert into public.household_members(household_id,user_id,display_name,role)
  values (hid,(select auth.uid()),coalesce(p_display_name,''),'member')
  on conflict (household_id,user_id)
  do update set display_name=excluded.display_name;

  return hid;
end;
$$;

grant execute on function public.create_household(text,text) to authenticated;
grant execute on function public.join_household(text,text) to authenticated;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_state enable row level security;
alter table public.task_photo_index enable row level security;

drop policy if exists households_select_member on public.households;
create policy households_select_member
on public.households for select to authenticated
using (private.is_household_member(id));

drop policy if exists members_select_household on public.household_members;
create policy members_select_household
on public.household_members for select to authenticated
using (private.is_household_member(household_id));

drop policy if exists members_update_self on public.household_members;
create policy members_update_self
on public.household_members for update to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists state_select_member on public.household_state;
create policy state_select_member
on public.household_state for select to authenticated
using (private.is_household_member(household_id));

drop policy if exists state_insert_member on public.household_state;
create policy state_insert_member
on public.household_state for insert to authenticated
with check (private.is_household_member(household_id));

drop policy if exists state_update_member on public.household_state;
create policy state_update_member
on public.household_state for update to authenticated
using (private.is_household_member(household_id))
with check (private.is_household_member(household_id));

drop policy if exists photo_index_select_member on public.task_photo_index;
create policy photo_index_select_member
on public.task_photo_index for select to authenticated
using (private.is_household_member(household_id));

drop policy if exists photo_index_insert_member on public.task_photo_index;
create policy photo_index_insert_member
on public.task_photo_index for insert to authenticated
with check (private.is_household_member(household_id) and created_by=(select auth.uid()));

drop policy if exists photo_index_delete_member on public.task_photo_index;
create policy photo_index_delete_member
on public.task_photo_index for delete to authenticated
using (private.is_household_member(household_id));

-- Private cloud photo bucket.
insert into storage.buckets (id,name,public)
values ('task-photos','task-photos',false)
on conflict (id) do nothing;

drop policy if exists task_photos_select_member on storage.objects;
create policy task_photos_select_member
on storage.objects for select to authenticated
using (
  bucket_id='task-photos'
  and private.is_household_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists task_photos_insert_member on storage.objects;
create policy task_photos_insert_member
on storage.objects for insert to authenticated
with check (
  bucket_id='task-photos'
  and private.is_household_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists task_photos_delete_member on storage.objects;
create policy task_photos_delete_member
on storage.objects for delete to authenticated
using (
  bucket_id='task-photos'
  and private.is_household_member(((storage.foldername(name))[1])::uuid)
);

grant select on public.households to authenticated;
grant select,update on public.household_members to authenticated;
grant select,insert,update on public.household_state to authenticated;
grant select,insert,delete on public.task_photo_index to authenticated;

-- Realtime: household_state is the shared state stream.
alter table public.household_state replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime'
      and schemaname='public'
      and tablename='household_state'
  ) then
    alter publication supabase_realtime add table public.household_state;
  end if;
end $$;
