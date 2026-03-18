"use client";

import type { Collection, Datum, Item } from "@koillection/db";
import Link from "next/link";
import { Badge, Button } from "@koillection/ui";
import { CollectionGrid } from "./CollectionGrid";
import { Box, ChevronRight, Edit, Layers, Plus, Trash2 } from "lucide-react";
import { deleteCollection } from "@/lib/actions/collection.actions";

type CollectionWithRelations = Collection & {
  children: (Collection & { _count: { children: number; items: number } })[];
  items: Item[];
  data: Datum[];
  _count: { children: number; items: number };
};

interface CollectionDetailProps {
  collection: CollectionWithRelations;
  ancestors: { id: string; title: string }[];
}

function asHexColor(color: string | null): string {
  if (!color) return "#6366f1";
  return color.startsWith("#") ? color : `#${color}`;
}

export function CollectionDetail({ collection, ancestors }: CollectionDetailProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/collections" className="hover:text-foreground">
          Collezioni
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="inline-flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <Link href={`/collections/${ancestor.id}`} className="hover:text-foreground">
              {ancestor.title}
            </Link>
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-foreground">
          <ChevronRight className="h-3 w-3" />
          {collection.title}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: asHexColor(collection.color) }} />
            <h1 className="text-2xl font-bold tracking-tight">{collection.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {collection._count.children > 0 && (
              <span className="flex items-center gap-1">
                <Layers className="h-4 w-4" />
                {collection._count.children} sotto-collezioni
              </span>
            )}
            {collection._count.items > 0 && (
              <span className="flex items-center gap-1">
                <Box className="h-4 w-4" />
                {collection._count.items} oggetti
              </span>
            )}
            <Badge variant="outline">{collection.visibility}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/collections/new?parentId=${collection.id}`}>
              <Plus className="mr-1 h-4 w-4" />
              Nuova sotto-collezione
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/new?collectionId=${collection.id}`}>
              <Plus className="mr-1 h-4 w-4" />
              Aggiungi oggetto
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/collections/${collection.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <form action={deleteCollection.bind(null, collection.id)}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sotto-collezioni */}
      {collection.children.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Sotto-collezioni</h2>
          <CollectionGrid collections={collection.children} />
        </section>
      )}

      {/* Oggetti */}
      {collection.items.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Oggetti</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {collection.items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`}>
                <div className="group cursor-pointer rounded-lg border bg-card p-3 transition-shadow hover:shadow-md">
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded bg-muted">
                    {item.imageSmallThumbnail ? (
                      <img src={`/uploads/${item.imageSmallThumbnail}`} alt={item.name} className="h-full w-full object-cover" />
                    ) : (
                      <Box className="h-8 w-8 text-muted-foreground opacity-40" />
                    )}
                  </div>
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  {item.quantity > 1 && <p className="text-xs text-muted-foreground">x{item.quantity}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {collection.children.length === 0 && collection.items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Box className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">Collezione vuota</p>
          <p className="text-sm">Aggiungi oggetti o sotto-collezioni.</p>
        </div>
      )}
    </div>
  );
}
