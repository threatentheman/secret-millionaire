"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { joinGame } from "@/lib/actions";

type JoinFormProps = {
  gameCode: string;
};

function sessionId() {
  const key = "secret-millionaire-session-id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}

export function JoinForm({ gameCode }: JoinFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [authCode, setAuthCode] = useState("");
  const [avatar, setAvatar] = useState("🥂");
  const [error, setError] = useState("");
  const avatars = useMemo(() => ["🥂", "🌴", "🔥", "💎", "🕶️", "🍸", "👑", "🌊", "✨", "🧿"], []);

  async function submit() {
    setError("");
    const result = await joinGame(gameCode, name, avatar, email, authCode, sessionId());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    window.localStorage.setItem(`secret-millionaire-player-${result.data.code}`, result.data.playerId);
    window.localStorage.setItem("secret-millionaire-last-code", result.data.code);
    router.push(result.data.surveyComplete ? `/game/${result.data.code}?player=${result.data.playerId}` : `/game/${result.data.code}/survey?player=${result.data.playerId}`);
  }

  return (
    <div className="space-y-4">
      <input
        className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-bold text-champagne outline-none focus:border-gold"
        onChange={(event) => setName(event.target.value)}
        placeholder="Your villa name"
        value={name}
      />
      <input
        className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-bold text-champagne outline-none focus:border-gold"
        inputMode="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
        value={email}
      />
      <input
        className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-bold text-champagne outline-none focus:border-gold"
        minLength={4}
        onChange={(event) => setAuthCode(event.target.value)}
        placeholder="Private code you choose"
        type="password"
        value={authCode}
      />
      <div className="grid grid-cols-5 gap-2">
        {avatars.map((emoji) => (
          <button
            className={`min-h-12 rounded-lg text-2xl gold-ring ${avatar === emoji ? "bg-gold" : "bg-white/10"}`}
            key={emoji}
            onClick={() => setAvatar(emoji)}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
      {error ? <p className="rounded-lg bg-danger/20 p-3 text-sm font-bold text-white">{error}</p> : null}
      <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian shadow-glow" onClick={() => void submit()} type="button">
        Join Game
      </button>
      <p className="text-center text-xs text-white/55">First time here? This registers you. Coming back? Use the same email and private code. No phone number collected.</p>
    </div>
  );
}
