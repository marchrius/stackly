import type { Tag, TagCategory } from "@koillection/db";
import Link from "next/link";
import { Badge } from "@koillection/ui";

type TagWithRelations = Tag & { category: TagCategory | null; _count: { items: number } };

export function TagList({ tags, categories }: { tags: TagWithRelations[]; categories: TagCategory[] }) {
  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">Nessun tag</p>
      </div>
    );
  }

  // Raggruppa per categoria
  const byCategory = new Map<string, TagWithRelations[]>();
  const uncategorized: TagWithRelations[] = [];

  tags.forEach((tag) => {
    if (tag.categoryId) {
      const key = tag.categoryId;
      if (!byCategory.has(key)) byCategory.set(key, []);
      byCategory.get(key)!.push(tag);
    } else {
      uncategorized.push(tag);
    }
  });

  return (
    <div className="space-y-6">
      {categories.map((cat) => {
        const catTags = byCategory.get(cat.id) ?? [];
        if (catTags.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              {cat.color && <span className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />}
              {cat.label}
            </h2>
            <div className="flex flex-wrap gap-2">
              {catTags.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
            </div>
          </section>
        );
      })}
      {uncategorized.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-2 text-muted-foreground">Senza categoria</h2>
          <div className="flex flex-wrap gap-2">
            {uncategorized.map((tag) => <TagBadge key={tag.id} tag={tag} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function TagBadge({ tag }: { tag: TagWithRelations }) {
  return (
    <Link href={`/tags/${tag.id}`}>
      <Badge variant="outline" className="cursor-pointer hover:bg-accent text-sm">
        {tag.label}
        {tag._count.items > 0 && <span className="ml-1.5 text-muted-foreground">({tag._count.items})</span>}
      </Badge>
    </Link>
  );
}

