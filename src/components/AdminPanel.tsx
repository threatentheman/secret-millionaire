"use client";

import { Bell, Crown, Megaphone, Shuffle, Sparkles, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  assignInitialMillion,
  assignMillionaireChallenge,
  awardMulanLives,
  confirmMillionaireChallenge,
  createPublicAlert,
  finalLock,
  finalReveal,
  generateClueForCurrentMillionaire,
  markPlayerSentHome,
  moveMillion,
  randomizeTeams,
  releasePublicClue,
  selectArmoryReward,
  selectArmoryEntrant,
  setCurrentDay,
  setGamePhase
} from "@/lib/actions";
import type { AdminSnapshot, ArmoryRewardType, GamePhase, UUID } from "@/lib/domain";
import { createBrowserClient } from "@/lib/supabase";
import { ActionButton } from "./ActionButton";
import { StatCard } from "./StatCard";

type AdminPanelProps = {
  snapshot: AdminSnapshot;
};

const phases: GamePhase[] = [
  "setup",
  "survey",
  "mulan",
  "role_reveal",
  "warmup_clue",
  "team_assignment",
  "main_challenge",
  "armory_selection",
  "armory",
  "millionaire_secret_challenge",
  "daily_clue",
  "bazooka_window",
  "day_complete",
  "final_lock",
  "final_reveal",
  "complete"
];

const armoryRewards: Array<{ value: ArmoryRewardType; label: string }> = [
  { value: "generated_clue", label: "Generated clue" },
  { value: "shield", label: "Shield" },
  { value: "double_vote", label: "Double vote/manual" },
  { value: "block_bazooka", label: "Block Bazooka/manual" },
  { value: "million_movement_tracker", label: "Movement tracker/manual" },
  { value: "force_public_yes_no_question", label: "Public yes/no/manual" },
  { value: "restore_life", label: "Restore life" }
];

