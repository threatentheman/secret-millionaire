create table elimination_votes (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  voter_player_id uuid not null references players(id) on delete cascade,
  target_player_id uuid not null references players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(game_id, day, voter_player_id)
);

create index elimination_votes_game_id_day_idx on elimination_votes(game_id, day);
create index elimination_votes_game_id_target_player_id_idx on elimination_votes(game_id, target_player_id);

alter publication supabase_realtime add table elimination_votes;
