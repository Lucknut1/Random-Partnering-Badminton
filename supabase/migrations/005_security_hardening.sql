-- 005_security_hardening.sql
-- Prioritas 1 & 2: Pengerasan keamanan RPC Pembatalan Pertandingan dan Registrasi Pemain

-- 1. Perbaikan RPC cancel_active_match (Prioritas 1)
-- Memastikan hanya user yang terautentikasi dan memiliki hak operasional liga yang sah yang dapat membatalkan pertandingan.
create or replace function public.cancel_active_match(target_match_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  current_match jsonb;
  target_league_id text;
  updated_matches jsonb;
begin
  -- Pastikan pemanggil terautentikasi
  if auth.uid() is null then
    raise exception 'Login diperlukan untuk membatalkan pertandingan.' using errcode = '42501';
  end if;

  select payload
  into current_payload
  from public.app_state
  where id = 'primary'
  for update;

  if current_payload is null then
    raise exception 'Data liga belum tersedia.' using errcode = 'P0002';
  end if;

  select item.value
  into current_match
  from jsonb_array_elements(coalesce(current_payload -> 'matches', '[]'::jsonb)) as item(value)
  where item.value ->> 'id' = target_match_id
  limit 1;

  if current_match is null then
    raise exception 'Pertandingan tidak ditemukan.' using errcode = 'P0002';
  end if;

  target_league_id := current_match ->> 'leagueId';

  -- Validasi hak operasional liga (Super Admin atau Host Liga terkait)
  if not public.can_operate_league(target_league_id) then
    raise exception 'Anda tidak memiliki akses operasional untuk membatalkan pertandingan pada liga ini.' using errcode = '42501';
  end if;

  if current_match ->> 'status' <> 'IN_PROGRESS' then
    raise exception 'Hanya pertandingan yang sedang berlangsung yang dapat dibatalkan.' using errcode = '22023';
  end if;

  select jsonb_agg(
    case
      when item.value ->> 'id' = target_match_id
        then jsonb_set(item.value, '{status}', '"CANCELLED"'::jsonb, false)
      else item.value
    end
    order by item.ordinality
  )
  into updated_matches
  from jsonb_array_elements(coalesce(current_payload -> 'matches', '[]'::jsonb))
    with ordinality as item(value, ordinality);

  update public.app_state
  set
    payload = jsonb_set(current_payload, '{matches}', coalesce(updated_matches, '[]'::jsonb), false),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 'primary';

  -- Catat ke audit logs
  insert into public.audit_logs (
    actor_id, league_id, action, target_type, target_id, old_value, new_value
  ) values (
    auth.uid(), target_league_id, 'match.cancelled', 'match', target_match_id,
    current_match, jsonb_set(current_match, '{status}', '"CANCELLED"'::jsonb, false)
  );

  return jsonb_set(current_match, '{status}', '"CANCELLED"'::jsonb, false);
end;
$$;

-- Cabut akses dari publik (anon), hanya izinkan authenticated
revoke all on function public.cancel_active_match(text) from public, anon;
grant execute on function public.cancel_active_match(text) to authenticated;

comment on function public.cancel_active_match(text) is
  'Membatalkan satu pertandingan aktif. Wajib memiliki hak operasional liga (super admin atau host).';


-- 2. Perbaikan RPC register_league_player (Prioritas 2)
-- Mencegah state bloating DoS dengan membatasi kuota peserta dan menyaring karakter input
create or replace function public.register_league_player(
  target_league_id text,
  target_full_name text,
  target_department text,
  target_level text,
  target_gender text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  normalized_name text := trim(regexp_replace(coalesce(target_full_name, ''), '\s+', ' ', 'g'));
  normalized_department text := trim(regexp_replace(coalesce(target_department, ''), '\s+', ' ', 'g'));
  current_player_count integer;
  new_player jsonb;
begin
  if length(normalized_name) not between 3 and 80 then
    raise exception 'Nama lengkap harus terdiri dari 3 sampai 80 karakter.' using errcode = '22023';
  end if;

  if length(normalized_department) not between 2 and 100 then
    raise exception 'Nama divisi harus terdiri dari 2 sampai 100 karakter.' using errcode = '22023';
  end if;

  if coalesce(target_level, '') not in ('A', 'B') then
    raise exception 'Level peserta tidak valid.' using errcode = '22023';
  end if;

  if coalesce(target_gender, '') not in ('pria', 'wanita') then
    raise exception 'Kategori peserta tidak valid.' using errcode = '22023';
  end if;

  select payload
  into current_payload
  from public.app_state
  where id = 'primary'
  for update;

  if current_payload is null then
    raise exception 'Data liga belum tersedia.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(coalesce(current_payload -> 'leagues', '[]'::jsonb)) league(value)
    where league.value ->> 'id' = target_league_id
  ) then
    raise exception 'Liga yang dipilih tidak ditemukan.' using errcode = 'P0002';
  end if;

  -- Proteksi DoS: Batasi kuota pemain per liga (maksimum 150 pemain per liga)
  select count(*)
  into current_player_count
  from jsonb_array_elements(coalesce(current_payload -> 'players', '[]'::jsonb)) player(value)
  where player.value ->> 'leagueId' = target_league_id;

  if current_player_count >= 150 then
    raise exception 'Kuota peserta untuk liga ini sudah mencapai batas maksimum (150 peserta).' using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(current_payload -> 'players', '[]'::jsonb)) player(value)
    where player.value ->> 'leagueId' = target_league_id
      and lower(trim(player.value ->> 'name')) = lower(normalized_name)
      and lower(trim(player.value ->> 'department')) = lower(normalized_department)
  ) then
    raise exception 'Peserta dengan nama dan divisi yang sama sudah terdaftar di liga ini.' using errcode = '23505';
  end if;

  new_player := jsonb_build_object(
    'id', 'p-' || replace(gen_random_uuid()::text, '-', ''),
    'name', normalized_name,
    'gender', target_gender,
    'level', target_level,
    'department', normalized_department,
    'leagueId', target_league_id,
    'createdAt', to_char(current_date, 'YYYY-MM-DD')
  );

  update public.app_state
  set
    payload = jsonb_set(
      current_payload,
      '{players}',
      coalesce(current_payload -> 'players', '[]'::jsonb) || jsonb_build_array(new_player),
      true
    ),
    updated_at = now(),
    updated_by = auth.uid()
  where id = 'primary';

  insert into public.audit_logs (
    actor_id, league_id, action, target_type, target_id, new_value,
    metadata
  ) values (
    auth.uid(), target_league_id, 'league_player.registered', 'player', new_player ->> 'id', new_player,
    jsonb_build_object('source', 'public_join_form')
  );

  return new_player;
end;
$$;

revoke all on function public.register_league_player(text, text, text, text, text) from public;
grant execute on function public.register_league_player(text, text, text, text, text) to anon, authenticated;

comment on function public.register_league_player(text, text, text, text, text) is
  'Mendaftarkan satu peserta ke satu liga dengan batasan kuota anti-abuse.';
