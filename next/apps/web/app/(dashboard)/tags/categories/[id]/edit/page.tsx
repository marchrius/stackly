import type { Metadata } from "next";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("categories.edit") };
}

export default async function EditTagCategoryPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const category = await prisma.tagCategory.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, label: true, description: true, color: true },
  });

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("categories.edit")}</h1>
      <TagCategoryForm category={category} />
    </div>
  );
}
