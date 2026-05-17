"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { submitSurvey } from "@/lib/actions";
import type { SurveyQuestion } from "@/lib/domain";

type SurveyFormProps = {
  gameCode: string;
  questions: SurveyQuestion[];
};

export function SurveyForm({ gameCode, questions }: SurveyFormProps) {
  const router = useRouter();
  const params = useSearchParams();
  const playerId = params.get("player");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  async function submit() {
    if (!playerId) {
      setError("Join again on this device.");
      return;
    }
    const result = await submitSurvey(gameCode, playerId, questions.map((question) => ({ questionId: question.id, answer: answers[question.id] ?? "" })));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/game/${gameCode}?player=${playerId}`);
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <label className="block rounded-lg bg-black/35 p-4 gold-ring" key={question.id}>
          <span className="text-xs font-black uppercase tracking-[0.18em] text-gold">Question {index + 1}</span>
          <span className="mt-2 block font-bold text-champagne">{question.question}</span>
          <input
            className="mt-3 min-h-12 w-full rounded-lg bg-black/60 px-3 text-champagne outline-none gold-ring"
            onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
            value={answers[question.id] ?? ""}
          />
        </label>
      ))}
      {error ? <p className="rounded-lg bg-danger/20 p-3 font-bold">{error}</p> : null}
      <button className="sticky bottom-4 min-h-14 w-full rounded-lg bg-gold px-4 font-black uppercase text-obsidian shadow-glow" onClick={() => void submit()} type="button">
        Save Survey
      </button>
    </div>
  );
}
