"use client";

import { Clock, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { TvSnapshot } from "@/lib/domain";
import { createBrowserClient } from "@/lib/supabase";

type TvDashboardProps = {
  snapshot: TvSnapshot;
};

export function TvDashboard({ snapshot }: TvDashboardProps) {
  const router = useRouter();
  const latest = snapshot.events[0];

  useEffect(() => {
    const client = createBrowserClient();
    const channel = client
      .channel(`tv-${snapshot.game.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "public_events", filter: `game_id=eq.${snapshot.game.id}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `id=eq.${snapshot.game.id}` }, () => router.refresh())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [router, snapshot.game.id]);

  return (
    <main className="min-h-screen px-8 py-6">
      <header className="flex items-start justify-between gap-8">
        <div>
          <p className="text-xl font-black uppercase tracking-[0.3em] text-gold">Bali Villa Edition</p>
          <h1 className="mt-2 text-7xl font-black leading-none text-champagne">{snapshot.game.name}</h1>
        </div>
        <div className="rounded-lg bg-black/40 p-5 text-right gold-ring">
          <p className="text-5xl font-black text-gold">Day {snapshot.game.current_day}</p>
          <p className="mt-2 text-2xl font-bold uppercase text-white/70">{snapshot.game.current_phase.replaceAll("_", " ")}</p>
        </div>
      </header>

      {latest ? (
        <section className="my-8 rounded-lg bg-gold p-8 text-obsidian shadow-glow">
          <p className="text-2xl font-black uppercase tracking-[0.18em]">Latest Alert</p>
          <h2 className="mt-3 text-7xl font-black leading-none">{latest.title}</h2>
          <p className="mt-4 text-3xl font-bold">{latest.message}</p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr_1.2fr]">
        <div className="rounded-lg bg-black/35 p-5 gold-ring">
          <h2 className="mb-4 flex items-center gap-3 text-3xl font-black text-champagne"><Users className="h-8 w-8 text-gold" /> Players</h2>
          <div className="grid grid-cols-2 gap-3">
            {snapshot.players.map((player) => (
              <div className="rounded-lg bg-white/10 p-3 text-2xl font-black text-champagne" key={player.id}>
                {player.avatar_emoji ?? "◇"} {player.name}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-black/35 p-5 gold-ring">
          <h2 className="mb-4 text-3xl font-black text-champagne">Teams</h2>
          <div className="space-y-4">
            {snapshot.teams.map((team) => (
              <article className="rounded-lg bg-white/10 p-4" key={team.id}>
                <h3 className="text-2xl font-black text-gold">{team.name}</h3>
                <p className="mt-2 text-xl font-bold text-white/80">{snapshot.players.filter((player) => player.current_team_id === team.id).map((player) => player.name).join(" · ")}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-black/35 p-5 gold-ring">
          <h2 className="mb-4 text-3xl font-black text-champagne">Public Clues</h2>
          <div className="space-y-3">
            {snapshot.publicClues.map((clue) => <p className="rounded-lg bg-white/10 p-4 text-2xl font-bold" key={clue.id}>{clue.clue_text}</p>)}
          </div>
        </div>
      </section>

      <footer className="mt-6 flex items-center justify-between rounded-lg bg-black/35 p-4 text-2xl font-bold gold-ring">
        <span className="flex items-center gap-3"><Clock className="h-7 w-7 text-gold" /> Countdown placeholder</span>
        <span>The Million holder is never shown here.</span>
      </footer>
    </main>
  );
}
