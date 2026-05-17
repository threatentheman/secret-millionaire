import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function ArmoryPage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return <Shell eyebrow="Armory" title="Find Session"><PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/armory`} /></Shell>;
  }
  return (
    <Shell eyebrow="Armory" title="Narrator Controlled">
      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <p className="text-lg font-bold text-champagne">
          The Armory is handled by the narrator. If you are selected, the admin will assign your clue or power privately.
        </p>
      </section>
    </Shell>
  );
}
