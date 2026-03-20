import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("new") };
}

interface Props {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewCollectionPage({ searchParams }: Props) {
  const session = await requireAuth();
  const params = await searchParams;
  const selectedParentId = params.parentId ?? undefined;
  const t = await getTranslations("collections");

  const [templates, parentOptions] = await Promise.all([
    prisma.template.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
    }),
    prisma.collection.findMany({
      where: { ownerId: session.user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      <CollectionForm templates={templates} parentOptions={parentOptions} parentId={selectedParentId} />
    </div>
  );
}
