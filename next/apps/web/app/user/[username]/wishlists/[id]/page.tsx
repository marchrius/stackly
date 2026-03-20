import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { WishlistDetail } from "@/components/wishlists/WishlistDetail";
import { buildFinalVisibilityWhere, getAllowedFinalVisibilities } from "@/lib/wishlist-visibility";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlists");
  return { title: t("sharedDetailTitle") };
}

interface Props {
  params: Promise<{ username: string; id: string }>;
}

export default async function SharedWishlistDetailPage({ params }: Props) {
  const { username, id } = await params;
  const session = await auth();

  const owner = await prisma.user.findFirst({
    where: { username },
    select: { id: true, username: true },
  });

  if (!owner) notFound();

  const allowed = getAllowedFinalVisibilities(session?.user?.id, owner.id);
  const visibilityWhere = buildFinalVisibilityWhere(allowed);

  const wishlist = await prisma.wishlist.findFirst({
    where: {
      id,
      ownerId: owner.id,
      ...visibilityWhere,
    },
    include: {
      children: {
        where: visibilityWhere,
        include: { _count: { select: { children: true, wishes: true } } },
        orderBy: { name: "asc" },
      },
      wishes: {
        where: visibilityWhere,
        orderBy: { name: "asc" },
      },
      _count: { select: { children: true, wishes: true } },
    },
  });

  if (!wishlist) notFound();

  const ancestors = await getVisibleWishlistAncestors(owner.id, wishlist.parentId, visibilityWhere);

  return (
    <WishlistDetail
      wishlist={{ ...wishlist, ancestors }}
      readOnly
      basePath={`/user/${owner.username}/wishlists`}
    />
  );
}

async function getVisibleWishlistAncestors(
  ownerId: string,
  parentId: string | null,
  visibilityWhere: { finalVisibility?: { in: Array<"public" | "internal"> } },
): Promise<Array<{ id: string; name: string }>> {
  const chain: Array<{ id: string; name: string }> = [];
  let cursor = parentId;

  while (cursor) {
    const node = await prisma.wishlist.findFirst({
      where: { id: cursor, ownerId, ...visibilityWhere },
      select: { id: true, name: true, parentId: true },
    });

    if (!node) break;

    chain.unshift({ id: node.id, name: node.name });
    cursor = node.parentId;
  }

  return chain;
}
