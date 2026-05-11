import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackly/ui";
import { prisma } from "@stackly/db";
import { isOidcEnabled } from "@/lib/oidc-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("ssoTitle") };
}

export default async function AdminSsoPage() {
  const t = await getTranslations("admin");
  const linkedAccounts = await prisma.oAuthProvider.count();
  const enabled = isOidcEnabled();
  const rows = [
    { label: t("ssoEnabled"), value: enabled ? t("enabled") : t("disabled") },
    { label: t("ssoProvider"), value: process.env.OIDC_PROVIDER || "generic" },
    { label: t("ssoIssuer"), value: process.env.OIDC_ISSUER_URL || t("notConfigured") },
    { label: t("ssoClientId"), value: maskValue(process.env.OIDC_CLIENT_ID, t("notConfigured")) },
    { label: t("ssoScopes"), value: process.env.OIDC_SCOPES || "openid profile email" },
    { label: t("ssoLinkedAccounts"), value: String(linkedAccounts) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("ssoTitle")}</h1>
        <p className="text-muted-foreground">{t("ssoDescription")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t("ssoStatus")}
            <Badge variant={enabled ? "secondary" : "outline"}>{enabled ? t("enabled") : t("disabled")}</Badge>
          </CardTitle>
          <CardDescription>{t("ssoReadOnly")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {rows.map((row) => (
            <div key={row.label} className="grid gap-1 py-3 text-sm md:grid-cols-[220px_1fr]">
              <span className="font-medium">{row.label}</span>
              <span className="break-all text-muted-foreground">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function maskValue(value: string | undefined, fallback: string) {
  if (!value) return fallback;
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}
