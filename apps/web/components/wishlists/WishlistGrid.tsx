"use client";

import type { Wishlist } from "@stackly/db";
import Link from "next/link";
import { Card, CardContent } from "@stackly/ui";
import { Heart, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { getUploadUrl } from "@stackly/lib";
import { sortByNaturalText } from "@/lib/natural-sort";

type WishlistWithCount = Wishlist & { _count: { children: number; wishes: number } };

interface WishlistGridProps {
  wishlists: WishlistWithCount[];
  basePath?: string;
}

export function WishlistGrid({ wishlists, basePath = "/wishlists" }: WishlistGridProps) {
  const t = useTranslations("wishlists");
  const sortedWishlists = sortByNaturalText(wishlists, (wishlist) => wishlist.name);

  if (wishlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Heart className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t("empty")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {sortedWishlists.map((wl) => (
        <Link key={wl.id} href={`${basePath}/${wl.id}`}>
          <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div
              className="relative aspect-[10/13] flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: wl.color ? `#${wl.color}22` : undefined }}
            >
              {wl.image ? (
                <img
                  src={getUploadUrl(wl.image) ?? ""}
                  alt={wl.name}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: wl.color ? `#${wl.color}` : "#ec4899" }}
                >
                  {wl.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="font-medium text-sm truncate">{wl.name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {wl._count.children > 0 && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{wl._count.children}</span>}
                {wl._count.wishes > 0 && <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{wl._count.wishes}</span>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
