import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { CollectionForm } from "@/components/collections/CollectionForm";

export const metadata: Metadata = { title: "Nuova Collezione" };

export default async function NewCollectionPage() {
  const session = await requireAuth();

  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Nuova Collezione</h1>
      <CollectionForm templates={templates} />
    </div>
  );
}

