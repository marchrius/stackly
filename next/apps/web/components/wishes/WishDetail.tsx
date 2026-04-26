"use client";

import type { Wish } from "@stackly/db";
import Link from "next/link";
import { Badge, Button } from "@stackly/ui";
import { ChevronRight, Edit, ExternalLink, Heart } from "lucide-react";
import { deleteWish } from "@/lib/actions/wish.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";
import { useTranslations } from "next-intl";
import { getUploadUrl } from "@stackly/lib";

interface Ancestor {
  id: string;
  name: string;
}

interface WishlistRef {
  id: string;
  name: string;
  ancestors?: Ancestor[];
}

type WishWithWishlist = Wish & {
  wishlist: WishlistRef | null;
};

export function WishDetail({ wish }: { wish: WishWithWishlist }) {
  const t = useTranslations("wishes");
  const tCommon = useTranslations("common");
  const ancestors = wish.wishlist?.ancestors ?? [];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href="/wishlists" className="hover:text-foreground transition-colors">
          {t("title")}
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/wishlists/${ancestor.id}`} className="hover:text-foreground transition-colors">
              {ancestor.name}
            </Link>
          </span>
        ))}
        {wish.wishlist && (
          <span className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/wishlists/${wish.wishlist.id}`} className="hover:text-foreground transition-colors">
              {wish.wishlist.name}
            </Link>
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{wish.name}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{wish.name}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{wish.visibility}</Badge>
            {wish.price && (
              <span className="text-sm text-muted-foreground">
                {wish.price} {wish.currency ?? ""}
              </span>
            )}
            {wish.url && (
              <a
                href={wish.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {t("openLink")} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/wishes/${wish.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              {tCommon("edit")}
            </Link>
          </Button>
          <DeleteConfirmDialog
            description={t("delete.confirm", { name: wish.name })}
            onConfirm={deleteWish.bind(null, wish.id)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-muted">
        {wish.image ? (
          <img src={getUploadUrl(wish.image) ?? ""} alt={wish.name} className="w-full max-h-[70vh] object-contain" />
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Heart className="h-10 w-10 opacity-40" />
              <span>{tCommon("noImage")}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
