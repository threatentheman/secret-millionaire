import { AdminDetail } from "@/components/AdminDetail";

type PageProps = { params: Promise<{ gameCode: string }> };

export default async function Page({ params }: PageProps) {
  const { gameCode } = await params;
  return <AdminDetail gameCode={gameCode} section="final" />;
}
