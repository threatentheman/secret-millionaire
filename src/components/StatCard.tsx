type StatCardProps = {
  label: string;
  value: React.ReactNode;
  tone?: "gold" | "lagoon" | "danger" | "plain";
};

export function StatCard({ label, value, tone = "plain" }: StatCardProps) {
  const toneClass = {
    gold: "text-gold",
    lagoon: "text-lagoon",
    danger: "text-danger",
    plain: "text-champagne"
  };

  return (
    <section className="rounded-lg bg-black/35 p-4 gold-ring">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">{label}</p>
      <div className={`mt-2 text-2xl font-black ${toneClass[tone]}`}>{value}</div>
    </section>
  );
}
