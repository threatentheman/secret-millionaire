import { Shell } from "@/components/Shell";

const sections = [
  {
    title: "The Premise",
    body: [
      "Welcome to Secret Millionaire: Bali Villa Edition. For the next three days, this villa is a social strategy game, a deception game, and a power game.",
      "One player secretly begins holding The Million. Everyone else becomes a Detective. If you hold The Million at the final lock on Wednesday night, you win a free dinner."
    ]
  },
  {
    title: "Setup Night",
    body: [
      "Every player joins the game and completes a private survey. Your answers matter because they are used to generate clues about the current Millionaire.",
      "After roles are assigned, only you know whether you are the Secret Millionaire or a Detective.",
      "Tonight includes Mulan, the introductory knockout game. Only Mulan winners receive one Extra Life."
    ]
  },
  {
    title: "Bazookas",
    body: [
      "Every player starts with exactly one Bazooka for the whole game.",
      "Use it to accuse someone you believe currently holds The Million. If correct, you steal The Million immediately. If wrong, your Bazooka is gone forever."
    ]
  },
  {
    title: "Daily Structure",
    body: [
      "Each full day has one Main Challenge, one Secret Millionaire Challenge, and one clue.",
      "Main Challenges are team games. The winning team chooses one player to enter The Armory.",
      "Inside The Armory, the chosen player may receive a generated clue or a strategic power. Once they leave, they may tell the truth, lie, or say nothing."
    ]
  },
  {
    title: "Secret Challenges",
    body: [
      "Every day, the current Millionaire receives a private mission. It may involve phrases, accusations, collecting items, pool jumps, or creating chaos.",
      "The narrator must be present to witness and confirm the challenge. If successful, the Millionaire gains the listed power.",
      "If The Million moves, the villa is told only that The Million has moved. No one is told who had it or who received it."
    ]
  },
  {
    title: "Clues",
    body: [
      "Daily clues are generated based on the real current Millionaire using surveys, behavior, strategy, or actions.",
      "Clues are designed to create suspicion, not certainty. Watch people. Listen carefully. Sometimes the loudest Detective is hiding everything."
    ]
  },
  {
    title: "Core Rules",
    body: [
      "Whoever holds The Million at the end of Wednesday night wins.",
      "Every player gets one Bazooka only.",
      "Only Mulan winners get an Extra Life.",
      "Armory rewards are private, and players may lie about them.",
      "The Millionaire must complete secret challenges with the narrator present.",
      "When The Million moves, the group is alerted but not informed.",
      "Trust no one too easily."
    ]
  }
];

export default function RulesPage() {
  return (
    <Shell eyebrow="Rules" title="How to Play">
      <div className="space-y-4">
        {sections.map((section) => (
          <section className="rounded-lg bg-black/35 p-4 gold-ring" key={section.title}>
            <h2 className="text-2xl font-black text-gold">{section.title}</h2>
            <div className="mt-3 space-y-3 text-base font-medium leading-relaxed text-white/80">
              {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </section>
        ))}
      </div>
    </Shell>
  );
}
