import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Badge } from "@stackly/ui";
import { Clock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import Link from "next/link";
import { Button } from "@stackly/ui";

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
      <div className="flex items-center justify-between gap-3">
        <PageHeader title={t("pageTitle")} />
        <Button asChild variant="outline"><Link href="/history/imports">Import logs</Link></Button>
      </div>
      {logs.length > 0 ? (
        <div className="space-y-2">
          {logs.map((log: LogEntry) => {
            const logType = log.type ?? "update";

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm"
              >
                <Badge variant={getLogBadgeVariant(logType)}>{logType}</Badge>
                <span className="font-medium">{log.objectLabel}</span>
                <span className="text-muted-foreground">{log.objectClass}</span>
                <span className="ml-auto text-muted-foreground">
                  {log.loggedAt ? new Date(log.loggedAt).toLocaleString() : "-"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Clock}
          title={t("noActivity")}
          description={t("noActivityHint")}
        />
      )}
    </div>
  );
}
