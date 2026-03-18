"use client";

import type { Wish } from "@koillection/db";
import Link from "next/link";
import { Badge, Button } from "@koillection/ui";
import { ChevronRight, Edit, ExternalLink, Heart, Trash2 } from "lucide-react";
import { deleteWish } from "@/lib/actions/wish.actions";

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
  const ancestors = wish.wishlist?.ancestors ?? [];

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href="/wishlists" className="hover:text-foreground transition-colors">
          Wishlist
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
                Apri link
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/wishes/${wish.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <form action={deleteWish.bind(null, wish.id)}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-muted">
        {wish.image ? (
          <img src={`/uploads/${wish.image}`} alt={wish.name} className="w-full max-h-[70vh] object-contain" />
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Heart className="h-10 w-10 opacity-40" />
              <span>Nessuna immagine</span>
            </div>
          </div>
        )}
      </div>

      {wish.comment && <p className="text-muted-foreground leading-relaxed">{wish.comment}</p>}
    </div>
  );
}

