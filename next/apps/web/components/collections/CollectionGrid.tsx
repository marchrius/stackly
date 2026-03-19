"use client";

import type { Collection } from "@koillection/db";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@koillection/ui";
import { Layers, Box } from "lucide-react";
import { useTranslations } from "next-intl";

type CollectionWithCount = Collection & {
  _count: { children: number; items: number };
};

interface CollectionGridProps {
  collections: CollectionWithCount[];
}

function asHexColor(color: string | null): string {
  if (!color) return "#6366f1";
  return color.startsWith("#") ? color : `#${color}`;
}

export function CollectionGrid({ collections }: CollectionGridProps) {
  const t = useTranslations("collections");

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Layers className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t("empty")}</p>
        <p className="text-sm">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {collections.map((col) => (
        <Link key={col.id} href={`/collections/${col.id}`}>
          <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div
              className="relative aspect-[10/13] flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: col.color ? `${asHexColor(col.color)}22` : undefined }}
            >
              {col.image ? (
                <Image
                  src={`/uploads/${col.image}`}
                  alt={col.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
              <p className="font-medium text-sm truncate">{col.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {col._count.children > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {col._count.children}
                  </span>
                )}
                {col._count.items > 0 && (
                  <span className="flex items-center gap-1">
                    <Box className="h-3 w-3" /> {col._count.items}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

