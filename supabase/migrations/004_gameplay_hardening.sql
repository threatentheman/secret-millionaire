alter table games
  add column if not exists voting_locked boolean not null default false;

alter table millionaire_challenge_assignments
  add column if not exists reward_applied boolean not null default false;

create unique index if not exists armory_entries_game_id_day_player_id_idx
  on armory_entries(game_id, day, player_id);

alter table games enable row level security;
alter table players enable row level security;
alter table survey_questions enable row level security;
alter table survey_answers enable row level security;
alter table teams enable row level security;
alter table challenges enable row level security;
alter table armory_entries enable row level security;
alter table generated_clues enable row level security;
alter table millionaire_challenges enable row level security;
alter table millionaire_challenge_assignments enable row level security;
alter table bazooka_shots enable row level security;
alter table million_transfers enable row level security;
alter table notifications enable row level security;
alter table public_events enable row level security;
alter table elimination_votes enable row level security;

drop policy if exists "public can read tv events" on public_events;
create policy "public can read tv events"
  on public_events
  for select
  to anon
  using (show_on_tv = true);
