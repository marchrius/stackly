"use client";

import type { Wishlist, Wish } from "@stackly/db";
import Link from "next/link";
import { Button, Badge } from "@stackly/ui";
import { WishlistGrid } from "./WishlistGrid";
import { Edit, ExternalLink, Heart, ChevronRight, Plus } from "lucide-react";
import { deleteWishlist } from "@/lib/actions/media.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";

interface Ancestor {
  id: string;
  name: string;
}

type WishlistWithRelations = Wishlist & {
  children: (Wishlist & { _count: { wishes: number } })[];
  wishes: Wish[];
  _count: { children: number; wishes: number };
  ancestors?: Ancestor[];
};

interface WishlistDetailProps {
  wishlist: WishlistWithRelations;
  readOnly?: boolean;
  basePath?: string;
}

export function WishlistDetail({ wishlist, readOnly = false, basePath = "/wishlists" }: WishlistDetailProps) {
  const t = useTranslations("wishlists");
  const tCommon = useTranslations("common");
  const ancestors = wishlist.ancestors ?? [];
  const visibleChildrenCount = wishlist.children.length;
  const visibleWishesCount = wishlist.wishes.length;

  return (
    <div className="space-y-6">
      {(ancestors.length > 0 || wishlist.parentId) && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          <Link href="/wishlists" className="hover:text-foreground transition-colors">{t("title")}</Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`${basePath}/${ancestor.id}`} className="hover:text-foreground transition-colors">{ancestor.name}</Link>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{wishlist.name}</span>
        </nav>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {wishlist.image ? (
            <img src={`/uploads/${wishlist.image}`} alt={wishlist.name} className="h-14 w-14 rounded-lg object-cover border" />
          ) : (
            <div className="h-14 w-14 rounded-lg flex items-center justify-center text-2xl font-bold text-white" style={{ backgroundColor: wishlist.color ? `#${wishlist.color}` : "#ec4899" }}>
              {wishlist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{wishlist.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{wishlist.visibility}</Badge>
              <span className="text-sm text-muted-foreground">{visibleWishesCount} {t("wishes").toLowerCase()} · {visibleChildrenCount} {t("subWishlists").toLowerCase()}</span>
            </div>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/wishlists/${wishlist.id}/edit`}><Edit className="mr-1 h-4 w-4" />{tCommon("edit")}</Link>
            </Button>
            <DeleteConfirmDialog
              description={t("delete.confirm", { name: wishlist.name })}
              onConfirm={deleteWishlist.bind(null, wishlist.id)}
            />
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t("subWishlists")} {visibleChildrenCount > 0 && `(${visibleChildrenCount})`}</h2>
          {!readOnly && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/wishlists/new?parentId=${wishlist.id}`}><Plus className="mr-1 h-3.5 w-3.5" />{t("newSub")}</Link>
            </Button>
          )}
        </div>
        {wishlist.children.length > 0 && (
          <WishlistGrid wishlists={wishlist.children as (Wishlist & { _count: { children: number; wishes: number } })[]} basePath={basePath} />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{t("wishes")} {visibleWishesCount > 0 && `(${visibleWishesCount})`}</h2>
          {!readOnly && (
            <Button asChild size="sm">
              <Link href={`/wishlists/${wishlist.id}/wishes/new`}><Plus className="mr-1 h-3.5 w-3.5" />{t("addWish")}</Link>
            </Button>
          )}
        </div>
        {wishlist.wishes.length > 0 ? (
          <div className="grid gap-x-2.5 gap-y-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
            {wishlist.wishes.map((wish) => (
              <Link key={wish.id} href={`/wishes/${wish.id}`}>
                <div className="group cursor-pointer rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative aspect-[10/13] bg-muted flex items-center justify-center overflow-hidden">
                    {wish.imageSmallThumbnail ? (
                      <img src={`/uploads/${wish.imageSmallThumbnail}`} alt={wish.name} loading="lazy" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Heart className="h-8 w-8 text-secondary opacity-60" />
                    )}
                    {wish.url && (
                      <a href={wish.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="absolute right-1 top-1 rounded-full bg-background/75 p-1 text-foreground shadow-sm transition-colors hover:bg-background">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="p-2 space-y-0.5">
                    <p className="truncate text-xs font-medium">{wish.name}</p>
                    {wish.price && <p className="text-xs text-muted-foreground">{wish.price} {wish.currency}</p>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">{t("noWishes")}</p>
        )}
      </section>

      {wishlist.children.length === 0 && wishlist.wishes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">{t("title")} vuota</p>
        </div>
      )}
    </div>
  );
}
