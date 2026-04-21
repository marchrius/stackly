import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { getCollectionAncestors } from "@/lib/collections-tree";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { CollectionDetail } from "@/components/collections/CollectionDetail";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("detailTitle") };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CollectionDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: {
        include: { _count: { select: { children: true, items: true } } },
        orderBy: { title: "asc" },
      },
      items: {
        orderBy: { name: "asc" },
        take: 50,
      },
      data: { orderBy: { position: "asc" } },
      _count: { select: { children: true, items: true } },
    },
  });

  if (!collection) notFound();

  const ancestors = await getCollectionAncestors(session.user.id, collection.parentId);

  return <CollectionDetail collection={collection} ancestors={ancestors} />;
}
