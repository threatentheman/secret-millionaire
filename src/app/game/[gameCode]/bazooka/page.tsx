import { BazookaForm } from "@/components/BazookaForm";
import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { getPlayerSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function BazookaPage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return <Shell eyebrow="Bazooka" title="Find Session"><PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/bazooka`} /></Shell>;
  }
  const snapshot = await getPlayerSnapshot(gameCode, player);
  return <Shell eyebrow="Bazooka" title="One Shot"><BazookaForm snapshot={snapshot} /></Shell>;
}
