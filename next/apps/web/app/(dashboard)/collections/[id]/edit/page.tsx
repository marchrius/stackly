import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/collections/CollectionForm";

export const metadata: Metadata = { title: "Modifica Collezione" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const [collection, templates] = await Promise.all([
    prisma.collection.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.template.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!collection) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Collezione</h1>
      <CollectionForm collection={collection} templates={templates} />
    </div>
  );
}

