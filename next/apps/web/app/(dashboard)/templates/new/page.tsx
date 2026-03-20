import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templates");
  return { title: t("new") };
}

export default async function NewTemplatePage() {
  const session = await requireAuth();
  const t = await getTranslations("templates");

  const choiceLists = await prisma.choiceList.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      <TemplateForm choiceLists={choiceLists} />
    </div>
  );
}
