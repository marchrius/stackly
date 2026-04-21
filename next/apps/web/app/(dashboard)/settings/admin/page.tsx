import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackly/ui";
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

  const [usersCount, collectionsCount, itemsCount, albumsCount, recentUsers, configurationEntries] = await Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.album.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
        select: { id: true, username: true, email: true, createdAt: true },
      }),
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
        <CardHeader>
          <CardTitle>{t("recentUsers")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentUsers.map((user) => (
            <div key={user.id} className="flex flex-col gap-0.5 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <p className="text-muted-foreground">{t("joinedOn", { date: new Date(user.createdAt).toLocaleDateString() })}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
