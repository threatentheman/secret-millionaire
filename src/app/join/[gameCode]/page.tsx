import { JoinForm } from "@/components/JoinForm";
import { Shell } from "@/components/Shell";

type PageProps = {
  params: Promise<{ gameCode: string }>;
};

export default async function JoinPage({ params }: PageProps) {
  const { gameCode } = await params;
  return (
    <Shell eyebrow="Player Login" title="Enter the Villa">
      <section className="rounded-lg bg-black/35 p-4 gold-ring">
        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-gold">Code {gameCode.toUpperCase()}</p>
        <JoinForm gameCode={gameCode.toUpperCase()} />
      </section>
    </Shell>
  );
}
