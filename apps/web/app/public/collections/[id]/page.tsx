import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@stackly/ui";
import { ChevronRight } from "lucide-react";
import { PublicCollectionCard, PublicCount, PublicGrid, PublicItemCard } from "@/components/public/PublicCards";
import { PublicDatumList } from "@/components/public/PublicDatumList";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicCollection, getPublicCollectionAncestors } from "@/lib/public/public-queries";
import { getUploadUrl } from "@stackly/lib";
import { sortByNaturalText } from "@/lib/natural-sort";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const collection = await getPublicCollection(id);
  return { title: collection?.title ?? "Collection" };
}

export default async function PublicCollectionPage({ params }: Props) {
  const { id } = await params;
  const [tPublic, tCollections, tCommon, tItems] = await Promise.all([
    getTranslations("public"),
    getTranslations("collections"),
    getTranslations("common"),
    getTranslations("items"),
  ]);
  const collection = await getPublicCollection(id);

  if (!collection) notFound();

  const ancestors = await getPublicCollectionAncestors(collection.parentId);
  const imageUrl = getUploadUrl(collection.image);
  const sortedChildren = sortByNaturalText(collection.children, (child) => child.title);
  const sortedItems = sortByNaturalText(collection.items, (item) => item.name);

  return (
    <PublicShell eyebrow={tPublic("eyebrow")} title={collection.title}>
      <div className="space-y-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <span>{tCollections("title")}</span>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Link href={`/public/collections/${ancestor.id}`} className="hover:text-foreground">
                {ancestor.title}
              </Link>
            </span>
          ))}
        </nav>

        <section className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex aspect-[10/13] items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt={collection.title} className="max-h-full max-w-full object-contain" />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
                style={{ backgroundColor: collection.color ? (collection.color.startsWith("#") ? collection.color : `#${collection.color}`) : "#6366f1" }}
              >
                {collection.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">{tPublic("publicBadge")}</Badge>
              <PublicCount icon="layers" label={tCollections("childrenCount", { count: collection.children.length })} />
              <PublicCount icon="items" label={tCollections("itemsCount", { count: collection.items.length })} />
            </div>
            <PublicDatumList
              data={collection.data}
              labels={{
                none: tCommon("none"),
                yes: tCommon("yes"),
                no: tCommon("no"),
                unknownFile: tItems("unknownFile"),
              }}
            />
          </div>
        </section>

        {collection.children.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tCollections("subCollections")}</h2>
            <PublicGrid>
              {sortedChildren.map((child) => (
                <PublicCollectionCard
                  key={child.id}
                  href={`/public/collections/${child.id}`}
                  title={child.title}
                  image={child.image}
                  color={child.color}
                  meta={tCollections("cardMeta", { children: child._count.children, items: child._count.items })}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}

        {collection.items.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tCollections("items")}</h2>
            <PublicGrid>
              {sortedItems.map((item) => (
                <PublicItemCard
                  key={item.id}
                  href={`/public/items/${item.id}`}
                  name={item.name}
                  image={item.imageSmallThumbnail ?? item.image}
                  quantity={item.quantity}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
