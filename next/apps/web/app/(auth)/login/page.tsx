import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { getTranslations } from "next-intl/server";
import { isOidcEnabled } from "@/lib/oidc-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth.login");
  return { title: t("title") };
}

export default async function LoginPage() {
  const t = await getTranslations("auth.login");
  const oidcEnabled = isOidcEnabled();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Stackly</h1>
        <p className="text-muted-foreground mt-2">{t("subtitle")}</p>
      </div>
      <LoginForm oidcEnabled={oidcEnabled} />
    </div>
  );
}
