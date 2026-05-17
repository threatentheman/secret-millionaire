"use client";

import { Loader2 } from "lucide-react";
import { useTransition } from "react";

type ActionButtonProps = {
  children: React.ReactNode;
  action: () => Promise<void>;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
};

export function ActionButton({ children, action, variant = "primary", disabled = false }: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const styles = {
    primary: "bg-gold text-obsidian shadow-glow",
    ghost: "bg-white/10 text-champagne gold-ring",
    danger: "bg-danger text-white"
  };

  return (
    <button
      className={`tap-highlight flex min-h-12 w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-black uppercase tracking-wide ${styles[variant]} disabled:cursor-not-allowed disabled:opacity-50`}
      disabled={disabled || pending}
      onClick={() => startTransition(() => void action())}
      type="button"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      {children}
    </button>
  );
}
