import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { CollectionIndex } from "@/components/collections/CollectionIndex";
import { Button } from "@stackly/ui";
import { Plus, Settings2 } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  getCollectionCounter,
  sortCollectionsForDisplay,
  type CollectionIndexCollection,
} from "@/lib/collection-index-display";
import { PageHeader } from "@/components/shared/PageHeader";
import { getAggregateCollectionCounters } from "@/lib/collection-detail";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("title") };
}

export default async function CollectionsPage() {
  const session = await requireAuth();
  const t = await getTranslations("collections");

  const [user, collections, collectionCounterNodes] = await Promise.all([
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
    prisma.collection.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        parentId: true,
        _count: { select: { items: true } },
      },
    }),
  ]);

  const displayConfiguration = user?.collectionsDisplayConfiguration ?? null;
  const sortedCollections = sortCollectionsForDisplay(
    collections as CollectionIndexCollection[],
    displayConfiguration,
  );
  const aggregateCounters = getAggregateCollectionCounters(
    collectionCounterNodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      directItems: node._count.items,
    })),
  );
  const collectionsCounter = sortedCollections.reduce(
    (total, collection) =>
      total +
      1 +
      (aggregateCounters[collection.id]?.children ??
        getCollectionCounter(collection, "children")),
    0,
  );
  const itemsCounter = sortedCollections.reduce(
    (total, collection) =>
      total +
      (aggregateCounters[collection.id]?.items ??
        getCollectionCounter(collection, "items")),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {collectionsCounter} {t("title").toLowerCase()}
            </span>
            <span>
              {itemsCounter} {t("items").toLowerCase()}
            </span>
          </div>
        }
        actions={
          <>
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
          </>
        }
      />

      <CollectionIndex
        collections={collections as CollectionIndexCollection[]}
        displayConfiguration={displayConfiguration}
        counterOverrides={aggregateCounters}
      />
    </div>
  );
}
