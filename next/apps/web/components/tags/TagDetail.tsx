import type { Tag, TagCategory, Item } from "@stackly/db";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { Badge, Button } from "@stackly/ui";
import { Box, Edit } from "lucide-react";
import { useTranslations } from "next-intl";

type TagWithRelations = Tag & { category: TagCategory | null; items: Item[]; _count: { items: number } };

export function TagDetail({ tag }: { tag: TagWithRelations }) {
  const t = useTranslations("tags");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{tag.label}</h1>
          <div className="mt-1 flex items-center gap-2">
            {tag.category && (
              <Link href={`/tags/categories/${tag.category.id}`}>
                <Badge variant="outline" style={{ borderColor: tag.category.color ?? undefined }}>
                  {tag.category.label}
                </Badge>
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{t("itemCount", { count: tag._count.items })}</span>
          </div>
          {tag.description && <p className="mt-2 text-sm text-muted-foreground">{tag.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/tags/${tag.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              {tCommon("edit")}
            </Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/tags/${tag.id}`}
            redirectTo="/tags"
            description={t("delete.confirm", { name: tag.label })}
            triggerLabel={tCommon("delete")}
          />
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("taggedItems")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {tag.items.map((item) => (
            <Link key={item.id} href={`/items/${item.id}`}>
              <div className="cursor-pointer rounded-lg border bg-card p-3 transition-shadow hover:shadow-md">
                <div className="mb-2 flex h-20 items-center justify-center rounded bg-muted">
                  <Box className="h-8 w-8 text-muted-foreground opacity-40" />
                </div>
                <p className="truncate text-xs font-medium">{item.name}</p>
              </div>
            </Link>
          ))}
        </div>
        {tag.items.length === 0 && <p className="text-sm text-muted-foreground">{t("noItems")}</p>}
      </section>
    </div>
  );
}
