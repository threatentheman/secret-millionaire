"use client";

import { Crosshair, Sparkles, Vote } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { submitMillionaireChallengeAttempt } from "@/lib/actions";
import type { PlayerSnapshot } from "@/lib/domain";
import { createBrowserClient } from "@/lib/supabase";
import { ActionButton } from "./ActionButton";
import { StatCard } from "./StatCard";

type PlayerDashboardProps = {
  snapshot: PlayerSnapshot;
};

export function PlayerDashboard({ snapshot }: PlayerDashboardProps) {
  const router = useRouter();
  const team = snapshot.teams.find((item) => item.id === snapshot.player.current_team_id);
  const isMillionaire = snapshot.player.role === "millionaire";

  useEffect(() => {
    const client = createBrowserClient();
    const channel = client
      .channel(`player-${snapshot.game.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "public_events", filter: `game_id=eq.${snapshot.game.id}` }, () => router.refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `game_id=eq.${snapshot.game.id}` }, () => router.refresh())
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [router, snapshot.game.id]);

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-black/35 p-5 gold-ring">
        <p className="text-5xl">{snapshot.player.avatar_emoji ?? "🥂"}</p>
        <h2 className="mt-2 text-3xl font-black text-champagne">{snapshot.player.name}</h2>
        <p className="mt-1 text-sm font-bold uppercase tracking-[0.18em] text-gold">{isMillionaire ? "You hold The Million" : "Detective"}</p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatCard label="Phase" value={snapshot.game.current_phase.replaceAll("_", " ")} />
        <StatCard label="Team" value={team?.name ?? "Unassigned"} tone="lagoon" />
        <StatCard label="Lives" value={snapshot.player.extra_lives} tone="gold" />
        <StatCard label="Bazooka" value={snapshot.player.bazooka_available ? "Ready" : "Used"} tone={snapshot.player.bazooka_available ? "gold" : "danger"} />
        <StatCard label="Shield" value={snapshot.player.shield_active ? "Active" : "None"} tone={snapshot.player.shield_active ? "lagoon" : "plain"} />
        <StatCard label="Status" value={snapshot.player.is_eliminated ? "Out" : "In"} tone={snapshot.player.is_eliminated ? "danger" : "lagoon"} />
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        <Link className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-gold px-4 font-black uppercase text-obsidian" href={`/game/${snapshot.game.code}/bazooka?player=${snapshot.player.id}`}>
          <Crosshair className="h-5 w-5" /> Bazooka
        </Link>
        <Link className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 font-black uppercase text-champagne gold-ring" href={`/game/${snapshot.game.code}/clues?player=${snapshot.player.id}`}>
          <Sparkles className="h-5 w-5" /> Clues
        </Link>
        <Link className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white/10 px-4 font-black uppercase text-champagne gold-ring" href={`/game/${snapshot.game.code}/vote?player=${snapshot.player.id}`}>
          <Vote className="h-5 w-5" /> Vote
        </Link>
        <Link className="flex min-h-14 items-center justify-center rounded-lg bg-white/10 px-4 font-black uppercase text-champagne gold-ring" href={`/game/${snapshot.game.code}/role?player=${snapshot.player.id}`}>
          Role
        </Link>
      </section>

      {snapshot.activeChallenge && isMillionaire ? (
        <section className="rounded-lg bg-gold/10 p-4 gold-ring">
          <h2 className="text-xl font-black text-gold">Secret Challenge</h2>
          <p className="mt-2 font-bold text-champagne">{snapshot.activeChallenge.challenge.title}</p>
          <p className="mt-1 text-sm text-white/75">{snapshot.activeChallenge.challenge.description}</p>
          <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/55">Reward: {snapshot.activeChallenge.challenge.reward_type}</p>
          <div className="mt-3">
            <ActionButton action={async () => {
              await submitMillionaireChallengeAttempt(snapshot.game.code, snapshot.activeChallenge?.id ?? "", snapshot.player.id);
            }}>
              Mark Attempted
            </ActionButton>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-xl font-black text-champagne">Public Clues</h2>
        <div className="space-y-2">
          {snapshot.publicClues.map((clue) => <p className="rounded-lg bg-white/10 p-3 font-bold" key={clue.id}>{clue.clue_text}</p>)}
          {snapshot.publicClues.length === 0 ? <p className="text-white/55">No public clues yet.</p> : null}
        </div>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-xl font-black text-champagne">Villa Feed</h2>
        <div className="space-y-2">
          {snapshot.events.map((event) => (
            <article className="rounded-lg bg-white/10 p-3" key={event.id}>
              <p className="font-black text-gold">{event.title}</p>
              <p className="text-sm text-white/75">{event.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
