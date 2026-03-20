import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { getCollectionDisplayConfigOptions } from "@/lib/collection-display-config";
import { notFound } from "next/navigation";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("edit") };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditCollectionPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("collections");

  const [collection, templates, choiceLists, scrapers, parentOptions, displayConfigOptions] = await Promise.all([
    prisma.collection.findFirst({
      where: { id, ownerId: session.user.id },
      include: {
        data: { orderBy: { position: "asc" } },
        childrenDisplayConfig: true,
        itemsDisplayConfig: true,
      },
    }),
    prisma.template.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.choiceList.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.scraper.findMany({
      where: { ownerId: session.user.id, type: "collection" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.collection.findMany({
      where: { ownerId: session.user.id, id: { not: id } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    getCollectionDisplayConfigOptions(prisma, session.user.id, id),
  ]);

  if (!collection) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <CollectionForm
        collection={collection}
        templates={templates}
        choiceLists={choiceLists}
        scrapers={scrapers}
        childrenSortingOptions={displayConfigOptions.childrenSortingOptions}
        itemsSortingOptions={displayConfigOptions.itemsSortingOptions}
        childrenColumnOptions={displayConfigOptions.childrenColumnOptions}
        itemsColumnOptions={displayConfigOptions.itemsColumnOptions}
        parentOptions={parentOptions}
        cancelHref={`/collections/${collection.id}`}
      />
    </div>
  );
}
