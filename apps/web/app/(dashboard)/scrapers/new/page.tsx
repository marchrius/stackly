import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ScraperForm } from "@/components/scrapers/ScraperForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scrapers");
  return { title: t("new") };
}

export default async function NewScraperPage() {
  const t = await getTranslations("scrapers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
        <p className="text-muted-foreground">{t("newDescription")}</p>
      </div>
      <ScraperForm />
    </div>
  );
}
