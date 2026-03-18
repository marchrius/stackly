import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button } from "@koillection/ui";
import { WishlistGrid } from "@/components/wishlists/WishlistGrid";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistsPage() {
  const session = await requireAuth();

  const wishlists = await prisma.wishlist.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, wishes: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">{wishlists.length} wishlist</p>
        </div>
        <Button asChild>
          <Link href="/wishlists/new"><Plus className="mr-2 h-4 w-4" />Nuova wishlist</Link>
        </Button>
      </div>
      <WishlistGrid wishlists={wishlists} />
    </div>
  );
}

