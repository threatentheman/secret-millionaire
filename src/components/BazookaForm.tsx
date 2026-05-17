"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { fireBazooka } from "@/lib/actions";
import type { PlayerSnapshot, UUID } from "@/lib/domain";

type BazookaFormProps = {
  snapshot: PlayerSnapshot;
};

export function BazookaForm({ snapshot }: BazookaFormProps) {
  const router = useRouter();
  const [target, setTarget] = useState<UUID>(snapshot.players.find((player) => player.id !== snapshot.player.id)?.id ?? "");
  const [message, setMessage] = useState("");

  async function submit() {
    const result = await fireBazooka(snapshot.game.code, snapshot.player.id, target);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage(result.data.correct ? (result.data.shieldBlocked ? "Correct, but a shield blocked it." : "Direct hit. The Million has moved.") : "Miss. Your Bazooka is burned.");
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-lg bg-black/35 p-4 gold-ring">
      <p className="text-sm text-white/75">You get exactly one Bazooka for the whole game. Choose carefully.</p>
      <select className="min-h-14 w-full rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" disabled={!snapshot.player.bazooka_available} onChange={(event) => setTarget(event.target.value)} value={target}>
        {snapshot.players.filter((player) => player.id !== snapshot.player.id).map((player) => <option key={player.id} value={player.id}>{player.avatar_emoji ?? ""} {player.name}</option>)}
      </select>
      {message ? <p className="rounded-lg bg-gold/10 p-3 font-bold text-champagne gold-ring">{message}</p> : null}
      <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian disabled:opacity-40" disabled={!snapshot.player.bazooka_available || !target} onClick={() => void submit()} type="button">
        Fire Bazooka
      </button>
    </section>
  );
}
