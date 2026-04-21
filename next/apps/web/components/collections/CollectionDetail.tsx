"use client";

import type { Collection, Datum, Item } from "@stackly/db";
import Link from "next/link";
import { Badge, Button } from "@stackly/ui";
import { CollectionGrid } from "./CollectionGrid";
import { Box, ChevronRight, Edit, FileDown, Layers, Plus } from "lucide-react";
import { deleteCollection } from "@/lib/actions/collection.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { getDisplayData } from "@/lib/item-detail";
import { getCollectionCachedSummary } from "@/lib/collection-detail";
import { formatCountryValue, formatCurrencyAmount, formatDateValue, formatPriceValue, parseListValues, renderRatingValue } from "@/lib/datum-format";
import { CollectionItemsGrid } from "./CollectionItemsGrid";

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
  const tItems = useTranslations("items");
  const displayData = useMemo(() => getDisplayData(collection.data), [collection.data]);
  const cachedSummary = useMemo(() => getCollectionCachedSummary(collection.cachedValues), [collection.cachedValues]);
  const childrenCount = cachedSummary.counters.children || collection._count.children;
  const itemsCount = cachedSummary.counters.items || collection._count.items;

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
        <span className="inline-flex items-center gap-1 text-foreground">
          <ChevronRight className="h-3 w-3" />
          {collection.title}
        </span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asHexColor(collection.color) }} />
            <h1 className="text-2xl font-bold tracking-tight">{collection.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {childrenCount > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {childrenCount} {t("subCollections").toLowerCase()}
              </span>
            )}
            {itemsCount > 0 && (
              <span className="flex items-center gap-1">
                <Box className="h-4 w-4" />
                {itemsCount} {t("items").toLowerCase()}
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
          {collection._count.items > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/collections/${collection.id}/items`}>
                <Box className="mr-1 h-4 w-4" />
                {t("items")}
              </Link>
            </Button>
          )}
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

      {(displayData.length > 0 || cachedSummary.prices.length > 0) && (
        <section>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {displayData.map((datum) => (
              <div key={datum.id} className="rounded-lg border p-3">
                {datum.label && <p className="mb-1 text-xs font-medium text-muted-foreground">{datum.label}</p>}
                {datum.type === "checkbox" ? (
                  <span className="text-sm">{datum.value === "1" ? `✓ ${tCommon("yes")}` : `✗ ${tCommon("no")}`}</span>
                ) : datum.type === "link" && datum.value ? (
                  <a href={datum.value} target="_blank" rel="noreferrer" className="break-all text-sm text-primary hover:underline">
                    {datum.value}
                  </a>
                ) : datum.type === "date" && datum.value ? (
                  <p className="break-words text-sm">{formatDateValue(datum.value)}</p>
                ) : datum.type === "list" || datum.type === "textarea" ? (
                  <p className="whitespace-pre-line break-words text-sm">{datum.value ?? tCommon("none")}</p>
                ) : datum.type === "file" && datum.file ? (
                  <a
                    href={`/uploads/${datum.file}`}
                    target="_blank"
                    rel="noreferrer"
                    download={datum.originalFilename ?? undefined}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <FileDown className="h-4 w-4" />
                    {datum.originalFilename ?? tItems("unknownFile")}
                  </a>
                ) : datum.type === "price" ? (
                  <p className="break-words text-sm">{formatPriceValue(datum.value, datum.currency) ?? tCommon("none")}</p>
                ) : datum.type === "rating" ? (
                  <p className="break-words text-sm">{renderRatingValue(datum.value) ?? tCommon("none")}</p>
                ) : datum.type === "country" ? (
                  <p className="break-words text-sm">{formatCountryValue(datum.value) ?? tCommon("none")}</p>
                ) : datum.type === "choice-list" ? (
                  <p className="break-words text-sm">{parseListValues(datum.value).join(", ") || tCommon("none")}</p>
                ) : (
                  <p className="break-words text-sm">{datum.value ?? tCommon("none")}</p>
                )}
              </div>
            ))}

            {cachedSummary.prices.map((priceGroup) => (
              <div key={priceGroup.label} className="rounded-lg border p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">{priceGroup.label}</p>
                <p className="break-words text-sm">
                  {priceGroup.currencies.map(({ currency, value }) => formatCurrencyAmount(value, currency)).join(" + ") || tCommon("none")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {collection.children.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t("subCollections")}</h2>
          <CollectionGrid collections={collection.children} />
        </section>
      )}

      {collection.items.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("items")}</h2>
            {collection._count.items > collection.items.length && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/collections/${collection.id}/items`}>{t("items")}</Link>
              </Button>
            )}
          </div>
          <CollectionItemsGrid items={collection.items} />
        </section>
      )}

      {collection.children.length === 0 && collection.items.length === 0 && displayData.length === 0 && cachedSummary.prices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Box className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">{t("emptyCollection")}</p>
          <p className="text-sm">{t("emptyCollectionHint")}</p>
        </div>
      )}
    </div>
  );
}
