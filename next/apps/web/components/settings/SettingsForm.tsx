"use client";

import type { User } from "@koillection/db";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { updateSettings, changePassword } from "@/lib/actions/user.actions";
import { useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { normalizeTheme } from "@/lib/theme/themes";

export function SettingsForm({ user }: { user: User }) {
  const t = useTranslations("settings");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    await updateSettings(new FormData(e.currentTarget));
    setSaving(false);
    // Ricarica la pagina per applicare il nuovo locale
    router.refresh();
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
      {/* Preferenze */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("preferences")}</h2>
        <form onSubmit={handleSettings} className="space-y-6">
          {/* Riga 1: Lingua + Valuta */}
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

          {/* Riga 2: Formato data + Visibilità */}
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

          {/* Tema — picker visivo full-width */}
          <div className="space-y-3">
            <Label>{t("theme")}</Label>
            <ThemePicker defaultValue={normalizeTheme(user.theme)} />
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? t("saving") : t("savePreferences")}
          </Button>
        </form>
      </section>

      {/* Password */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("changePassword")}</h2>
        <form onSubmit={handlePassword} className="space-y-4 max-w-sm">
          {pwError && <p className="text-destructive text-sm">{pwError}</p>}
          {pwSuccess && <p className="text-green-600 text-sm">{t("passwordUpdated")}</p>}
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
