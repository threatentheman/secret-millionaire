import { Shell } from "@/components/Shell";
import { surveyQuestions } from "@/lib/seed";

export default function SurveyQuestionsPage() {
  return (
    <Shell eyebrow="Survey" title="Survey Questions">
      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <ol className="space-y-3">
          {surveyQuestions.map((question, index) => (
            <li className="rounded-lg bg-white/10 p-3 font-bold text-champagne gold-ring" key={question}>
              <span className="mr-2 text-gold">{index + 1}.</span>
              {question}
            </li>
          ))}
        </ol>
      </section>
    </Shell>
  );
}
