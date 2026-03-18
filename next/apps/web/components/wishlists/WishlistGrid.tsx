import type { Wishlist } from "@koillection/db";
import Link from "next/link";
import { Card, CardContent } from "@koillection/ui";
import { Heart, Layers } from "lucide-react";

type WishlistWithCount = Wishlist & { _count: { children: number; wishes: number } };

export function WishlistGrid({ wishlists }: { wishlists: WishlistWithCount[] }) {
  if (wishlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Heart className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">Nessuna wishlist</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {wishlists.map((wl) => (
        <Link key={wl.id} href={`/wishlists/${wl.id}`}>
          <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full">
            <div className="h-36 flex items-center justify-center" style={{ backgroundColor: wl.color ? `#${wl.color}22` : undefined }}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white" style={{ backgroundColor: wl.color ? `#${wl.color}` : "#ec4899" }}>
                {wl.name.charAt(0).toUpperCase()}
              </div>
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

