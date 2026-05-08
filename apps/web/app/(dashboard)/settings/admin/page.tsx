import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackly/ui";
import { AdminConfigurationForm } from "@/components/settings/AdminConfigurationForm";
import { CONFIGURATION_LABELS, readAdminConfiguration } from "@/lib/configuration";
import { getTranslations } from "next-intl/server";
import { updateUserAdminRole } from "@/lib/actions/admin.actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("title") };
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const t = await getTranslations("admin");
  const tNav = await getTranslations("nav");
  const tCommon = await getTranslations("common");
  const tScrapers = await getTranslations("scrapers");

  const [usersCount, collectionsCount, itemsCount, albumsCount, scrapersCount, recentUsers, configurationEntries] = await Promise.all([
    prisma.user.count(),
    prisma.collection.count(),
    prisma.item.count(),
    prisma.album.count(),
    prisma.scraper.count(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
        select: { id: true, username: true, email: true, createdAt: true, roles: true },
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

      <Card>
        <CardHeader>
          <CardTitle>{t("users")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentUsers.map((user) => (
            <form
              key={user.id}
              action={updateUserAdminRole.bind(null, user.id)}
              className="flex flex-col gap-3 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-muted-foreground">{user.email}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("joinedOn", { date: new Date(user.createdAt).toLocaleDateString() })}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isAdmin" defaultChecked={Array.isArray(user.roles) && user.roles.includes("ROLE_ADMIN")} />
                  <span>{tNav("admin")}</span>
                </label>
                <Button type="submit" variant="outline" size="sm">
                  {tCommon("save")}
                </Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
