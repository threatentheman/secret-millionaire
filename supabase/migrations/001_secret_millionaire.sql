create extension if not exists pgcrypto;

create table games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  status text not null default 'setup',
  current_day integer not null default 0,
  current_phase text not null default 'setup',
  million_holder_player_id uuid null,
  final_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create table players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  role text not null default 'detective',
  is_host boolean not null default false,
  is_eliminated boolean not null default false,
  extra_lives integer not null default 0,
  bazooka_available boolean not null default true,
  shield_active boolean not null default false,
  current_team_id uuid null,
  avatar_emoji text null,
  device_session_id text null,
  joined_at timestamptz not null default now()
);

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  question text not null,
  question_type text not null default 'text',
  clue_safe boolean not null default true,
  created_at timestamptz not null default now()
);

create table survey_answers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  question_id uuid not null references survey_questions(id) on delete cascade,
  answer text not null,
  created_at timestamptz not null default now(),
  unique(player_id, question_id)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  type text not null,
  title text not null,
  description text not null,
  winning_team_id uuid null references teams(id),
  winning_player_id uuid null references players(id),
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table armory_entries (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  player_id uuid not null references players(id),
  selected_reward text null,
  reward_applied boolean not null default false,
  created_at timestamptz not null default now()
);

create table generated_clues (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  day integer not null,
  generated_for_player_id uuid not null references players(id),
  source_type text not null,
  clue_text text not null,
  difficulty text not null,
  matching_player_count integer not null,
  released boolean not null default false,
  recipient_player_id uuid null references players(id),
  created_at timestamptz not null default now()
);

create table millionaire_challenges (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  title text not null,
  description text not null,
  difficulty text not null,
  reward_type text not null,
  requires_narrator boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table millionaire_challenge_assignments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  challenge_id uuid not null references millionaire_challenges(id),
  day integer not null,
  millionaire_player_id uuid not null references players(id),
  status text not null default 'assigned',
  narrator_confirmed boolean not null default false,
  completed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table bazooka_shots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  shooter_player_id uuid not null references players(id),
  target_player_id uuid not null references players(id),
  was_correct boolean not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create table million_transfers (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  from_player_id uuid null references players(id),
  to_player_id uuid not null references players(id),
  reason text not null,
  public_announced boolean not null default false,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  recipient_player_id uuid null references players(id),
  audience text not null,
  title text not null,
  message text not null,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create table public_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  event_type text not null,
  title text not null,
  message text not null,
  show_on_tv boolean not null default true,
  created_at timestamptz not null default now()
);

alter table games
  add constraint games_million_holder_player_id_fkey
  foreign key (million_holder_player_id) references players(id);

alter table players
  add constraint players_current_team_id_fkey
  foreign key (current_team_id) references teams(id);

create index games_code_idx on games(code);
create index players_game_id_idx on players(game_id);
create index players_game_id_device_session_id_idx on players(game_id, device_session_id);
create index survey_answers_game_id_player_id_idx on survey_answers(game_id, player_id);
create index generated_clues_game_id_day_idx on generated_clues(game_id, day);
create index notifications_game_id_audience_read_at_idx on notifications(game_id, audience, read_at);
create index public_events_game_id_created_at_idx on public_events(game_id, created_at desc);
create index million_transfers_game_id_created_at_idx on million_transfers(game_id, created_at desc);

alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table public_events;
alter publication supabase_realtime add table games;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table generated_clues;
