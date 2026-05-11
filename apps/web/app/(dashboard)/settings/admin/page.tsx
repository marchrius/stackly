import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackly/ui";
import { AdminConfigurationForm } from "@/components/settings/AdminConfigurationForm";
import { CONFIGURATION_LABELS, readAdminConfiguration } from "@/lib/configuration";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");
  const tScrapers = await getTranslations("scrapers");

  const [usersCount, collectionsCount, itemsCount, albumsCount, scrapersCount, configurationEntries] = await Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.album.count(),
    prisma.scraper.count(),
    prisma.configuration.findMany({
      where: {
        label: {
          in: Object.values(CONFIGURATION_LABELS),
        },
      },
      select: { label: true, value: true },
    }),
  ]);
  const configuration = readAdminConfiguration(configurationEntries);

  const cards = [
    { label: t("users"), value: usersCount },
    { label: tNav("collections"), value: collectionsCount },
    { label: t("items"), value: itemsCount },
    { label: tNav("albums"), value: albumsCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("configurationTitle")}</CardTitle>
          <CardDescription>{t("configurationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminConfigurationForm configuration={configuration} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>{tScrapers("title")}</CardTitle>
            <CardDescription>{tScrapers("count", { count: scrapersCount })}</CardDescription>
          </div>
          <Button asChild variant="outline">
            <Link href="/settings/admin/scrapers">{tScrapers("title")}</Link>
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
