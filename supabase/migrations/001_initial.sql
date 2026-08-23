create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'viewer' check (role in ('viewer', 'operator', 'super_admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.profiles enable row level security;
alter table public.app_state enable row level security;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

drop policy if exists "profiles_read_self" on public.profiles;
create policy "profiles_read_self" on public.profiles
for select to authenticated using (id = auth.uid());

drop policy if exists "state_public_read" on public.app_state;
create policy "state_public_read" on public.app_state
for select to anon, authenticated using (true);

drop policy if exists "state_admin_insert" on public.app_state;
create policy "state_admin_insert" on public.app_state
for insert to authenticated with check (public.is_super_admin());

drop policy if exists "state_admin_update" on public.app_state;
create policy "state_admin_update" on public.app_state
for update to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "state_admin_delete" on public.app_state;
create policy "state_admin_delete" on public.app_state
for delete to authenticated using (public.is_super_admin());

insert into public.app_state (id, payload)
values ('primary', '{}'::jsonb)
on conflict (id) do nothing;

-- Setelah membuat user pertama di Supabase Auth, promosikan dengan SQL Editor:
-- insert into public.profiles (id, full_name, role)
-- values ('USER_UUID', 'Nama Admin', 'super_admin')
-- on conflict (id) do update set role = 'super_admin', updated_at = now();
