import { requireAuth } from "@/lib/auth-utils";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { ROLES } from "@stackly/lib";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth();
  const isAdmin = session.user.roles.includes(ROLES.ADMIN);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isAdmin={isAdmin} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
