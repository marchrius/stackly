import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { WishDetail } from "@/components/wishes/WishDetail";
import { getWishlistAncestors } from "@/lib/wishlists-tree";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishes");
  return { title: t("detailTitle") };
}

interface Props { params: Promise<{ id: string }> }

export default async function WishDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const wish = await prisma.wish.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      wishlist: { select: { id: true, name: true, parentId: true } },
    },
  });

  if (!wish) notFound();

  const ancestors = wish.wishlist
    ? await getWishlistAncestors(session.user.id, wish.wishlist.parentId)
    : [];

  return (
    <WishDetail
      wish={{
        ...wish,
        wishlist: wish.wishlist ? { ...wish.wishlist, ancestors } : null,
      }}
    />
  );
}
