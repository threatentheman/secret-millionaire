import { PlayerDashboard } from "@/components/PlayerDashboard";
import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { getPlayerSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function GamePage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return (
      <Shell eyebrow="Player Dashboard" title="Loading Session">
        <PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}`} />
      </Shell>
    );
  }
  const snapshot = await getPlayerSnapshot(gameCode, player);
  return (
    <Shell eyebrow="Player Dashboard" title={snapshot.game.name}>
      <PlayerDashboard snapshot={snapshot} />
    </Shell>
  );
}
