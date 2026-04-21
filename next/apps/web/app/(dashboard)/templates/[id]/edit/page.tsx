import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { TemplateForm } from "@/components/templates/TemplateForm";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templates");
  return { title: t("edit") };
}

export default async function EditTemplatePage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("templates");

  const [template, choiceLists] = await Promise.all([
    prisma.template.findFirst({
      where: { id, ownerId: session.user.id },
      include: { fields: { orderBy: { position: "asc" } } },
    }),
    prisma.choiceList.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!template) notFound();

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <TemplateForm template={template} choiceLists={choiceLists} />
    </div>
  );
}
