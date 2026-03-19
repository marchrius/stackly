"use client";

import type { Collection, Datum, Item } from "@koillection/db";
import Link from "next/link";
import { Badge, Button } from "@koillection/ui";
import { CollectionGrid } from "./CollectionGrid";
import { Box, ChevronRight, Edit, Layers, Plus } from "lucide-react";
import { deleteCollection } from "@/lib/actions/collection.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";

type CollectionWithRelations = Collection & {
  children: (Collection & { _count: { children: number; items: number } })[];
  items: Item[];
  data: Datum[];
  _count: { children: number; items: number };
};

interface CollectionDetailProps {
  collection: CollectionWithRelations;
  ancestors: { id: string; title: string }[];
}

function asHexColor(color: string | null): string {
  if (!color) return "#6366f1";
  return color.startsWith("#") ? color : `#${color}`;
}

export function CollectionDetail({ collection, ancestors }: CollectionDetailProps) {
  const t = useTranslations("collections");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
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
        <span className="inline-flex items-center gap-1 text-foreground">
          <ChevronRight className="h-3 w-3" />
          {collection.title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asHexColor(collection.color) }} />
            <h1 className="text-2xl font-bold tracking-tight">{collection.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {collection._count.children > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {collection._count.children} {t("subCollections").toLowerCase()}
              </span>
            )}
            {collection._count.items > 0 && (
              <span className="flex items-center gap-1">
                <Box className="h-4 w-4" />
                {collection._count.items} {t("items").toLowerCase()}
              </span>
            )}
            <Badge variant="outline">{collection.visibility}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/collections/new?parentId=${collection.id}`}>
              <Plus className="mr-1 h-4 w-4" />
              {t("newSub")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/new?collectionId=${collection.id}`}>
              <Plus className="mr-1 h-4 w-4" />
              {t("addItem")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/collections/${collection.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              {tCommon("edit")}
            </Link>
          </Button>
          <DeleteConfirmDialog
            description={t("delete.confirm", { name: collection.title })}
            onConfirm={deleteCollection.bind(null, collection.id)}
          />
        </div>
      </div>

      {/* Sotto-collezioni */}
      {collection.children.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("subCollections")}</h2>
          <CollectionGrid collections={collection.children} />
        </section>
      )}

      {/* Oggetti */}
      {collection.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("items")}</h2>
          <div
            className="grid gap-x-2.5 gap-y-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
          >
            {collection.items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <div className="group cursor-pointer rounded-lg border bg-card transition-shadow hover:shadow-md overflow-hidden text-center">
                  <div className="relative aspect-[10/13] bg-muted flex items-center justify-center overflow-hidden">
                    {item.imageSmallThumbnail ? (
                      <img
                        src={`/uploads/${item.imageSmallThumbnail}`}
                        alt={item.name}
                        loading="lazy"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <Box className="h-8 w-8 text-muted-foreground opacity-40" />
                    )}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-1 right-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                        x{item.quantity}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {collection.children.length === 0 && collection.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Box className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">{t("emptyCollection")}</p>
          <p className="text-sm">{t("emptyCollectionHint")}</p>
        </div>
      )}
    </div>
  );
}
