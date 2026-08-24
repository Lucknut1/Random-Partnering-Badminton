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
  'Mendaftarkan satu peserta ke satu liga tanpa membuka akses tulis langsung ke snapshot aplikasi.';
