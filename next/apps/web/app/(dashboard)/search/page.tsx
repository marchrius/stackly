import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Input } from "@koillection/ui";
import { SearchResults } from "@/components/shared/SearchResults";

export const metadata: Metadata = { title: "Ricerca" };

interface Props { searchParams: Promise<{ q?: string }> }

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const session = await requireAuth();

  const query = q?.trim() ?? "";

  const [items, collections, tags] = query.length >= 2
    ? await Promise.all([
        prisma.item.findMany({
          where: { ownerId: session.user.id, name: { contains: query, mode: "insensitive" } },
          take: 20,
          include: { collection: { select: { id: true, title: true } } },
        }),
        prisma.collection.findMany({
          where: { ownerId: session.user.id, title: { contains: query, mode: "insensitive" } },
          take: 10,
        }),
        prisma.tag.findMany({
          where: { ownerId: session.user.id, label: { contains: query, mode: "insensitive" } },
          take: 10,
        }),
      ])
    : [[], [], []];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Ricerca</h1>
      <form method="GET">
        <Input name="q" defaultValue={query} placeholder="Cerca oggetti, collezioni, tag…" className="max-w-lg" autoFocus />
      </form>
      {query.length >= 2 && (
        <SearchResults items={items} collections={collections} tags={tags} query={query} />
      )}
    </div>
  );
}

