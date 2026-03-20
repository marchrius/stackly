import type { Metadata } from "next";
import Link from "next/link";
import { Button, Input } from "@koillection/ui";
import { prisma } from "@koillection/db";
import { requireAuth } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { getCollectionAncestors } from "@/lib/collections-tree";
import { CollectionItemsGrid } from "@/components/collections/CollectionItemsGrid";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("items") };
}

export default async function CollectionItemsPage({ params, searchParams }: Props) {
  const [{ id }, { q }] = await Promise.all([params, searchParams]);
  const session = await requireAuth();
  const t = await getTranslations("collections");
  const tCommon = await getTranslations("common");
  const query = q?.trim() ?? "";

  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    select: {
      id: true,
      title: true,
      parentId: true,
      _count: { select: { items: true } },
    },
  });

  if (!collection) notFound();

  const [ancestors, items] = await Promise.all([
    getCollectionAncestors(session.user.id, collection.parentId),
    prisma.item.findMany({
      where: {
        ownerId: session.user.id,
        collectionId: collection.id,
        ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        quantity: true,
        imageSmallThumbnail: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground">
          {t("title")}
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={`/collections/${ancestor.id}`} className="hover:text-foreground">
              {ancestor.title}
            </Link>
          </span>
        ))}
        <span className="inline-flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          <Link href={`/collections/${collection.id}`} className="hover:text-foreground">
            {collection.title}
          </Link>
        </span>
        <span className="inline-flex items-center gap-1 text-foreground">
          <ChevronRight className="h-3 w-3" />
          {t("items")}
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{collection.title}</h1>
          <p className="text-sm text-muted-foreground">
            {items.length} / {collection._count.items} {t("items").toLowerCase()}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/collections/${collection.id}`}>{tCommon("back")}</Link>
        </Button>
      </div>

      <form className="max-w-sm">
        <Input name="q" defaultValue={query} placeholder={tCommon("search")} />
      </form>

      {items.length > 0 ? (
        <CollectionItemsGrid items={items} />
      ) : (
        <p className="text-sm text-muted-foreground">{tCommon("none")}</p>
      )}
    </div>
  );
}
