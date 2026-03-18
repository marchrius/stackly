import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { WishlistForm } from "@/components/wishlists/WishlistForm";

export const metadata: Metadata = { title: "Nuova Wishlist" };

interface Props {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewWishlistPage({ searchParams }: Props) {
  const { parentId } = await searchParams;
  const session = await requireAuth();

  const allWishlists = await prisma.wishlist.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuova Wishlist</h1>
      <WishlistForm parentOptions={allWishlists} parentId={parentId} />
    </div>
  );
}

