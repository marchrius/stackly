import type { Metadata } from "next";
import { ChoiceListForm } from "@/components/choice-lists/ChoiceListForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("choiceLists");
  return { title: t("edit") };
}

export default async function EditChoiceListPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("choiceLists");

  const choiceList = await prisma.choiceList.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, name: true, choices: true },
  });

  if (!choiceList) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      </div>
      <ChoiceListForm choiceList={choiceList} />
    </div>
  );
}
