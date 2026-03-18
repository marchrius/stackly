import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";

export const metadata: Metadata = { title: "Prestiti" };

export default async function LoansPage() {
  const session = await requireAuth();

  const loans = await prisma.loan.findMany({
    where: { ownerId: session.user.id },
    orderBy: { lentAt: "desc" },
    include: { item: { select: { id: true, name: true, image: true } } },
  });

  const active = loans.filter((l) => !l.returnedAt);
  const returned = loans.filter((l) => l.returnedAt);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Prestiti</h1>
      <section>
        <h2 className="text-lg font-semibold mb-3">In prestito ({active.length})</h2>
        <div className="space-y-2">
          {active.map((loan) => (
            <div key={loan.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
              <span className="font-medium">{loan.item?.name ?? "—"}</span>
              <span className="text-muted-foreground">prestato a {loan.lentTo}</span>
              <span className="ml-auto text-muted-foreground">{new Date(loan.lentAt).toLocaleDateString()}</span>
            </div>
          ))}
          {active.length === 0 && <p className="text-muted-foreground">Nessun oggetto in prestito.</p>}
        </div>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">Restituiti ({returned.length})</h2>
        <div className="space-y-2">
          {returned.slice(0, 20).map((loan) => (
            <div key={loan.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm opacity-60">
              <span className="font-medium">{loan.item?.name ?? "—"}</span>
              <span className="text-muted-foreground">→ {loan.lentTo}</span>
              <span className="ml-auto text-muted-foreground">
                {loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : "—"}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

