import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { ConnectedProvidersCard } from "@/components/settings/ConnectedProvidersCard";
import { getTranslations } from "next-intl/server";
import { isOidcEnabled } from "@/lib/oidc-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

export default async function SettingsPage() {
  const session = await requireAuth();
  const t = await getTranslations("settings");
  const oidcEnabled = isOidcEnabled();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      oauthProviders: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
      <SettingsForm user={user} />
      <ConnectedProvidersCard providers={user.oauthProviders} oidcEnabled={oidcEnabled} />
    </div>
  );
}
