"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@koillection/ui";
import { useTranslations } from "next-intl";
import { updateAdminConfiguration } from "@/lib/actions/admin.actions";
import type { AdminConfigurationValues } from "@/lib/configuration";

interface AdminConfigurationFormProps {
  configuration: AdminConfigurationValues;
}

export function AdminConfigurationForm({ configuration }: AdminConfigurationFormProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);

    const result = await updateAdminConfiguration(new FormData(event.currentTarget));

    if (result?.error) {
      const firstError = Object.values(result.error)[0]?.[0];
      setError(firstError ?? t("saveFailed"));
      setSaving(false);
      return;
    }

    setSuccess(true);
    setSaving(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-[hsl(var(--success))]">{t("saveSucceeded")}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="thumbnailsFormat">{t("thumbnailsFormat")}</Label>
        <Select name="thumbnailsFormat" defaultValue={configuration.thumbnailsFormat}>
          <SelectTrigger id="thumbnailsFormat">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="keep-original">{t("thumbnailsFormatOptions.keepOriginal")}</SelectItem>
            <SelectItem value="jpeg">{t("thumbnailsFormatOptions.jpeg")}</SelectItem>
            <SelectItem value="png">{t("thumbnailsFormatOptions.png")}</SelectItem>
            <SelectItem value="webp">{t("thumbnailsFormatOptions.webp")}</SelectItem>
            <SelectItem value="avif">{t("thumbnailsFormatOptions.avif")}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{t("thumbnailsFormatHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customLightThemeCss">{t("customLightThemeCss")}</Label>
        <Textarea
          id="customLightThemeCss"
          name="customLightThemeCss"
          rows={8}
          defaultValue={configuration.customLightThemeCss}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customDarkThemeCss">{t("customDarkThemeCss")}</Label>
        <Textarea
          id="customDarkThemeCss"
          name="customDarkThemeCss"
          rows={8}
          defaultValue={configuration.customDarkThemeCss}
        />
        <p className="text-sm text-muted-foreground">{t("customCssHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="enableMetrics">{t("enableMetrics")}</Label>
        <Select name="enableMetrics" defaultValue={configuration.enableMetrics ? "true" : "false"}>
          <SelectTrigger id="enableMetrics">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="false">{t("enableMetricsDisabled")}</SelectItem>
            <SelectItem value="true">{t("enableMetricsEnabled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? t("savingConfiguration") : t("saveConfiguration")}
      </Button>
    </form>
  );
}
