# Secret Millionaire: Bali Villa Edition

Mobile-first realtime party game built with Next.js App Router, TypeScript, Supabase Postgres, Supabase Realtime, and Tailwind CSS.

## Setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_secret_millionaire.sql` in the Supabase SQL editor or through the Supabase CLI.
3. Copy `.env.example` to `.env.local` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Install and run:

```bash
npm install
npm run dev
```

## Surfaces

- Player: `/`, `/join/[gameCode]`, `/game/[gameCode]`
- Admin/Narrator: `/admin/login`, `/admin`, `/admin/[gameCode]`
- TV: `/tv/[gameCode]`

Player identity uses a room code, email, and a private code the player chooses. The private code is hashed server-side, and the remembered device session is stored in `localStorage`. No phone number collection.

Players log back in from the same join page: `/join/[gameCode]`. If the email already exists in that game, the private code must match.

Admin login is at `/admin/login`.

Vote-off submissions are at `/game/[gameCode]/vote` from the player dashboard. The admin dashboard shows the current day tally and the top person to announce, with a button to mark them sent home.

Rules are available to everyone at `/rules`.

Secret Millionaire challenge rewards apply when admin confirms success. Fully automated rewards include shield, Million movement to a random active player, Bazooka block, life steal, scramble clue creation, and double protection. Team influence is logged as an admin action because it needs narrator judgment.

## Security Notes

- Sensitive writes use server actions with `SUPABASE_SERVICE_ROLE_KEY`.
- Player snapshots intentionally remove `million_holder_player_id` and other players' roles.
- TV snapshots only include public players, public clues, teams, and public events.
- Admin snapshots can see the full game state.

## Tonight Flow

1. Admin creates a game at `/admin`.
2. Players join from `/join/[gameCode]`.
3. Admin starts survey, then locks survey manually.
4. Admin assigns the initial Million holder.
5. Mulan intro game happens off-app.
6. Admin marks Mulan winners and awards extra lives.
7. Admin generates/release warm-up clues and controls phases.

Manual controls are intentionally favored where tonight's narrator judgment matters more than automation.
