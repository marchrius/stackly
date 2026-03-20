import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { ItemForm } from "@/components/items/ItemForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("items");
  return { title: t("edit") };
}

interface Props { params: Promise<{ id: string }> }

export default async function EditItemPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("items");

  const [item, tags, choiceLists, templates, collections, relatedItems, scrapers] = await Promise.all([
    prisma.item.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        data: { orderBy: { position: "asc" } },
        tags: true,
        relatedItems: { select: { id: true, name: true } },
        relatedTo: { select: { id: true, name: true } },
      },
    }),
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
  ]);

  if (!item) notFound();

  const initialTemplate = collections.find((collection) => collection.id === item.collectionId)?.itemsDefaultTemplate ?? null;

  return (
    <div className="max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <ItemForm
        item={item}
        tags={tags}
        choiceLists={choiceLists}
        templates={templates}
        collections={collections}
        relatedItems={relatedItems}
        scrapers={scrapers}
        initialTemplate={initialTemplate}
      />
    </div>
  );
}
