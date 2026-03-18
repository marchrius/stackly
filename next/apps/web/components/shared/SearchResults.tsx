import type { Item, Collection, Tag } from "@koillection/db";
import Link from "next/link";
import { Badge } from "@koillection/ui";
import { Box, Layers, Tag as TagIcon } from "lucide-react";

interface SearchResultsProps {
  items: Item[];
  collections: Collection[];
  tags: Tag[];
  query: string;
}

export function SearchResults({ items, collections, tags, query }: SearchResultsProps) {
  const total = items.length + collections.length + tags.length;

  if (total === 0) {
    return <p className="text-muted-foreground">Nessun risultato per &ldquo;{query}&rdquo;.</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{total} risultati per &ldquo;{query}&rdquo;</p>

      {collections.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Layers className="h-4 w-4" /> Collezioni ({collections.length})
          </h2>
          <div className="space-y-1">
            {collections.map((c) => (
              <Link key={c.id} href={`/collections/${c.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Layers className="h-4 w-4 text-primary shrink-0" />
                {c.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {items.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <Box className="h-4 w-4" /> Oggetti ({items.length})
          </h2>
          <div className="space-y-1">
            {items.map((item) => (
              <Link key={item.id} href={`/items/${item.id}`} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent text-sm">
                <Box className="h-4 w-4 text-primary shrink-0" />
                {item.name}
                {item.quantity > 1 && <Badge variant="secondary" className="text-xs">×{item.quantity}</Badge>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {tags.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
            <TagIcon className="h-4 w-4" /> Tag ({tags.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={`/tags/${tag.id}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">{tag.label}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

