import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { getTranslations } from "next-intl/server";

function getEntryCount(content: unknown) {
  if (Array.isArray(content)) return content.length;
  if (content && typeof content === "object") return Object.keys(content).length;
  return 0;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventories");
  return { title: t("title") };
}

export default async function InventoriesPage() {
  const session = await requireAuth();
  const t = await getTranslations("inventories");

  const inventories = await prisma.inventory.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("count", { count: inventories.length })}</p>
        </div>
        <Button asChild>
          <Link href="/inventories/new">{t("new")}</Link>
        </Button>
      </div>

      {inventories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inventories.map((inventory) => (
            <Link key={inventory.id} href={`/inventories/${inventory.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{inventory.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{t("entriesCount", { count: getEntryCount(inventory.content) })}</p>
                  <p>{t("updatedAt", { date: new Date(inventory.updatedAt ?? inventory.createdAt).toLocaleDateString() })}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Package}
          title={t("empty")}
          description={t("emptyHint")}
        />
      )}
    </div>
  );
}
