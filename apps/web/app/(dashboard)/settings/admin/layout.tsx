import { requireAdmin } from "@/lib/auth-utils";
import { AdminNav } from "@/components/settings/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <AdminNav />
      {children}
    </div>
  );
}
