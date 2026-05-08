import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/EmptyState";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scrapers");
  return { title: t("title") };
}

export default async function ScrapersPage() {
  const session = await requireAuth();
  const t = await getTranslations("scrapers");

  const scrapers = await prisma.scraper.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { dataPaths: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("count", { count: scrapers.length })}</p>
        </div>
        <Button asChild>
          <Link href="/scrapers/new">{t("new")}</Link>
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
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>{t("type", { type: scraper.type ? t(`types.${scraper.type}` as never) : t("unknownType") })}</p>
                <p>{t("pathsCount", { count: scraper._count.dataPaths })}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Wrench} title={t("empty")} />
      )}
    </div>
  );
}
