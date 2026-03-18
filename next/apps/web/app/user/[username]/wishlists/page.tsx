import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { WishlistGrid } from "@/components/wishlists/WishlistGrid";
import { buildFinalVisibilityWhere, getAllowedFinalVisibilities } from "@/lib/wishlist-visibility";

export const metadata: Metadata = { title: "Wishlist condivise" };

interface Props {
  params: Promise<{ username: string }>;
}

export default async function SharedWishlistsPage({ params }: Props) {
  const { username } = await params;
  const session = await auth();

  const owner = await prisma.user.findFirst({
    where: { username },
    select: { id: true, username: true },
  });

  if (!owner) notFound();

  const allowed = getAllowedFinalVisibilities(session?.user?.id, owner.id);
  const visibilityWhere = buildFinalVisibilityWhere(allowed);

  const wishlists = await prisma.wishlist.findMany({
    where: {
      ownerId: owner.id,
      parentId: null,
      ...visibilityWhere,
    },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, wishes: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wishlist condivise</h1>
        <p className="text-muted-foreground">
          Profilo di <span className="font-medium">{owner.username}</span> · {wishlists.length} wishlist visibili
        </p>
      </div>

      <WishlistGrid wishlists={wishlists} basePath={`/user/${owner.username}/wishlists`} />

      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="text-primary hover:underline">Accedi</Link> per vedere anche i contenuti interni disponibili.
      </p>
    </div>
  );
}

