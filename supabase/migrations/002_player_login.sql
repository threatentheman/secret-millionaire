alter table players
  add column login_email text null,
  add column auth_code_hash text null;

create unique index players_game_id_login_email_idx
  on players(game_id, lower(login_email))
  where login_email is not null;
