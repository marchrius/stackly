import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { ItemDetail } from "@/components/items/ItemDetail";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("items");
  return { title: t("title") };
}

interface Props { params: Promise<{ id: string }> }

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const item = await prisma.item.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      data: { orderBy: { position: "asc" } },
      tags: true,
      loans: { orderBy: { lentAt: "desc" } },
      collection: { select: { id: true, title: true } },
      relatedItems: {
        select: { id: true, name: true, imageSmallThumbnail: true },
      },
      relatedTo: {
        select: { id: true, name: true, imageSmallThumbnail: true },
      },
    },
  });

  if (!item) notFound();

  let previousItem: { id: string; name: string } | null = null;
  let nextItem: { id: string; name: string } | null = null;

  if (item.collectionId) {
    const siblings = await prisma.item.findMany({
      where: { collectionId: item.collectionId, ownerId: session.user.id },
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }],
    });

    const currentIndex = siblings.findIndex((sibling) => sibling.id === item.id);
    previousItem = currentIndex > 0 ? siblings[currentIndex - 1] : null;
    nextItem = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;
  }

  return <ItemDetail item={item} previousItem={previousItem} nextItem={nextItem} />;
}
