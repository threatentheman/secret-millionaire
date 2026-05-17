"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminLogout } from "@/lib/actions";

export function SmartHomeLink() {
  const pathname = usePathname();
  const router = useRouter();
  const [href, setHref] = useState("/");
  const [hasPlayerSession, setHasPlayerSession] = useState(false);

  useEffect(() => {
    const code = window.localStorage.getItem("secret-millionaire-last-code");
    const playerId = code ? window.localStorage.getItem(`secret-millionaire-player-${code}`) : null;
    if (code && playerId) {
      setHref(`/game/${code}?player=${playerId}`);
      setHasPlayerSession(true);
    }
  }, []);

  async function logout() {
    if (pathname.startsWith("/admin")) {
      await adminLogout();
    } else {
      const code = window.localStorage.getItem("secret-millionaire-last-code");
      if (code) {
        window.localStorage.removeItem(`secret-millionaire-player-${code}`);
      }
      window.localStorage.removeItem("secret-millionaire-last-code");
      setHasPlayerSession(false);
      setHref("/");
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Link className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-champagne gold-ring" href={href}>
        Home
      </Link>
      <Link className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-champagne gold-ring" href="/rules">
        Rules
      </Link>
      {hasPlayerSession || pathname.startsWith("/admin") ? (
        <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-champagne gold-ring" onClick={() => void logout()} type="button">
          Logout
        </button>
      ) : null}
    </div>
  );
}
