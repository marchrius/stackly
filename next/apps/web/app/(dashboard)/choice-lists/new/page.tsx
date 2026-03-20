import type { Metadata } from "next";
import { ChoiceListForm } from "@/components/choice-lists/ChoiceListForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("choiceLists");
  return { title: t("new") };
}

export default async function NewChoiceListPage() {
  const t = await getTranslations("choiceLists");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>
      <ChoiceListForm />
    </div>
  );
}
