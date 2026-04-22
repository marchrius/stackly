import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Input } from "@stackly/ui";
import { SearchResults } from "@/components/shared/SearchResults";
import { Pagination } from "@/components/shared/Pagination";
import { DEFAULT_PAGE_SIZE } from "@stackly/lib";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

interface Props { searchParams: Promise<{ q?: string; page?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q, page } = await searchParams;
  const session = await requireAuth();
  const t = await getTranslations("search");

  const query = q?.trim() ?? "";
  const currentPage = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const shouldSearch = query.length >= 2;
  const browseAll = query.length === 0;

  let items: Awaited<ReturnType<typeof prisma.item.findMany>> = [];
  let collections: Awaited<ReturnType<typeof prisma.collection.findMany>> = [];
  let tags: Awaited<ReturnType<typeof prisma.tag.findMany>> = [];
  let wishlists: Awaited<ReturnType<typeof prisma.wishlist.findMany>> = [];
  let wishes: Awaited<ReturnType<typeof prisma.wish.findMany>> = [];
  let totalCount = 0;

  if (shouldSearch) {
    [items, collections, tags, wishlists, wishes] = await Promise.all([
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
      ]);

    const [itemCount, collectionCount, tagCount, wishlistCount, wishCount] = await Promise.all([
      prisma.item.count({ where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } } }),
      prisma.collection.count({ where: { ownerId: session.user.id, title: { contains: query, mode: "insensitive" } } }),
      prisma.tag.count({ where: { ownerId: session.user.id, label: { contains: query, mode: "insensitive" } } }),
      prisma.wishlist.count({ where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } } }),
      prisma.wish.count({ where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } } }),
    ]);

    totalCount = itemCount + collectionCount + tagCount + wishlistCount + wishCount;
  } else if (browseAll) {
    [items, collections, tags, wishlists, wishes] = await Promise.all([
        prisma.item.findMany({
          where: { ownerId: session.user.id },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { name: "asc" },
          include: { collection: { select: { id: true, title: true } } },
        }),
        prisma.collection.findMany({
          where: { ownerId: session.user.id },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { title: "asc" },
        }),
        prisma.tag.findMany({
          where: { ownerId: session.user.id },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { label: "asc" },
        }),
        prisma.wishlist.findMany({
          where: { ownerId: session.user.id },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { name: "asc" },
        }),
        prisma.wish.findMany({
          where: { ownerId: session.user.id },
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          orderBy: { name: "asc" },
          include: { wishlist: { select: { id: true, name: true } } },
        }),
      ]);
    const [itemCount, collectionCount, tagCount, wishlistCount, wishCount] = await Promise.all([
      prisma.item.count({ where: { ownerId: session.user.id } }),
      prisma.collection.count({ where: { ownerId: session.user.id } }),
      prisma.tag.count({ where: { ownerId: session.user.id } }),
      prisma.wishlist.count({ where: { ownerId: session.user.id } }),
      prisma.wish.count({ where: { ownerId: session.user.id } }),
    ]);
    totalCount = itemCount + collectionCount + tagCount + wishlistCount + wishCount;
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const getHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (nextPage > 1) params.set("page", String(nextPage));
    return `/search${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <form method="GET">
        <Input name="q" defaultValue={query} placeholder={t("placeholder")} className="max-w-lg" autoFocus />
      </form>
      {(shouldSearch || browseAll) && (
        <SearchResults
          items={items}
          collections={collections}
          tags={tags}
          wishlists={wishlists}
          wishes={wishes}
          query={query}
          totalCount={totalCount}
        />
      )}
      {browseAll && <Pagination page={currentPage} totalPages={totalPages} getHref={getHref} />}
    </div>
  );
}
