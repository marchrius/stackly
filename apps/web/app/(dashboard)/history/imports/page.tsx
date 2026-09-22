import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Button } from "@stackly/ui";
import { ArrowLeft, FileSearch } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { prisma } from "@stackly/db";
import { requireAuth } from "@/lib/auth-utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Import logs" };
}

function statusVariant(status: string): "success" | "destructive" | "warning" | "info" | "secondary" {
  if (status === "created" || status === "completed") return "success";
  if (status === "failed") return "destructive";
  if (status === "partial") return "warning";
  if (status === "running") return "info";
  return "secondary";
}

export default async function ImportLogsPage({ searchParams }: { searchParams: Promise<{ log?: string }> }) {
  const { log: selectedLogId } = await searchParams;
  const session = await requireAuth();
  const tHistory = await getTranslations("history");
  const tCollections = await getTranslations("collections");

  const logs = await prisma.importLog.findMany({
    where: { ownerId: session.user.id },
    include: { entries: { orderBy: { loggedAt: "asc" } } },
    orderBy: { startedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title="Import logs" />
        <Button asChild variant="outline" size="sm">
          <Link href="/history"><ArrowLeft className="mr-2 h-4 w-4" />{tHistory("pageTitle")}</Link>
        </Button>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={FileSearch} title={tHistory("noActivity")} description={tHistory("noActivityHint")} />
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <details id={log.id} key={log.id} className="scroll-mt-20 rounded-lg border bg-card" open={selectedLogId === log.id || log.status !== "completed"}>
              <summary className="cursor-pointer list-none p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={statusVariant(log.status)}>{log.status}</Badge>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{log.collectionLabel ?? log.collectionId ?? "Collection import"}</div>
                    <div className="truncate text-sm text-muted-foreground">
                      {log.scraperLabel ?? "-"} · {new Date(log.startedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {tCollections("itemImportSummary", { created: log.created, skipped: log.skipped, failed: log.failed })}
                  </div>
                </div>
              </summary>

              <div className="border-t p-4">
                <div className="mb-3 text-sm text-muted-foreground">
                  {log.total} URL · {log.completedAt ? new Date(log.completedAt).toLocaleString() : log.status}
                </div>
                <div className="space-y-2">
                  {log.entries.map((entry) => (
                    <div key={entry.id} className="rounded-md border p-3 text-sm">
                      <div className="flex flex-wrap items-start gap-2">
                        <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
                        <a className="min-w-0 flex-1 break-all font-mono text-xs text-primary hover:underline" href={entry.sourceUrl} target="_blank" rel="noreferrer">
                          {entry.sourceUrl}
                        </a>
                        {entry.itemId ? <Link className="font-medium text-primary hover:underline" href={`/items/${entry.itemId}`}>{entry.itemLabel ?? entry.itemId}</Link> : null}
                      </div>
                      {entry.message ? <pre className="mt-2 whitespace-pre-wrap break-words rounded bg-muted p-2 font-sans text-xs text-muted-foreground">{entry.message}</pre> : null}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
