import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { WishlistForm } from "@/components/wishlists/WishlistForm";

export const metadata: Metadata = { title: "Modifica Wishlist" };

interface Props { params: Promise<{ id: string }> }

export default async function EditWishlistPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const wishlist = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wishlist) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Wishlist</h1>
      <WishlistForm wishlist={wishlist} />
    </div>
  );
}

