"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PlayerGateProps = {
  gameCode: string;
  nextPath?: string;
};

export function PlayerGate({ gameCode, nextPath }: PlayerGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const playerId = window.localStorage.getItem(`secret-millionaire-player-${gameCode.toUpperCase()}`);
    if (!playerId) {
      router.replace(`/join/${gameCode.toUpperCase()}`);
      return;
    }
    if (nextPath) {
      router.replace(`${nextPath}?player=${playerId}`);
      return;
    }
    setReady(true);
  }, [gameCode, nextPath, router]);

  return ready ? null : <p className="rounded-lg bg-black/35 p-4 text-center font-bold text-champagne gold-ring">Opening your villa session...</p>;
}
