import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { VoteForm } from "@/components/VoteForm";
import { getPlayerSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function VotePage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  if (!player) {
    return <Shell eyebrow="Vote Off" title="Find Session"><PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/vote`} /></Shell>;
  }
  const snapshot = await getPlayerSnapshot(gameCode, player);
  return <Shell eyebrow="Vote Off" title="Send Someone Home"><VoteForm snapshot={snapshot} /></Shell>;
}
