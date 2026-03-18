import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { Button } from "@koillection/ui";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Collezioni" };

export default async function CollectionsPage() {
  const session = await requireAuth();

  const collections = await prisma.collection.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { title: "asc" },
    include: { _count: { select: { children: true, items: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Collezioni</h1>
          <p className="text-muted-foreground">{collections.length} collezioni</p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuova collezione
          </Link>
        </Button>
      </div>
      <CollectionGrid collections={collections} />
    </div>
  );
}

