"use client";

import type { User } from "@koillection/db";
import { useEffect, useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { updateSettings, changePassword } from "@/lib/actions/user.actions";
import { useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { normalizeTheme, type ThemeId } from "@/lib/theme/themes";

export function SettingsForm({ user }: { user: User }) {
  const t = useTranslations("settings");
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(normalizeTheme(user.theme));

  useEffect(() => {
    setSelectedTheme(normalizeTheme(user.theme));
  }, [user.theme]);

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    await updateSettings(new FormData(e.currentTarget));
    window.location.reload();
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    const result = await changePassword(new FormData(e.currentTarget));
    if (result?.error) setPwError(String(Object.values(result.error)[0]?.[0]));
    else setPwSuccess(true);
    setPwLoading(false);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("preferences")}</h2>
        <form onSubmit={handleSettings} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="locale">{t("language")}</Label>
              <Select name="locale" defaultValue={user.locale}>
                <SelectTrigger id="locale"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LOCALES.map((locale) => (
                    <SelectItem key={locale} value={locale}>
                      {t(`languages.${locale}` as any)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("currency")}</Label>
              <Input id="currency" name="currency" defaultValue={user.currency} maxLength={3} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFormat">{t("dateFormat")}</Label>
              <Input id="dateFormat" name="dateFormat" defaultValue={user.dateFormat} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">{t("visibility")}</Label>
              <Select name="visibility" defaultValue={user.visibility}>
                <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">{t("visibilityOptions.public")}</SelectItem>
                  <SelectItem value="internal">{t("visibilityOptions.internal")}</SelectItem>
                  <SelectItem value="private">{t("visibilityOptions.private")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("theme")}</Label>
            <ThemePicker defaultValue={selectedTheme} onChange={setSelectedTheme} />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("savePreferences")}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("changePassword")}</h2>
        <form onSubmit={handlePassword} className="max-w-sm space-y-4">
          {pwError && <p className="text-sm text-destructive">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-[hsl(var(--success))]">{t("passwordUpdated")}</p>}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("currentPassword")}</Label>
            <Input id="currentPassword" name="currentPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t("newPassword")}</Label>
            <Input id="newPassword" name="newPassword" type="password" required minLength={8} />
          </div>
          <Button type="submit" disabled={pwLoading}>
            {pwLoading ? t("saving") : t("changePasswordButton")}
          </Button>
        </form>
      </section>
    </div>
  );
}
