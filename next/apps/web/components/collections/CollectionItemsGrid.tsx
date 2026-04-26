"use client";

import type { Item } from "@stackly/db";
import Link from "next/link";
import { Box } from "lucide-react";
import { getUploadUrl } from "@stackly/lib";

type CollectionGridItem = Pick<Item, "id" | "name" | "quantity" | "imageSmallThumbnail">;

interface CollectionItemsGridProps {
  items: CollectionGridItem[];
}

export function CollectionItemsGrid({ items }: CollectionItemsGridProps) {
  return (
    <div
      className="grid gap-x-2.5 gap-y-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
    >
      {items.map((item) => (
        <Link key={item.id} href={`/items/${item.id}`}>
          <div className="group cursor-pointer overflow-hidden rounded-lg border bg-card text-center transition-shadow hover:shadow-md">
            <div className="relative aspect-[10/13] flex items-center justify-center overflow-hidden bg-muted">
              {item.imageSmallThumbnail ? (
                <img
                  src={getUploadUrl(item.imageSmallThumbnail) ?? ""}
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
  );
}
