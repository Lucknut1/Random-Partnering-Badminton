create or replace function public.cancel_active_match(target_match_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_payload jsonb;
  current_match jsonb;
  updated_matches jsonb;
begin
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

  return jsonb_set(current_match, '{status}', '"CANCELLED"'::jsonb, false);
end;
$$;

revoke all on function public.cancel_active_match(text) from public;
grant execute on function public.cancel_active_match(text) to anon, authenticated;

comment on function public.cancel_active_match(text) is
  'Membolehkan peserta membatalkan satu pertandingan aktif tanpa membuka akses tulis ke data liga lainnya.';

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end;
$$;
