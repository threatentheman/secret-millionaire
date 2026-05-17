import { AdminPanel } from "@/components/AdminPanel";
import { Shell } from "@/components/Shell";
import { getAdminSnapshot } from "@/lib/actions";
import { requireAdminSession } from "@/lib/admin-auth";

type PageProps = {
  params: Promise<{ gameCode: string }>;
};

function adminNav(code: string) {
  return ["players", "teams", "challenges", "armory", "bazookas", "clues", "events", "final"].map((item) => ({
    href: `/admin/${code}/${item}`,
    label: item
  }));
}

export default async function AdminGamePage({ params }: PageProps) {
  await requireAdminSession();
  const { gameCode } = await params;
  const snapshot = await getAdminSnapshot(gameCode);
  return (
    <Shell eyebrow="Narrator Dashboard" nav={adminNav(snapshot.game.code)} title={snapshot.game.name}>
      <AdminPanel snapshot={snapshot} />
    </Shell>
  );
}
