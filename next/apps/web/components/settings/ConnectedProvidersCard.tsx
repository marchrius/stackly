"use client";

import type { OAuthProvider } from "@koillection/db";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@koillection/ui";
import { useTranslations } from "next-intl";
import { unlinkOidcProvider } from "@/lib/actions/user.actions";
import { DeleteConfirmDialog } from "@/components/shared/DeleteConfirmDialog";

function formatProviderName(name: string): string {
  const map: Record<string, string> = {
    oidc: "OIDC",
    keycloak: "Keycloak",
    microsoft: "Microsoft",
    google: "Google",
  };
  return map[name.toLowerCase()] ?? name;
}

export function ConnectedProvidersCard({ providers }: { providers: OAuthProvider[] }) {
  const t = useTranslations("settings");
  const [error, setError] = useState("");

  async function handleUnlink(providerId: string) {
    setError("");
    const result = await unlinkOidcProvider(providerId);
    if (result?.error) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("connectedProviders.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
        {providers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("connectedProviders.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li key={provider.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                <div>
                  <p className="text-sm font-medium">{formatProviderName(provider.providerName)}</p>
                  <p className="text-xs text-muted-foreground">{provider.issuer}</p>
                  {provider.email ? <p className="mt-1 text-xs text-muted-foreground">{provider.email}</p> : null}
                </div>
                <DeleteConfirmDialog
                  size="sm"
                  triggerLabel={t("connectedProviders.unlink")}
                  description={t("connectedProviders.confirmUnlink", {
                    provider: formatProviderName(provider.providerName),
                  })}
                  onConfirm={handleUnlink.bind(null, provider.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
