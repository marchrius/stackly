import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/ItemForm";

export const metadata: Metadata = { title: "Modifica Oggetto" };

interface Props { params: Promise<{ id: string }> }

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const [item, tags, choiceLists] = await Promise.all([
    prisma.item.findFirst({
      where: { id, ownerId: session.user.id },
      include: { data: { orderBy: { position: "asc" } }, tags: true },
    }),
    prisma.tag.findMany({ where: { ownerId: session.user.id }, orderBy: { label: "asc" } }),
    prisma.choiceList.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" } }),
  ]);

  if (!item) notFound();

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Oggetto</h1>
      <ItemForm item={item} tags={tags} choiceLists={choiceLists} />
    </div>
  );
}

