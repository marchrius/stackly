"use client";

import type { DisplayConfiguration } from "@koillection/db";
import Link from "next/link";
import { Card, CardContent } from "@koillection/ui";
import { Box, Layers } from "lucide-react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { type CollectionIndexCollection, getCollectionCounter, sortCollectionsForDisplay } from "@/lib/collection-index-display";

interface CollectionGridProps {
  collections: CollectionIndexCollection[];
  basePath?: string;
  displayConfiguration?: Pick<DisplayConfiguration, "sortingProperty" | "sortingType" | "sortingDirection"> | null;
}

function asHexColor(color: string | null): string {
  if (!color) return "#6366f1";
  return color.startsWith("#") ? color : `#${color}`;
}

export function CollectionGrid({ collections, basePath = "/collections", displayConfiguration }: CollectionGridProps) {
  const t = useTranslations("collections");
  const sortedCollections = useMemo(
    () => sortCollectionsForDisplay(collections, displayConfiguration),
    [collections, displayConfiguration],
  );

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layers className="mb-4 h-12 w-12 opacity-30" />
        <p className="text-lg font-medium">{t("empty")}</p>
        <p className="text-sm">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-x-2.5 gap-y-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
    >
      {sortedCollections.map((col) => {
        const childrenCount = getCollectionCounter(col, "children");
        const itemsCount = getCollectionCounter(col, "items");

        return (
          <Link key={col.id} href={`${basePath}/${col.id}`}>
            <Card className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md">
              <div
                className="relative flex aspect-[10/13] items-center justify-center overflow-hidden bg-muted"
                style={{ backgroundColor: col.color ? `${asHexColor(col.color)}22` : undefined }}
              >
                {col.image ? (
                  <img
                    src={`/uploads/${col.image}`}
                    alt={col.title}
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
                    style={{ backgroundColor: asHexColor(col.color) }}
                  >
                    {col.title.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="truncate text-sm font-medium">{col.title}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  {childrenCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3" /> {childrenCount}
                    </span>
                  )}
                  {itemsCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Box className="h-3 w-3" /> {itemsCount}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