export function AdminPanel({ snapshot }: AdminPanelProps) {
  const router = useRouter();
  const [mulanWinners, setMulanWinners] = useState<UUID[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState(snapshot.players[0]?.id ?? "");
  const [selectedArmoryReward, setSelectedArmoryReward] = useState<ArmoryRewardType>("generated_clue");
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const holder = useMemo(() => snapshot.players.find((player) => player.id === snapshot.game.million_holder_player_id), [snapshot]);

  useEffect(() => {
    const client = createBrowserClient();
    const channel = client
      .channel(`admin-${snapshot.game.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `game_id=eq.${snapshot.game.id}` }, () => {
        const audio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=");
        void audio.play().catch(() => undefined);
        router.refresh();
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [router, snapshot.game.id]);

  async function refreshAfter(action: Promise<unknown>) {
    await action;
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Code" value={snapshot.game.code} tone="gold" />
        <StatCard label="Phase" value={snapshot.game.current_phase.replaceAll("_", " ")} />
        <StatCard label="Day" value={snapshot.game.current_day} tone="lagoon" />
        <StatCard label="Million" value={holder ? `${holder.avatar_emoji ?? ""} ${holder.name}` : "Unassigned"} tone="gold" />
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 flex items-center gap-2 text-xl font-black text-champagne"><Crown className="h-5 w-5 text-gold" /> Core Controls</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionButton action={() => refreshAfter(assignInitialMillion(snapshot.game.code))}>Assign Million</ActionButton>
          <ActionButton action={() => refreshAfter(randomizeTeams(snapshot.game.code))} variant="ghost"><Shuffle className="h-5 w-5" /> Randomize Teams</ActionButton>
          <ActionButton action={() => refreshAfter(generateClueForCurrentMillionaire(snapshot.game.code))} variant="ghost"><Sparkles className="h-5 w-5" /> Generate Clue</ActionButton>
          <ActionButton action={() => refreshAfter(assignMillionaireChallenge(snapshot.game.code))} variant="ghost">Assign Secret Challenge</ActionButton>
          <ActionButton action={() => refreshAfter(finalLock(snapshot.game.code))} variant="danger">Final Lock</ActionButton>
          <ActionButton action={() => refreshAfter(finalReveal(snapshot.game.code))} variant="primary"><Trophy className="h-5 w-5" /> Final Reveal</ActionButton>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="mb-3 text-lg font-black text-champagne">Phase and Day</h2>
          <select className="min-h-12 w-full rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" onChange={(event) => void refreshAfter(setGamePhase(snapshot.game.code, event.target.value as GamePhase))} value={snapshot.game.current_phase}>
            {phases.map((phase) => <option key={phase} value={phase}>{phase.replaceAll("_", " ")}</option>)}
          </select>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((day) => (
              <button className="rounded-lg bg-white/10 px-3 py-3 font-black gold-ring" key={day} onClick={() => void refreshAfter(setCurrentDay(snapshot.game.code, day))} type="button">
                Day {day}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="mb-3 text-lg font-black text-champagne">Player Target</h2>
          <select className="min-h-12 w-full rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" onChange={(event) => setSelectedPlayer(event.target.value)} value={selectedPlayer}>
            {snapshot.players.map((player) => <option key={player.id} value={player.id}>{player.avatar_emoji ?? ""} {player.name}</option>)}
          </select>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <ActionButton action={() => refreshAfter(moveMillion(snapshot.game.code, selectedPlayer))} variant="ghost">Move Million Here</ActionButton>
            <ActionButton action={() => refreshAfter(selectArmoryEntrant(snapshot.game.code, selectedPlayer))} variant="ghost">Select Armory Entrant</ActionButton>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <select className="min-h-12 rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" onChange={(event) => setSelectedArmoryReward(event.target.value as ArmoryRewardType)} value={selectedArmoryReward}>
              {armoryRewards.map((reward) => <option key={reward.value} value={reward.value}>{reward.label}</option>)}
            </select>
            <button className="min-h-12 rounded-lg bg-gold px-4 font-black uppercase text-obsidian" onClick={() => void refreshAfter(selectArmoryReward(snapshot.game.code, selectedPlayer, selectedArmoryReward))} type="button">
              Apply Armory
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-lg font-black text-champagne">Mulan Winners</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {snapshot.players.map((player) => (
            <label className="flex items-center gap-3 rounded-lg bg-white/10 p-3 gold-ring" key={player.id}>
              <input
                checked={mulanWinners.includes(player.id)}
                onChange={(event) => setMulanWinners((current) => event.target.checked ? [...current, player.id] : current.filter((id) => id !== player.id))}
                type="checkbox"
              />
              <span className="font-bold">{player.avatar_emoji ?? ""} {player.name}</span>
            </label>
          ))}
        </div>
        <div className="mt-3">
          <ActionButton action={() => refreshAfter(awardMulanLives(snapshot.game.code, mulanWinners))}>Award Extra Lives</ActionButton>
        </div>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-lg font-black text-champagne">Vote Off</h2>
        {snapshot.sentHomeCandidate ? (
          <div className="rounded-lg bg-danger/15 p-4 gold-ring">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Current person to announce</p>
            <p className="mt-2 text-3xl font-black text-champagne">
              {snapshot.sentHomeCandidate.avatarEmoji ?? ""} {snapshot.sentHomeCandidate.playerName}
            </p>
            <p className="mt-1 font-bold text-white/70">{snapshot.sentHomeCandidate.votes} vote(s)</p>
            <button
              className="mt-3 min-h-12 w-full rounded-lg bg-danger px-4 font-black uppercase text-white disabled:opacity-40"
              disabled={snapshot.sentHomeCandidate.isEliminated}
              onClick={() => void refreshAfter(markPlayerSentHome(snapshot.game.code, snapshot.sentHomeCandidate?.playerId ?? ""))}
              type="button"
            >
              {snapshot.sentHomeCandidate.isEliminated ? "Already Sent Home" : "Mark Sent Home"}
            </button>
          </div>
        ) : (
          <p className="rounded-lg bg-white/10 p-3 text-sm font-bold text-white/70 gold-ring">No votes submitted for day {snapshot.game.current_day} yet.</p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {snapshot.eliminationTallies.map((tally) => (
            <article className="rounded-lg bg-white/10 p-3 gold-ring" key={tally.playerId}>
              <p className="font-black text-champagne">{tally.avatarEmoji ?? ""} {tally.playerName}</p>
              <p className="text-sm font-bold text-gold">{tally.votes} vote(s)</p>
            </article>
          ))}
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-white/45">
          {snapshot.eliminationVotes.length} vote submission(s) received today
        </p>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-lg font-black text-champagne">Secret Challenge Review</h2>
        <div className="space-y-2">
          {snapshot.assignments.map((assignment) => {
            const challenge = snapshot.challenges.find((item) => item.id === assignment.challenge_id);
            const player = snapshot.players.find((item) => item.id === assignment.millionaire_player_id);
            return (
              <article className="rounded-lg bg-white/10 p-3 gold-ring" key={assignment.id}>
                <p className="font-black text-champagne">{challenge?.title ?? "Secret challenge"}</p>
                <p className="mt-1 text-sm text-white/70">{player?.name ?? "Unknown player"} · {assignment.status} · reward {challenge?.reward_type ?? "unknown"}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button className="min-h-11 rounded-lg bg-gold px-3 font-black uppercase text-obsidian" onClick={() => void refreshAfter(confirmMillionaireChallenge(snapshot.game.code, assignment.id, true))} type="button">
                    Confirm Success
                  </button>
                  <button className="min-h-11 rounded-lg bg-white/10 px-3 font-black uppercase text-champagne gold-ring" onClick={() => void refreshAfter(confirmMillionaireChallenge(snapshot.game.code, assignment.id, false))} type="button">
                    Reject
                  </button>
                </div>
              </article>
            );
          })}
          {snapshot.assignments.length === 0 ? <p className="rounded-lg bg-white/10 p-3 text-sm font-bold text-white/70 gold-ring">No secret challenges assigned yet.</p> : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-champagne"><Bell className="h-5 w-5 text-gold" /> Admin Notifications</h2>
          <div className="space-y-2">
            {snapshot.notifications.map((note) => (
              <article className="rounded-lg bg-gold/10 p-3 gold-ring" key={note.id}>
                <p className="font-black text-gold">{note.title}</p>
                <p className="text-sm text-white/75">{note.message}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-black text-champagne"><Megaphone className="h-5 w-5 text-gold" /> TV Alert</h2>
          <input className="mb-2 min-h-12 w-full rounded-lg bg-black/60 px-3 font-bold text-champagne gold-ring" onChange={(event) => setAlertTitle(event.target.value)} placeholder="Title" value={alertTitle} />
          <textarea className="min-h-24 w-full rounded-lg bg-black/60 px-3 py-3 font-bold text-champagne gold-ring" onChange={(event) => setAlertMessage(event.target.value)} placeholder="Message" value={alertMessage} />
          <div className="mt-3">
            <ActionButton action={() => refreshAfter(createPublicAlert(snapshot.game.code, alertTitle, alertMessage))}>Create Public TV Alert</ActionButton>
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="mb-3 text-lg font-black text-champagne">Generated Clues</h2>
        <div className="space-y-2">
          {snapshot.clues.map((clue) => (
            <article className="rounded-lg bg-white/10 p-3 gold-ring" key={clue.id}>
              <p className="font-bold text-champagne">{clue.clue_text}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/55">{clue.difficulty} · matches {clue.matching_player_count} · {clue.released ? "released" : "held"}</p>
              <button className="mt-3 rounded-lg bg-gold px-3 py-2 text-sm font-black text-obsidian" onClick={() => void refreshAfter(releasePublicClue(snapshot.game.code, clue.id))} type="button">
                Release Publicly
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
