import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Card, CardContent, CardHeader, CardTitle } from "@koillection/ui";
import { Library, Image, Heart, Tag } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard");
  return { title: t("title") ?? "Dashboard" };
}

export default async function DashboardPage() {
  const session = await requireAuth();
  const t = await getTranslations("dashboard");

  const [collectionsCount, albumsCount, wishlistsCount, tagsCount] = await Promise.all([
    prisma.collection.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.album.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.wishlist.count({ where: { ownerId: session.user.id, parentId: null } }),
    prisma.tag.count({ where: { ownerId: session.user.id } }),
  ]);

  const stats = [
    { label: t("collections"), count: collectionsCount, icon: Library, href: "/collections", colorClass: "text-[hsl(var(--chart-1))]" },
    { label: t("albums"), count: albumsCount, icon: Image, href: "/albums", colorClass: "text-[hsl(var(--chart-2))]" },
    { label: t("wishlists"), count: wishlistsCount, icon: Heart, href: "/wishlists", colorClass: "text-[hsl(var(--chart-3))]" },
    { label: t("tags"), count: tagsCount, icon: Tag, href: "/tags", colorClass: "text-[hsl(var(--chart-7))]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("welcome", { name: session.user.name ?? "" })}
        </h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.href} href={stat.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.colorClass}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
