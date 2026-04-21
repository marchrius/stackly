import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { TagForm } from "@/components/tags/TagForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("new") };
}

export default async function NewTagPage() {
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const categories = await prisma.tagCategory.findMany({
    where: { ownerId: session.user.id },
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      <TagForm categories={categories} />
    </div>
  );
}
