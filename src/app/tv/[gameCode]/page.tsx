import { TvDashboard } from "@/components/TvDashboard";
import { getTvSnapshot } from "@/lib/actions";

type PageProps = {
  params: Promise<{ gameCode: string }>;
};

export default async function TvPage({ params }: PageProps) {
  const { gameCode } = await params;
  const snapshot = await getTvSnapshot(gameCode);
  return <TvDashboard snapshot={snapshot} />;
}
