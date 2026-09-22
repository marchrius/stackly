import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getCollectionAncestors } from "@/lib/collections-tree";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { CollectionDetail } from "@/components/collections/CollectionDetail";
import { getTranslations } from "next-intl/server";
import { getAggregateCollectionCounters } from "@/lib/collection-detail";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("detailTitle") };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ imported?: string; skipped?: string; failed?: string; importFailed?: string; importLog?: string }>;
}

export default async function CollectionDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const importResult = await searchParams;
  const session = await requireAuth();
  const t = await getTranslations("collections");
  const tHistory = await getTranslations("history");

  const [collection, collectionCounterNodes] = await Promise.all([
    prisma.collection.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        children: {
          include: { _count: { select: { children: true, items: true } } },
          orderBy: { title: "asc" },
        },
        items: {
          orderBy: { name: "asc" },
          take: 50,
        },
        data: {
          orderBy: { position: "asc" },
          include: { choiceList: { select: { id: true, name: true, displayMode: true, selectionMode: true } } },
        },
        _count: { select: { children: true, items: true } },
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

  if (!collection) notFound();

  const ancestors = await getCollectionAncestors(session.user.id, collection.parentId);
  const aggregateCounters = getAggregateCollectionCounters(
    collectionCounterNodes.map((node) => ({
      id: node.id,
      parentId: node.parentId,
      directItems: node._count.items,
    })),
  );
  const childCounters = Object.fromEntries(
    collection.children.map((child) => [
      child.id,
      aggregateCounters[child.id] ?? {
        children: child._count.children,
        items: child._count.items,
      },
    ]),
  );

  return (
    <div className="space-y-4">
      {(importResult.imported || importResult.skipped || importResult.failed) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/30 p-3 text-sm">
          <span>
            {t("itemImportSummary", {
              created: Number(importResult.imported ?? 0),
              skipped: Number(importResult.skipped ?? 0),
              failed: Number(importResult.failed ?? 0),
            })}
          </span>
          {importResult.importLog ? (
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/history/imports?log=${importResult.importLog}#${importResult.importLog}`}>
              {tHistory("pageTitle")}
            </Link>
          ) : null}
        </div>
      )}
      {importResult.importFailed && <div className="rounded-md border border-destructive p-3 text-sm text-destructive">{t("itemImportFailed")}</div>}
      <CollectionDetail
        collection={collection}
        ancestors={ancestors}
        childCounters={childCounters}
      />
    </div>
  );
}
