import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";

export const metadata: Metadata = { title: "History" };

export default async function HistoryPage() {
  const session = await requireAuth();

  const logs = await prisma.log.findMany({
    where: { ownerId: session.user.id },
    orderBy: { loggedAt: "desc" },
    take: 100,
  });

  type LogEntry = (typeof logs)[number];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Storico Modifiche</h1>
      <div className="space-y-2">
        {logs.map((log: LogEntry) => (
          <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
              log.type === "create" ? "bg-green-100 text-green-700" :
              log.type === "delete" ? "bg-red-100 text-red-700" :
              "bg-blue-100 text-blue-700"
            }`}>{log.type}</span>
            <span className="font-medium">{log.objectLabel}</span>
            <span className="text-muted-foreground">{log.objectClass}</span>
            <span className="ml-auto text-muted-foreground">
              {log.loggedAt ? new Date(log.loggedAt).toLocaleString() : "—"}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-muted-foreground text-center py-8">Nessuna attività registrata.</p>
        )}
      </div>
    </div>
  );
}
