import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { WishlistDetail } from "@/components/wishlists/WishlistDetail";

export const metadata: Metadata = { title: "Dettaglio Wishlist" };

interface Props { params: Promise<{ id: string }> }

export default async function WishlistDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: { include: { _count: { select: { wishes: true } } }, orderBy: { name: "asc" } },
      wishes: { orderBy: { name: "asc" } },
      _count: { select: { children: true, wishes: true } },
    },
  });

  if (!wishlist) notFound();
  return <WishlistDetail wishlist={wishlist} />;
}

