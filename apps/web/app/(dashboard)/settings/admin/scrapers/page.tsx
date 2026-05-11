import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scrapers");
  return { title: t("title") };
}

export default async function AdminScrapersPage() {
  await requireAdmin();
  const t = await getTranslations("scrapers");

  const scrapers = await prisma.scraper.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { username: true } },
      _count: { select: { dataPaths: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("count", { count: scrapers.length })}</p>
        </div>
        <Button asChild>
          <Link href="/scrapers/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("new")}
          </Link>
        </Button>
      </div>

      {scrapers.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scrapers.map((scraper) => (
            <Card key={scraper.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  <Link href={`/scrapers/${scraper.id}`} className="hover:underline">
                    {scraper.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>{scraper.owner?.username}</p>
                <p>{t("type", { type: scraper.type ? t(`types.${scraper.type}` as never) : t("unknownType") })}</p>
                <p>{t("pathsCount", { count: scraper._count.dataPaths })}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/scrapers/${scraper.id}/edit`}>{t("edit")}</Link>
                  </Button>
                  <DeleteResourceButton
                    endpoint={`/api/scrapers/${scraper.id}`}
                    redirectTo="/settings/admin/scrapers"
                    triggerLabel={t("deleteAction")}
                    description={t("delete.confirm", { name: scraper.name })}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
