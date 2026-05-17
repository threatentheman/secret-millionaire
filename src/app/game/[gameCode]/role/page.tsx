import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { getPlayerSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function RolePage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return <Shell eyebrow="Role" title="Find Session"><PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/role`} /></Shell>;
  }
  const snapshot = await getPlayerSnapshot(gameCode, player);
  const isMillionaire = snapshot.player.role === "millionaire";
  return (
    <Shell eyebrow="Private Role" title={isMillionaire ? "You Hold The Million" : "You Are a Detective"}>
      <section className={`rounded-lg p-5 gold-ring ${isMillionaire ? "bg-gold/15" : "bg-black/35"}`}>
        <p className="text-6xl">{isMillionaire ? "👑" : "🕵️"}</p>
        <p className="mt-4 text-lg font-bold text-champagne">
          {isMillionaire ? "Protect The Million. Complete secret challenges. Survive until Wednesday night." : "Find the holder. Use your one Bazooka wisely. Public clues are all you get."}
        </p>
      </section>
    </Shell>
  );
}
