import { AdminLoginForm } from "@/components/AdminLoginForm";
import { Shell } from "@/components/Shell";

export default function AdminLoginPage() {
  return (
    <Shell eyebrow="Narrator Login" title="Admin Entry">
      <AdminLoginForm />
    </Shell>
  );
}
