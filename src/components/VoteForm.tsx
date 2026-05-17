"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { submitEliminationVote } from "@/lib/actions";
import type { PlayerSnapshot, UUID } from "@/lib/domain";

type VoteFormProps = {
  snapshot: PlayerSnapshot;
};

export function VoteForm({ snapshot }: VoteFormProps) {
  const router = useRouter();
  const options = snapshot.players.filter((player) => player.id !== snapshot.player.id && !player.is_eliminated);
  const [target, setTarget] = useState<UUID>(snapshot.eliminationVote?.target_player_id ?? options[0]?.id ?? "");
  const [message, setMessage] = useState("");

  async function submit() {
    const result = await submitEliminationVote(snapshot.game.code, snapshot.player.id, target);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setMessage("Vote submitted. You can change it until the narrator closes voting.");
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-lg bg-black/35 p-4 gold-ring">
      <p className="text-sm font-bold text-white/75">
        Submit who you think should be sent home. This is private to the admin dashboard.
      </p>
      {snapshot.eliminationVote ? (
        <p className="rounded-lg bg-gold/10 p-3 text-sm font-bold text-champagne gold-ring">
          Current vote saved. Submit again to change it.
        </p>
      ) : null}
      <select className="min-h-14 w-full rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" onChange={(event) => setTarget(event.target.value)} value={target}>
        {options.map((player) => <option key={player.id} value={player.id}>{player.avatar_emoji ?? ""} {player.name}</option>)}
      </select>
      {message ? <p className="rounded-lg bg-gold/10 p-3 font-bold text-champagne gold-ring">{message}</p> : null}
      <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian disabled:opacity-40" disabled={!target || snapshot.player.is_eliminated} onClick={() => void submit()} type="button">
        Submit Vote
      </button>
    </section>
  );
}
