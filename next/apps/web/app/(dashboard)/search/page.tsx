import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Input } from "@koillection/ui";
import { SearchResults } from "@/components/shared/SearchResults";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

interface Props { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const session = await requireAuth();
  const t = await getTranslations("search");

  const query = q?.trim() ?? "";

  const [items, collections, tags, wishlists, wishes] = query.length >= 2
    ? await Promise.all([
        prisma.item.findMany({
          where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } },
          take: 20,
          include: { collection: { select: { id: true, title: true } } },
        }),
        prisma.collection.findMany({
          where: { ownerId: session.user.id, title: { contains: query, mode: "insensitive" } },
          take: 10,
        }),
        prisma.tag.findMany({
          where: { ownerId: session.user.id, label: { contains: query, mode: "insensitive" } },
          take: 10,
        }),
        prisma.wishlist.findMany({
          where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } },
          take: 10,
        }),
        prisma.wish.findMany({
          where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } },
          take: 20,
          include: { wishlist: { select: { id: true, name: true } } },
        }),
      ])
    : [[], [], [], [], []];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <form method="GET">
        <Input name="q" defaultValue={query} placeholder={t("placeholder")} className="max-w-lg" autoFocus />
      </form>
      {query.length >= 2 && (
        <SearchResults items={items} collections={collections} tags={tags} wishlists={wishlists} wishes={wishes} query={query} />
      )}
    </div>
  );
}
