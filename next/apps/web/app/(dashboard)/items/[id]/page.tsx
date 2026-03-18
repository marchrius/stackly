import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { ItemDetail } from "@/components/items/ItemDetail";

export const metadata: Metadata = { title: "Dettaglio Oggetto" };

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
    },
  });

  if (!item) notFound();

  return <ItemDetail item={item} />;
}

