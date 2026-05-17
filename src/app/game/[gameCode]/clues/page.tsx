import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { getPlayerSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function CluesPage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return <Shell eyebrow="Clues" title="Find Session"><PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/clues`} /></Shell>;
  }
  const snapshot = await getPlayerSnapshot(gameCode, player);
  return (
    <Shell eyebrow="Clues" title="Intel Board">
      <div className="grid gap-4">
        <section className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="text-xl font-black text-gold">Public Clues</h2>
          <div className="mt-3 space-y-2">
            {snapshot.publicClues.map((clue) => <p className="rounded-lg bg-white/10 p-3 font-bold" key={clue.id}>{clue.clue_text}</p>)}
          </div>
        </section>
        <section className="rounded-lg bg-black/35 p-4 gold-ring">
          <h2 className="text-xl font-black text-gold">Private Clues</h2>
          <div className="mt-3 space-y-2">
            {snapshot.privateClues.map((clue) => <p className="rounded-lg bg-gold/10 p-3 font-bold" key={clue.id}>{clue.clue_text}</p>)}
            {snapshot.privateClues.length === 0 ? <p className="text-white/55">No private clues assigned to you.</p> : null}
          </div>
        </section>
      </div>
    </Shell>
  );
}
