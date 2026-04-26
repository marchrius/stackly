import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@stackly/ui";
import { PublicGrid, PublicItemCard } from "@/components/public/PublicCards";
import { PublicDatumList } from "@/components/public/PublicDatumList";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicItem, PUBLIC_VISIBILITY } from "@/lib/public/public-queries";
import { buildItemMediaEntries, mergeRelatedItems } from "@/lib/item-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getPublicItem(id);
  return { title: item?.name ?? "Item" };
}

export default async function PublicItemPage({ params }: Props) {
  const { id } = await params;
  const [tPublic, tItems, tCommon] = await Promise.all([
    getTranslations("public"),
    getTranslations("items"),
    getTranslations("common"),
  ]);
  const item = await getPublicItem(id);

  if (!item) notFound();

  const mediaEntries = buildItemMediaEntries(item);
  const relatedItems = mergeRelatedItems(item.relatedItems, item.relatedTo);
  const publicCollection = item.collection?.finalVisibility === PUBLIC_VISIBILITY ? item.collection : null;

  return (
    <PublicShell eyebrow={tPublic("eyebrow")} title={item.name}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{tPublic("publicBadge")}</Badge>
          {item.quantity > 1 ? <Badge variant="secondary">x{item.quantity}</Badge> : null}
          {publicCollection ? (
            <Link href={`/public/collections/${publicCollection.id}`} className="text-sm text-primary hover:underline">
              {tItems("fromCollection", { name: publicCollection.title })}
            </Link>
          ) : null}
          {item.tags.map((tag) => (
            <Badge key={tag.id} variant="secondary">
              {tag.label}
            </Badge>
          ))}
        </div>

        {mediaEntries.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tItems("media")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {mediaEntries.map((entry) => (
                <div key={entry.id} className="space-y-2 rounded-lg border bg-card p-3">
                  {entry.label !== "main" ? <p className="text-sm font-medium text-muted-foreground">{entry.label}</p> : null}
                  {entry.kind === "video" ? (
                    <video controls className="max-h-[28rem] w-full rounded-lg bg-black" src={entry.src}>
                      <track kind="captions" />
                    </video>
                  ) : (
                    <img
                      src={entry.src}
                      alt={entry.label === "main" ? item.name : entry.label}
                      className="max-h-[28rem] w-full rounded-lg object-contain"
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <PublicDatumList
          data={item.data}
          labels={{
            none: tCommon("none"),
            yes: tCommon("yes"),
            no: tCommon("no"),
            unknownFile: tItems("unknownFile"),
          }}
        />

        {relatedItems.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tItems("relatedItems", { count: relatedItems.length })}</h2>
            <PublicGrid>
              {relatedItems.map((relatedItem) => (
                <PublicItemCard
                  key={relatedItem.id}
                  href={`/public/items/${relatedItem.id}`}
                  name={relatedItem.name}
                  image={relatedItem.imageSmallThumbnail}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
