import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Badge } from "@stackly/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history");
  return { title: t("title") };
}

function getLogBadgeVariant(type: string): "success" | "destructive" | "info" {
  if (type === "create") {
    return "success";
  }

  if (type === "delete") {
    return "destructive";
  }

  return "info";
}

export default async function HistoryPage() {
  const session = await requireAuth();
  const t = await getTranslations("history");

  const logs = await prisma.log.findMany({
    where: { ownerId: session.user.id },
    orderBy: { loggedAt: "desc" },
    take: 100,
  });

  type LogEntry = (typeof logs)[number];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("pageTitle")}</h1>
      <div className="space-y-2">
        {logs.map((log: LogEntry) => {
          const logType = log.type ?? "update";

          return (
          <div key={log.id} className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <Badge variant={getLogBadgeVariant(logType)}>{logType}</Badge>
            <span className="font-medium">{log.objectLabel}</span>
            <span className="text-muted-foreground">{log.objectClass}</span>
            <span className="ml-auto text-muted-foreground">
              {log.loggedAt ? new Date(log.loggedAt).toLocaleString() : "-"}
            </span>
          </div>
          );
        })}
        {logs.length === 0 && <p className="py-8 text-center text-muted-foreground">{t("noActivity")}</p>}
      </div>
    </div>
  );
}
