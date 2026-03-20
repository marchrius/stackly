import type { Metadata } from "next";
import { TagCategoryForm } from "@/components/tags/TagCategoryForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("categories.new") };
}

export default async function NewTagCategoryPage() {
  const t = await getTranslations("tags");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("categories.new")}</h1>
      <TagCategoryForm />
    </div>
  );
}
