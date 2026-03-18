import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { ItemForm } from "@/components/items/ItemForm";

export const metadata: Metadata = { title: "Nuovo Oggetto" };

interface Props { searchParams: Promise<{ collectionId?: string }> }

export default async function NewItemPage({ searchParams }: Props) {
  const { collectionId } = await searchParams;
  const session = await requireAuth();

  const [tags, choiceLists, collection] = await Promise.all([
    prisma.tag.findMany({ where: { ownerId: session.user.id }, orderBy: { label: "asc" } }),
    prisma.choiceList.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" } }),
    collectionId
      ? prisma.collection.findFirst({ where: { id: collectionId, ownerId: session.user.id } })
      : null,
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuovo Oggetto</h1>
      <ItemForm tags={tags} choiceLists={choiceLists} defaultCollectionId={collection?.id} />
    </div>
  );
}

