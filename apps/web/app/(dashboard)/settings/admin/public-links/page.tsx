import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { prisma } from "@stackly/db";

const PUBLIC_VISIBILITY = "public";

type PublicLink = {
  id: string;
  type: string;
  label: string;
  owner: string;
  href: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("publicLinksTitle") };
}

export default async function AdminPublicLinksPage() {
  const t = await getTranslations("admin");

  const [collections, items, albums, wishlists] = await Promise.all([
    prisma.collection.findMany({
      where: { finalVisibility: PUBLIC_VISIBILITY },
      orderBy: { title: "asc" },
      select: { id: true, title: true, owner: { select: { username: true } } },
    }),
    prisma.item.findMany({
      where: { finalVisibility: PUBLIC_VISIBILITY },
      orderBy: { name: "asc" },
      select: { id: true, name: true, owner: { select: { username: true } } },
    }),
    prisma.album.findMany({
      where: { finalVisibility: PUBLIC_VISIBILITY },
      orderBy: { title: "asc" },
      select: { id: true, title: true, owner: { select: { username: true } } },
    }),
    prisma.wishlist.findMany({
      where: { finalVisibility: PUBLIC_VISIBILITY },
      orderBy: { name: "asc" },
      select: { id: true, name: true, owner: { select: { username: true } } },
    }),
  ]);

  const links: PublicLink[] = [
    ...collections.map((entry) => ({
      id: entry.id,
      type: t("publicLinkTypes.collection"),
      label: entry.title,
      owner: entry.owner?.username ?? "-",
      href: `/public/collections/${entry.id}`,
    })),
    ...items.map((entry) => ({
      id: entry.id,
      type: t("publicLinkTypes.item"),
      label: entry.name,
      owner: entry.owner?.username ?? "-",
      href: `/public/items/${entry.id}`,
    })),
    ...albums.map((entry) => ({
      id: entry.id,
      type: t("publicLinkTypes.album"),
      label: entry.title,
      owner: entry.owner?.username ?? "-",
      href: `/public/albums/${entry.id}`,
    })),
    ...wishlists.map((entry) => ({
      id: entry.id,
      type: t("publicLinkTypes.wishlist"),
      label: entry.name,
      owner: entry.owner?.username ?? "-",
      href: `/public/wishlists/${entry.id}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("publicLinksTitle")}</h1>
        <p className="text-muted-foreground">{t("publicLinksCount", { count: links.length })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("publicLinksTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("publicLinksEmpty")}</p>
          ) : (
            links.map((entry) => (
              <div key={`${entry.type}-${entry.id}`} className="grid gap-3 rounded-lg border p-3 text-sm md:grid-cols-[auto_1fr_auto] md:items-center">
                <Badge variant="outline">{entry.type}</Badge>
                <div className="min-w-0">
                  <p className="truncate font-medium">{entry.label}</p>
                  <p className="truncate text-muted-foreground">{entry.owner}</p>
                </div>
                <Link href={entry.href} className="break-all text-primary hover:underline">
                  {entry.href}
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
