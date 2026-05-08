import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { CollectionList } from "@/components/collections/CollectionList";
import { Button } from "@stackly/ui";
import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCollectionCounter, sortCollectionsForDisplay, type CollectionIndexCollection } from "@/lib/collection-index-display";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("title") };
}

export default async function CollectionsPage() {
  const session = await requireAuth();
  const t = await getTranslations("collections");

  const [user, collections] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { collectionsDisplayConfiguration: true },
    }),
    prisma.collection.findMany({
      where: { ownerId: session.user.id, parentId: null },
      include: {
        _count: { select: { children: true, items: true } },
        data: true,
      },
    }),
  ]);

  const displayConfiguration = user?.collectionsDisplayConfiguration ?? null;
  const sortedCollections = sortCollectionsForDisplay(collections as CollectionIndexCollection[], displayConfiguration);
  const collectionsCounter = sortedCollections.reduce((total, collection) => total + 1 + getCollectionCounter(collection, "children"), 0);
  const itemsCounter = sortedCollections.reduce((total, collection) => total + getCollectionCounter(collection, "items"), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              {collectionsCounter} {t("title").toLowerCase()}
            </span>
            <span>
              {itemsCounter} {t("items").toLowerCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/collections/edit">
              <Settings2 className="mr-2 h-4 w-4" />
              {t("editIndex")}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/collections/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        </div>
      </div>

      {displayConfiguration?.displayMode === "list" ? (
        <CollectionList collections={collections as CollectionIndexCollection[]} displayConfiguration={displayConfiguration} />
      ) : (
        <CollectionGrid collections={collections as CollectionIndexCollection[]} displayConfiguration={displayConfiguration} />
      )}
    </div>
  );
}
