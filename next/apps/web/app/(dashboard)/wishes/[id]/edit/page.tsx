import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { WishForm } from "@/components/wishes/WishForm";

export const metadata: Metadata = { title: "Modifica Desiderio" };

interface Props { params: Promise<{ id: string }> }

export default async function EditWishPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const [wish, allWishlists] = await Promise.all([
    prisma.wish.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.wishlist.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!wish) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Desiderio</h1>
      <WishForm wish={wish} wishlists={allWishlists} />
    </div>
  );
}

