"use client";

import type { Wishlist, Wish } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { WishlistGrid } from "./WishlistGrid";
import { Edit, Trash2, ExternalLink, Heart, ChevronRight, Plus } from "lucide-react";
import { deleteWishlist } from "@/lib/actions/media.actions";

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
  const ancestors = wishlist.ancestors ?? [];
  const visibleChildrenCount = wishlist.children.length;
  const visibleWishesCount = wishlist.wishes.length;

  return (
    <div className="space-y-6">
      {(ancestors.length > 0 || wishlist.parentId) && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          <Link href="/wishlists" className="hover:text-foreground transition-colors">
            Wishlist
          </Link>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`${basePath}/${ancestor.id}`} className="hover:text-foreground transition-colors">
                {ancestor.name}
              </Link>
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
            <div
              className="h-14 w-14 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: wishlist.color ? `#${wishlist.color}` : "#ec4899" }}
            >
              {wishlist.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{wishlist.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{wishlist.visibility}</Badge>
              <span className="text-sm text-muted-foreground">{visibleWishesCount} desideri · {visibleChildrenCount} sub-wishlist</span>
            </div>
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/wishlists/${wishlist.id}/edit`}><Edit className="mr-1 h-4 w-4" />Modifica</Link>
            </Button>
            <form action={deleteWishlist.bind(null, wishlist.id)}>
              <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4" /></Button>
            </form>
          </div>
        )}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Sub-wishlist {visibleChildrenCount > 0 && `(${visibleChildrenCount})`}</h2>
          {!readOnly && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/wishlists/new?parentId=${wishlist.id}`}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Nuova sub-wishlist
              </Link>
            </Button>
          )}
        </div>
        {wishlist.children.length > 0 && (
          <WishlistGrid wishlists={wishlist.children as (Wishlist & { _count: { children: number; wishes: number } })[]} basePath={basePath} />
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Desideri {visibleWishesCount > 0 && `(${visibleWishesCount})`}</h2>
          {!readOnly && (
            <Button asChild size="sm">
              <Link href={`/wishlists/${wishlist.id}/wishes/new`}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Aggiungi desiderio
              </Link>
            </Button>
          )}
        </div>
        {wishlist.wishes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.wishes.map((wish) => (
              <div key={wish.id} className="rounded-lg border p-4 space-y-2 block hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    {wish.imageSmallThumbnail ? (
                      <img src={`/uploads/${wish.imageSmallThumbnail}`} alt={wish.name} className="h-12 w-12 rounded object-cover border" />
                    ) : (
                      <div className="h-12 w-12 rounded bg-pink-100 text-pink-600 flex items-center justify-center">
                        <Heart className="h-5 w-5" />
                      </div>
                    )}
                    <p className="font-medium text-sm truncate">{wish.name}</p>
                  </div>
                  {wish.url && (
                    <a href={wish.url} target="_blank" rel="noopener noreferrer" className="text-primary">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {wish.price && (
                  <p className="text-sm text-muted-foreground">{wish.price} {wish.currency}</p>
                )}
                {wish.comment && <p className="text-xs text-muted-foreground">{wish.comment}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-6 text-center">Nessun desiderio in questa wishlist.</p>
        )}
      </section>

      {wishlist.children.length === 0 && wishlist.wishes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Wishlist vuota</p>
        </div>
      )}
    </div>
  );
}

