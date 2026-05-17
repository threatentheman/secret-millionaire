import { PlayerGate } from "@/components/PlayerGate";
import { Shell } from "@/components/Shell";
import { SurveyForm } from "@/components/SurveyForm";
import { getSurveyQuestions, hasCompletedSurvey } from "@/lib/actions";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ gameCode: string }>;
  searchParams: Promise<{ player?: string }>;
};

export default async function SurveyPage({ params, searchParams }: PageProps) {
  const { gameCode } = await params;
  const { player } = await searchParams;
  const { questions } = await getSurveyQuestions(gameCode);
  if (player && await hasCompletedSurvey(gameCode, player)) {
    redirect(`/game/${gameCode.toUpperCase()}?player=${player}`);
  }

  return (
    <Shell eyebrow="Player Survey" title="Tell the Villa Everything">
      {!player ? <PlayerGate gameCode={gameCode} nextPath={`/game/${gameCode}/survey`} /> : <SurveyForm gameCode={gameCode.toUpperCase()} questions={questions} />}
    </Shell>
  );
}
