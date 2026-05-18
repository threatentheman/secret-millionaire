do $$
begin
  if to_regclass('public.elimnation_votes') is not null
     and to_regclass('public.elimination_votes') is null then
    alter table public.elimnation_votes rename to elimination_votes;
  end if;
end $$;

create table if not exists elimination_votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  voter_player_id uuid not null references players(id) on delete cascade,
  target_player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(game_id, day, voter_player_id)
);

do $$
begin
  if to_regclass('public.elimnation_votes') is not null
     and to_regclass('public.elimination_votes') is not null then
    insert into public.elimination_votes (id, game_id, day, voter_player_id, target_player_id, created_at)
    select id, game_id, day, voter_player_id, target_player_id, created_at
    from public.elimnation_votes
    on conflict (game_id, day, voter_player_id)
    do update set target_player_id = excluded.target_player_id;

    drop table public.elimnation_votes;
  end if;
end $$;

create index if not exists elimination_votes_game_id_day_idx
  on elimination_votes(game_id, day);

create index if not exists elimination_votes_game_id_target_player_id_idx
  on elimination_votes(game_id, target_player_id);

alter table elimination_votes enable row level security;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  )
  and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'elimination_votes'
  ) then
    alter publication supabase_realtime add table elimination_votes;
  end if;
end $$;
