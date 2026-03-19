import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.register");
  return { title: t("title") };
}

export default async function RegisterPage() {
  const t = await getTranslations("auth.register");

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Koillection</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>
      <RegisterForm />
    </div>
  );
}
