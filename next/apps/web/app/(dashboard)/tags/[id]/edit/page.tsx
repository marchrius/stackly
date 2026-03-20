import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { TagForm } from "@/components/tags/TagForm";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("edit") };
}

export default async function EditTagPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const [tag, categories] = await Promise.all([
    prisma.tag.findFirst({
      where: { id, ownerId: session.user.id },
      select: { id: true, label: true, description: true, visibility: true, categoryId: true },
    }),
    prisma.tagCategory.findMany({
      where: { ownerId: session.user.id },
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
  ]);

  if (!tag) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <TagForm tag={tag} categories={categories} />
    </div>
  );
}
