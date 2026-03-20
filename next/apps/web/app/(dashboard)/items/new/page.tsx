import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { ItemForm } from "@/components/items/ItemForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("items");
  return { title: t("new") };
}

interface Props { searchParams: Promise<{ collectionId?: string }> }

export default async function NewItemPage({ searchParams }: Props) {
  const { collectionId } = await searchParams;
  const session = await requireAuth();
  const t = await getTranslations("items");

  const [tags, choiceLists, templates, collections, relatedItems, scrapers, collection] = await Promise.all([
    prisma.tag.findMany({ where: { ownerId: session.user.id }, orderBy: { label: "asc" } }),
    prisma.choiceList.findMany({ where: { ownerId: session.user.id }, orderBy: { name: "asc" } }),
    prisma.template.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      include: {
        fields: {
          orderBy: { position: "asc" },
          include: { choiceList: { select: { id: true, name: true, choices: true } } },
        },
      },
    }),
    prisma.collection.findMany({
      where: { ownerId: session.user.id },
      orderBy: { title: "asc" },
      include: {
        itemsDefaultTemplate: {
          include: {
            fields: {
              orderBy: { position: "asc" },
              include: { choiceList: { select: { id: true, name: true, choices: true } } },
            },
          },
        },
      },
    }),
    prisma.item.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, imageSmallThumbnail: true, collection: { select: { title: true } } },
    }),
    prisma.scraper.findMany({ where: { ownerId: session.user.id, type: "item" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    collectionId
      ? prisma.collection.findFirst({
          where: { id: collectionId, ownerId: session.user.id },
          include: {
            itemsDefaultTemplate: {
              include: {
                fields: {
                  orderBy: { position: "asc" },
                  include: { choiceList: { select: { id: true, name: true, choices: true } } },
                },
              },
            },
            items: {
              orderBy: { createdAt: "asc" },
              include: {
                data: { orderBy: { position: "asc" } },
                tags: { select: { id: true } },
              },
            },
          },
        })
      : null,
  ]);

  const initialSuggestedNames = buildSuggestedNames(collection?.items.map((item) => item.name) ?? []);
  const initialSharedTagIds = buildSharedTagIds(collection?.items.map((item) => item.tags.map((tag) => tag.id)) ?? []);

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      <ItemForm
        tags={tags}
        choiceLists={choiceLists}
        templates={templates}
        collections={collections}
        relatedItems={relatedItems}
        scrapers={scrapers}
        initialTemplate={collection?.itemsDefaultTemplate ?? null}
        defaultCollectionId={collection?.id}
        initialSuggestedNames={initialSuggestedNames}
        initialSharedTagIds={initialSharedTagIds}
      />
    </div>
  );
}

function buildSuggestedNames(names: string[]) {
  const first = names[0];
  if (!first) return [];

  const patternParts = first.split(/\d+/);
  if (patternParts.length === 0 || patternParts.length > 2) return [];

  const pattern = patternParts.join("");
  let highestValue = 0;

  for (const name of names) {
    const value = name.slice(pattern.length);
    if (!/^\d+$/.test(value)) return [];
    highestValue = Math.max(highestValue, Number(value));
  }

  return [patternParts.join(String(highestValue + 1))];
}

function buildSharedTagIds(items: string[][]) {
  const first = items[0];
  if (!first) return [];
  return first.filter((tagId) => items.every((itemTags) => itemTags.includes(tagId)));
}
