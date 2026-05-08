import type { Metadata } from "next";
import { InventoryForm } from "@/components/inventories/InventoryForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventories");
  return { title: t("new") };
}

export default async function NewInventoryPage() {
  const t = await getTranslations("inventories");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>
      <InventoryForm />
    </div>
  );
}
