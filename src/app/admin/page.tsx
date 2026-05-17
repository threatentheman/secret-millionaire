import { AdminCreateGame } from "@/components/AdminCreateGame";
import { Shell } from "@/components/Shell";
import { getAdminGames } from "@/lib/actions";
import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminHomePage() {
  await requireAdminSession();
  const games = await getAdminGames();
  return (
    <Shell eyebrow="Narrator" title="Admin Dashboard">
      <AdminCreateGame games={games} />
    </Shell>
  );
}
