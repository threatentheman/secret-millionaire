"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminLogin } from "@/lib/actions";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("jasmineibikunle@hotmail.co.uk");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    const result = await adminLogin(email, password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <section className="rounded-lg bg-black/35 p-4 gold-ring">
      <div className="space-y-3">
        <input
          className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-bold text-champagne outline-none focus:border-gold"
          inputMode="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Admin email"
          type="email"
          value={email}
        />
        <input
          className="min-h-14 w-full rounded-lg border border-gold/40 bg-black/40 px-4 text-lg font-bold text-champagne outline-none focus:border-gold"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        {error ? <p className="rounded-lg bg-danger/20 p-3 text-sm font-bold text-white">{error}</p> : null}
        <button className="min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian shadow-glow" onClick={() => void submit()} type="button">
          Enter Admin
        </button>
      </div>
    </section>
  );
}
