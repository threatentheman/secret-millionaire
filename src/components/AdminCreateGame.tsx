"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createGame } from "@/lib/actions";
import type { Game } from "@/lib/domain";

type AdminCreateGameProps = {
  games: Game[];
};

export function AdminCreateGame({ games }: AdminCreateGameProps) {
  const router = useRouter();
  const [name, setName] = useState("Secret Millionaire: Bali Villa Edition");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const result = await createGame(name);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/admin/${result.data.code}`);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="text-xl font-black text-champagne">Open Game</h2>
        <p className="mt-1 text-sm text-white/65">Enter a game code to jump straight to the narrator controls.</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const cleanCode = code.trim().toUpperCase();
            if (cleanCode) router.push(`/admin/${cleanCode}`);
          }}
        >
          <input
            className="min-h-12 min-w-0 flex-1 rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-black uppercase text-champagne outline-none"
            maxLength={8}
            onChange={(event) => setCode(event.target.value)}
            placeholder="CODE"
            value={code}
          />
          <button className="rounded-lg bg-gold px-4 font-black uppercase text-obsidian" type="submit">
            Open
          </button>
        </form>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <h2 className="text-xl font-black text-champagne">Create Game</h2>
        <input className="mt-4 min-h-12 w-full rounded-lg border border-gold/40 bg-black/40 px-4 font-bold text-champagne outline-none" onChange={(event) => setName(event.target.value)} value={name} />
        {error ? <p className="mt-3 rounded-lg bg-danger/20 p-3 text-sm font-bold">{error}</p> : null}
        <button className="mt-4 min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian shadow-glow" onClick={() => void submit()} type="button">
          Create Game
        </button>
      </section>

      <section className="rounded-lg bg-black/35 p-4 gold-ring lg:col-span-2">
        <h2 className="text-xl font-black text-champagne">Recent Games</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {games.map((game) => (
            <Link className="rounded-lg bg-white/10 p-4 gold-ring" href={`/admin/${game.code}`} key={game.id}>
              <p className="text-2xl font-black text-gold">{game.code}</p>
              <p className="mt-1 font-bold text-champagne">{game.name}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-white/55">
                Day {game.current_day} · {game.current_phase.replaceAll("_", " ")}
              </p>
            </Link>
          ))}
          {games.length === 0 ? <p className="text-white/60">No games created yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
