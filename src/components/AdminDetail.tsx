import { Shell } from "@/components/Shell";
import { getAdminSnapshot } from "@/lib/actions";
import { requireAdminSession } from "@/lib/admin-auth";

type AdminDetailProps = {
  gameCode: string;
  section: string;
};

export async function AdminDetail({ gameCode, section }: AdminDetailProps) {
  await requireAdminSession();
  const snapshot = await getAdminSnapshot(gameCode);
  const holder = snapshot.players.find((player) => player.id === snapshot.game.million_holder_player_id);

  return (
    <Shell eyebrow="Narrator Detail" title={`${snapshot.game.code} · ${section}`}>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="text-xl font-black text-gold">Players</h2>
          <div className="mt-3 space-y-2">
            {snapshot.players.map((player) => (
              <article className="rounded-lg bg-white/10 p-3" key={player.id}>
                <p className="font-black text-champagne">{player.avatar_emoji ?? ""} {player.name}</p>
                <p className="text-sm text-white/65">
                  {player.role} · lives {player.extra_lives} · bazooka {player.bazooka_available ? "ready" : "used"} · shield {player.shield_active ? "on" : "off"}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="text-xl font-black text-gold">Admin Context</h2>
          <p className="mt-3 text-lg font-bold text-champagne">Million holder: {holder ? holder.name : "Unassigned"}</p>
          <p className="mt-2 text-white/70">Use the main admin dashboard for live actions. This view gives a quick readable slice for {section}.</p>
          <div className="mt-4 space-y-2">
            {snapshot.events.slice(0, 8).map((event) => (
              <article className="rounded-lg bg-white/10 p-3" key={event.id}>
                <p className="font-black text-champagne">{event.title}</p>
                <p className="text-sm text-white/65">{event.message}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </Shell>
  );
}
