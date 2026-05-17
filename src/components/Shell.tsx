import Link from "next/link";
import { SmartHomeLink } from "./SmartHomeLink";

type ShellProps = {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  nav?: Array<{ href: string; label: string }>;
};

export function Shell({ title, eyebrow, children, nav }: ShellProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-6">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <p className="text-xs font-black uppercase tracking-[0.22em] text-gold">{eyebrow}</p> : null}
          <h1 className="mt-1 text-3xl font-black leading-tight text-champagne sm:text-5xl">{title}</h1>
        </div>
        <SmartHomeLink />
      </header>
      {nav ? (
        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {nav.map((item) => (
            <Link className="whitespace-nowrap rounded-lg bg-white/10 px-3 py-2 text-sm font-bold text-champagne gold-ring" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      ) : null}
      {children}
    </main>
  );
}
