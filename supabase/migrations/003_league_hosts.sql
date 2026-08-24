create table if not exists public.league_host_invitations (
  id uuid primary key default gen_random_uuid(),
  league_id text not null,
  email text not null,
  invited_user_id uuid references auth.users(id) on delete set null,
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists league_host_invitations_one_pending
  on public.league_host_invitations (league_id, lower(email))
  where status = 'pending';

create table if not exists public.league_hosts (
  league_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  invitation_id uuid references public.league_host_invitations(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  assigned_by uuid not null references auth.users(id),
  assigned_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id),
  revoked_at timestamptz,
  primary key (league_id, user_id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  league_id text,
  action text not null,
  target_type text not null,
  target_id text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.league_host_invitations enable row level security;
alter table public.league_hosts enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_league_host(target_league_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_hosts
    where league_id = target_league_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.can_operate_league(target_league_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or public.is_league_host(target_league_id);
$$;

create or replace function public.my_access_context()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'is_super_admin', public.is_super_admin(),
    'hosted_league_ids', coalesce(
      (
        select jsonb_agg(league_id order by league_id)
        from public.league_hosts
        where user_id = auth.uid() and status = 'active'
      ),
      '[]'::jsonb
    )
  );
$$;

create or replace function public.create_league_host_invitation(
  target_league_id text,
  target_email text
)
returns public.league_host_invitations
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  normalized_email text := lower(trim(target_email));
  target_user_id uuid;
  invitation public.league_host_invitations;
begin
  if not public.is_super_admin() then
    raise exception 'Hanya super admin yang dapat mengundang host liga.' using errcode = '42501';
  end if;

  if normalized_email = '' or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Alamat email tidak valid.' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.app_state state,
      jsonb_array_elements(coalesce(state.payload -> 'leagues', '[]'::jsonb)) league
    where state.id = 'primary' and league ->> 'id' = target_league_id
  ) then
    raise exception 'Liga tidak ditemukan.' using errcode = 'P0002';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = normalized_email
  limit 1;

  if target_user_id is not null and exists (
    select 1 from public.league_hosts
    where league_id = target_league_id and user_id = target_user_id and status = 'active'
  ) then
    raise exception 'Pengguna tersebut sudah menjadi host aktif liga ini.' using errcode = '23505';
  end if;

  update public.league_host_invitations
  set status = 'expired', updated_at = now()
  where league_id = target_league_id
    and lower(email) = normalized_email
    and status = 'pending'
    and expires_at <= now();

  insert into public.league_host_invitations (
    league_id, email, invited_user_id, invited_by
  ) values (
    target_league_id, normalized_email, target_user_id, auth.uid()
  )
  returning * into invitation;

  insert into public.audit_logs (
    actor_id, league_id, action, target_type, target_id, new_value
  ) values (
    auth.uid(), target_league_id, 'league_host.invited', 'league_host_invitation', invitation.id::text,
    jsonb_build_object('email', normalized_email, 'expires_at', invitation.expires_at)
  );

  return invitation;
end;
$$;

create or replace function public.accept_my_league_host_invitations()
returns setof public.league_hosts
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation public.league_host_invitations;
  accepted_host public.league_hosts;
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan untuk menerima undangan.' using errcode = '42501';
  end if;

  for invitation in
    select *
    from public.league_host_invitations
    where status = 'pending'
      and expires_at > now()
      and (invited_user_id = auth.uid() or lower(email) = current_email)
    for update
  loop
    insert into public.league_hosts (
      league_id, user_id, invitation_id, status, assigned_by
    ) values (
      invitation.league_id, auth.uid(), invitation.id, 'active', invitation.invited_by
    )
    on conflict (league_id, user_id) do update set
      invitation_id = excluded.invitation_id,
      status = 'active',
      assigned_by = excluded.assigned_by,
      assigned_at = now(),
      revoked_by = null,
      revoked_at = null
    returning * into accepted_host;

    update public.league_host_invitations
    set status = 'accepted', invited_user_id = auth.uid(), accepted_at = now(), updated_at = now()
    where id = invitation.id;

    insert into public.audit_logs (
      actor_id, league_id, action, target_type, target_id, new_value
    ) values (
      auth.uid(), invitation.league_id, 'league_host.accepted', 'league_host', auth.uid()::text,
      jsonb_build_object('invitation_id', invitation.id)
    );

    return next accepted_host;
  end loop;
end;
$$;

create or replace function public.revoke_league_host(
  target_league_id text,
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Hanya super admin yang dapat mencabut host liga.' using errcode = '42501';
  end if;

  update public.league_hosts
  set status = 'revoked', revoked_by = auth.uid(), revoked_at = now()
  where league_id = target_league_id and user_id = target_user_id and status = 'active';

  if not found then
    raise exception 'Host aktif tidak ditemukan.' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_id, league_id, action, target_type, target_id)
  values (auth.uid(), target_league_id, 'league_host.revoked', 'league_host', target_user_id::text);
end;
$$;

create or replace function public.revoke_league_host_invitation(target_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invitation public.league_host_invitations;
begin
  if not public.is_super_admin() then
    raise exception 'Hanya super admin yang dapat membatalkan undangan.' using errcode = '42501';
  end if;

  update public.league_host_invitations
  set status = 'revoked', revoked_at = now(), updated_at = now()
  where id = target_invitation_id and status = 'pending'
  returning * into target_invitation;

  if target_invitation is null then
    raise exception 'Undangan aktif tidak ditemukan.' using errcode = 'P0002';
  end if;

  insert into public.audit_logs (actor_id, league_id, action, target_type, target_id)
  values (auth.uid(), target_invitation.league_id, 'league_host.invitation_revoked', 'league_host_invitation', target_invitation_id::text);
end;
$$;

create or replace function public.update_league_operational_info(
  target_league_id text,
  target_info jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  current_league jsonb;
  updated_league jsonb;
  updated_leagues jsonb;
begin
  if not public.can_operate_league(target_league_id) then
    raise exception 'Anda tidak memiliki akses operasional ke liga ini.' using errcode = '42501';
  end if;

  if length(trim(coalesce(target_info ->> 'name', ''))) not between 2 and 120
    or length(trim(coalesce(target_info ->> 'venue', ''))) not between 2 and 160
    or length(coalesce(target_info ->> 'description', '')) > 1000
    or coalesce(target_info ->> 'startTime', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or coalesce(target_info ->> 'endTime', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  then
    raise exception 'Informasi operasional liga tidak valid.' using errcode = '22023';
  end if;

  select payload into current_payload from public.app_state where id = 'primary' for update;
  select item.value into current_league
  from jsonb_array_elements(coalesce(current_payload -> 'leagues', '[]'::jsonb)) item(value)
  where item.value ->> 'id' = target_league_id limit 1;

  if current_league is null then
    raise exception 'Liga tidak ditemukan.' using errcode = 'P0002';
  end if;

  updated_league := current_league || jsonb_build_object(
    'name', coalesce(nullif(trim(target_info ->> 'name'), ''), current_league ->> 'name'),
    'venue', coalesce(nullif(trim(target_info ->> 'venue'), ''), current_league ->> 'venue'),
    'courtsCount', greatest(1, least(20, coalesce((target_info ->> 'courtsCount')::integer, (current_league ->> 'courtsCount')::integer))),
    'startTime', coalesce(target_info ->> 'startTime', current_league ->> 'startTime'),
    'endTime', coalesce(target_info ->> 'endTime', current_league ->> 'endTime'),
    'defaultFormat', case when target_info ->> 'defaultFormat' in ('BWF', 'RACE_42') then target_info ->> 'defaultFormat' else current_league ->> 'defaultFormat' end,
    'description', coalesce(target_info ->> 'description', current_league ->> 'description')
  );

  select jsonb_agg(case when item.value ->> 'id' = target_league_id then updated_league else item.value end order by item.ordinality)
  into updated_leagues
  from jsonb_array_elements(current_payload -> 'leagues') with ordinality item(value, ordinality);

  update public.app_state
  set payload = jsonb_set(current_payload, '{leagues}', updated_leagues, false), updated_at = now(), updated_by = auth.uid()
  where id = 'primary';

  insert into public.audit_logs (actor_id, league_id, action, target_type, target_id, old_value, new_value)
  values (auth.uid(), target_league_id, 'league.updated_operational_info', 'league', target_league_id, current_league, updated_league);

  return updated_league;
exception
  when invalid_text_representation then
    raise exception 'Data operasional liga tidak valid.' using errcode = '22023';
end;
$$;

create or replace function public.is_valid_match_score(
  target_format text,
  team_a_score integer,
  team_b_score integer
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when team_a_score < 0 or team_b_score < 0 or team_a_score = team_b_score then false
    when target_format = 'RACE_42' then greatest(team_a_score, team_b_score) = 42 and least(team_a_score, team_b_score) <= 41
    when target_format = 'BWF' then
      (
        greatest(team_a_score, team_b_score) between 21 and 29
        and greatest(team_a_score, team_b_score) - least(team_a_score, team_b_score) >= 2
      )
      or (greatest(team_a_score, team_b_score) = 30 and least(team_a_score, team_b_score) <= 29)
    else false
  end;
$$;

create or replace function public.verify_match_result(target_match_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  current_match jsonb;
  target_league_id text;
  updated_match jsonb;
  updated_matches jsonb;
begin
  select payload into current_payload from public.app_state where id = 'primary' for update;
  select item.value into current_match
  from jsonb_array_elements(coalesce(current_payload -> 'matches', '[]'::jsonb)) item(value)
  where item.value ->> 'id' = target_match_id limit 1;

  if current_match is null then raise exception 'Pertandingan tidak ditemukan.' using errcode = 'P0002'; end if;
  target_league_id := current_match ->> 'leagueId';
  if not public.can_operate_league(target_league_id) then raise exception 'Anda tidak memiliki akses operasional ke liga ini.' using errcode = '42501'; end if;
  if current_match ->> 'status' <> 'COMPLETED' then raise exception 'Hanya hasil selesai yang dapat diverifikasi.' using errcode = '22023'; end if;
  if not public.is_valid_match_score(
    current_match ->> 'format',
    (current_match #>> '{teamA,score}')::integer,
    (current_match #>> '{teamB,score}')::integer
  ) then raise exception 'Skor pertandingan tidak memenuhi aturan format.' using errcode = '22023'; end if;

  updated_match := current_match || jsonb_build_object(
    'verificationStatus', 'VERIFIED',
    'verifiedBy', auth.uid(),
    'verifiedAt', now()
  );

  select jsonb_agg(case when item.value ->> 'id' = target_match_id then updated_match else item.value end order by item.ordinality)
  into updated_matches from jsonb_array_elements(current_payload -> 'matches') with ordinality item(value, ordinality);

  update public.app_state set payload = jsonb_set(current_payload, '{matches}', updated_matches, false), updated_at = now(), updated_by = auth.uid() where id = 'primary';
  insert into public.audit_logs (actor_id, league_id, action, target_type, target_id, old_value, new_value)
  values (auth.uid(), target_league_id, 'match.verified', 'match', target_match_id, current_match, updated_match);
  return updated_match;
end;
$$;

create or replace function public.correct_match_result(
  target_match_id text,
  target_team_a_score integer,
  target_team_b_score integer,
  target_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  current_match jsonb;
  target_league_id text;
  updated_match jsonb;
  updated_matches jsonb;
  winner text;
begin
  if length(trim(target_reason)) < 5 then
    raise exception 'Alasan koreksi wajib diisi minimal 5 karakter.' using errcode = '22023';
  end if;

  select payload into current_payload from public.app_state where id = 'primary' for update;
  select item.value into current_match
  from jsonb_array_elements(coalesce(current_payload -> 'matches', '[]'::jsonb)) item(value)
  where item.value ->> 'id' = target_match_id limit 1;

  if current_match is null then raise exception 'Pertandingan tidak ditemukan.' using errcode = 'P0002'; end if;
  target_league_id := current_match ->> 'leagueId';
  if not public.can_operate_league(target_league_id) then raise exception 'Anda tidak memiliki akses operasional ke liga ini.' using errcode = '42501'; end if;
  if current_match ->> 'status' <> 'COMPLETED' then raise exception 'Hanya hasil selesai yang dapat dikoreksi.' using errcode = '22023'; end if;
  if not public.is_valid_match_score(current_match ->> 'format', target_team_a_score, target_team_b_score) then
    raise exception 'Skor koreksi tidak memenuhi aturan format pertandingan.' using errcode = '22023';
  end if;

  winner := case when target_team_a_score > target_team_b_score then 'teamA' else 'teamB' end;
  updated_match := jsonb_set(jsonb_set(current_match, '{teamA,score}', to_jsonb(target_team_a_score), false), '{teamB,score}', to_jsonb(target_team_b_score), false)
    || jsonb_build_object(
      'winnerTeam', winner,
      'verificationStatus', 'PENDING',
      'verifiedBy', null,
      'verifiedAt', null,
      'correctionReason', trim(target_reason),
      'correctedBy', auth.uid(),
      'correctedAt', now()
    );

  select jsonb_agg(case when item.value ->> 'id' = target_match_id then updated_match else item.value end order by item.ordinality)
  into updated_matches from jsonb_array_elements(current_payload -> 'matches') with ordinality item(value, ordinality);

  update public.app_state set payload = jsonb_set(current_payload, '{matches}', updated_matches, false), updated_at = now(), updated_by = auth.uid() where id = 'primary';
  insert into public.audit_logs (actor_id, league_id, action, target_type, target_id, old_value, new_value, metadata)
  values (auth.uid(), target_league_id, 'match.corrected', 'match', target_match_id, current_match, updated_match, jsonb_build_object('reason', trim(target_reason)));
  return updated_match;
end;
$$;

drop policy if exists "host_invitations_super_admin_read" on public.league_host_invitations;
create policy "host_invitations_super_admin_read" on public.league_host_invitations for select to authenticated using (public.is_super_admin());
drop policy if exists "league_hosts_read_relevant" on public.league_hosts;
create policy "league_hosts_read_relevant" on public.league_hosts for select to authenticated using (public.is_super_admin() or user_id = auth.uid());
drop policy if exists "audit_logs_super_admin_read" on public.audit_logs;
create policy "audit_logs_super_admin_read" on public.audit_logs for select to authenticated using (public.is_super_admin());

revoke all on function public.my_access_context() from public;
revoke all on function public.create_league_host_invitation(text, text) from public;
revoke all on function public.accept_my_league_host_invitations() from public;
revoke all on function public.revoke_league_host(text, uuid) from public;
revoke all on function public.revoke_league_host_invitation(uuid) from public;
revoke all on function public.update_league_operational_info(text, jsonb) from public;
revoke all on function public.verify_match_result(text) from public;
revoke all on function public.correct_match_result(text, integer, integer, text) from public;

grant execute on function public.my_access_context() to authenticated;
grant execute on function public.create_league_host_invitation(text, text) to authenticated;
grant execute on function public.accept_my_league_host_invitations() to authenticated;
grant execute on function public.revoke_league_host(text, uuid) to authenticated;
grant execute on function public.revoke_league_host_invitation(uuid) to authenticated;
grant execute on function public.update_league_operational_info(text, jsonb) to authenticated;
grant execute on function public.verify_match_result(text) to authenticated;
grant execute on function public.correct_match_result(text, integer, integer, text) to authenticated;

comment on table public.league_hosts is 'Penugasan host yang dibatasi per liga. Super admin selalu memiliki override melalui can_operate_league.';
comment on table public.audit_logs is 'Jejak tindakan sensitif yang tidak dapat diubah dari client.';
