import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { WishlistDetail } from "@/components/wishlists/WishlistDetail";
import { getWishlistAncestors } from "@/lib/wishlists-tree";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlists");
  return { title: t("detailTitle") };
}

interface Props { params: Promise<{ id: string }> }

export default async function WishlistDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: { include: { _count: { select: { children: true, wishes: true } } }, orderBy: { name: "asc" } },
      wishes: { orderBy: { name: "asc" } },
      _count: { select: { children: true, wishes: true } },
    },
  });

  if (!wishlist) notFound();

  const ancestors = await getWishlistAncestors(session.user.id, wishlist.parentId);

  return <WishlistDetail wishlist={{ ...wishlist, ancestors }} />;
}
