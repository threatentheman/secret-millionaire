import Link from "next/link";
import { HomeJoin } from "@/components/HomeJoin";
import { Schedule } from "@/components/Schedule";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6">
      <section className="flex min-h-[70vh] flex-col justify-center">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gold">Bali Villa Edition</p>
        <h1 className="mt-3 text-5xl font-black leading-none text-champagne sm:text-7xl">Secret Millionaire</h1>
        <p className="mt-5 max-w-xl text-lg text-white/75">
          One person holds The Million. Everyone else has one Bazooka and three nights to find it, steal it, and survive the villa.
        </p>
        <div className="mt-8 rounded-lg bg-black/35 p-4 gold-ring">
          <HomeJoin />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link className="rounded-lg bg-white/10 px-4 py-3 text-center font-bold text-champagne gold-ring" href="/rules">
            Rules
          </Link>
          <Link className="rounded-lg bg-white/10 px-4 py-3 text-center font-bold text-champagne gold-ring" href="/admin">
            Admin
          </Link>
        </div>
      </section>
      <Schedule />
    </main>
  );
}
