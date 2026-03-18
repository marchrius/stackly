"use client";

import type { Wishlist, Wish } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { WishlistGrid } from "./WishlistGrid";
import { Edit, Trash2, ExternalLink, Heart } from "lucide-react";
import { deleteWishlist } from "@/lib/actions/media.actions";

type WishlistWithRelations = Wishlist & {
  children: (Wishlist & { _count: { wishes: number } })[];
  wishes: Wish[];
  _count: { children: number; wishes: number };
};

export function WishlistDetail({ wishlist }: { wishlist: WishlistWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{wishlist.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{wishlist.visibility}</Badge>
            <span className="text-sm text-muted-foreground">{wishlist._count.wishes} desideri</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/wishlists/${wishlist.id}/edit`}><Edit className="mr-1 h-4 w-4" />Modifica</Link>
          </Button>
          <form action={deleteWishlist.bind(null, wishlist.id)}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>

      {wishlist.children.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Sub-wishlist</h2>
          <WishlistGrid wishlists={wishlist.children as (Wishlist & { _count: { children: number; wishes: number } })[]} />
        </section>
      )}

      {wishlist.wishes.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Desideri</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.wishes.map((wish) => (
              <div key={wish.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm">{wish.name}</p>
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
        </section>
      )}

      {wishlist.children.length === 0 && wishlist.wishes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Heart className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Wishlist vuota</p>
        </div>
      )}
    </div>
  );
}

