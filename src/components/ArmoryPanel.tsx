"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { selectArmoryReward } from "@/lib/actions";
import type { ArmoryRewardType, PlayerSnapshot } from "@/lib/domain";

type ArmoryPanelProps = {
  snapshot: PlayerSnapshot;
};

const rewards: Array<{ value: ArmoryRewardType; label: string }> = [
  { value: "generated_clue", label: "Generated clue" },
  { value: "shield", label: "Shield" },
  { value: "double_vote", label: "Double vote" },
  { value: "block_bazooka", label: "Block Bazooka" },
  { value: "million_movement_tracker", label: "Million movement tracker" },
  { value: "force_public_yes_no_question", label: "Force public yes/no question" },
  { value: "restore_life", label: "Restore life" }
];

export function ArmoryPanel({ snapshot }: ArmoryPanelProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<ArmoryRewardType>("generated_clue");
  const [message, setMessage] = useState("");

  async function submit() {
    const result = await selectArmoryReward(snapshot.game.code, snapshot.player.id, selected);
    setMessage(result.ok ? "Reward logged. You may lie about what you received." : result.error);
    router.refresh();
  }

  return (
    <section className="space-y-4 rounded-lg bg-black/35 p-4 gold-ring">
      <p className="text-sm text-white/75">Armory rewards are private unless the narrator says otherwise. Manual powers are logged for the admin.</p>
      <div className="grid gap-2">
        {rewards.map((reward) => (
          <label className={`rounded-lg p-3 font-bold gold-ring ${selected === reward.value ? "bg-gold text-obsidian" : "bg-white/10 text-champagne"}`} key={reward.value}>
            <input className="sr-only" checked={selected === reward.value} onChange={() => setSelected(reward.value)} type="radio" />
            {reward.label}
          </label>
        ))}
      </div>
      {message ? <p className="rounded-lg bg-gold/10 p-3 font-bold gold-ring">{message}</p> : null}
      <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian" onClick={() => void submit()} type="button">
        Select Reward
      </button>
    </section>
  );
}
