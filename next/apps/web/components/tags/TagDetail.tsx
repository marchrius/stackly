import type { Tag, TagCategory, Item } from "@koillection/db";
import Link from "next/link";
import { Badge } from "@koillection/ui";
import { Box } from "lucide-react";

type TagWithRelations = Tag & { category: TagCategory | null; items: Item[]; _count: { items: number } };

export function TagDetail({ tag }: { tag: TagWithRelations }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{tag.label}</h1>
        <div className="flex items-center gap-2 mt-1">
          {tag.category && <Badge variant="outline" style={{ borderColor: tag.category.color ?? undefined }}>{tag.category.label}</Badge>}
          <span className="text-sm text-muted-foreground">{tag._count.items} oggetti</span>
        </div>
        {tag.description && <p className="mt-2 text-sm text-muted-foreground">{tag.description}</p>}
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Oggetti con questo tag</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tag.items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="rounded-lg border bg-card p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="h-20 rounded bg-muted flex items-center justify-center mb-2">
                  <Box className="h-8 w-8 text-muted-foreground opacity-40" />
                </div>
                <p className="text-xs font-medium truncate">{item.name}</p>
              </div>
            </Link>
          ))}
        </div>
        {tag.items.length === 0 && <p className="text-muted-foreground text-sm">Nessun oggetto con questo tag.</p>}
      </section>
    </div>
  );
}

