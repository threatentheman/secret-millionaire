"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function HomeJoin() {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const clean = code.trim().toUpperCase();
        if (clean) router.push(`/join/${clean}`);
      }}
    >
      <input
        className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-center text-2xl font-black uppercase text-champagne outline-none focus:border-gold"
        maxLength={8}
        onChange={(event) => setCode(event.target.value)}
        placeholder="GAME CODE"
        value={code}
      />
      <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian shadow-glow" type="submit">
        Enter Villa
      </button>
    </form>
  );
}
