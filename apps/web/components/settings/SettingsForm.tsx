"use client";

import type { User } from "@stackly/db";
import { useEffect, useMemo, useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackly/ui";
import { updateSettings, changePassword } from "@/lib/actions/user.actions";
import { useTranslations } from "next-intl";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { ThemePicker } from "@/components/settings/ThemePicker";
import { normalizeTheme } from "@/lib/theme/themes";
import { getUploadUrl } from "@stackly/lib";
import { getPreviewUrl } from "@/lib/image-preview";

export function SettingsForm({ user }: { user: User }) {
  const t = useTranslations("settings");
  const [saving, setSaving] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(getUploadUrl(user.avatar));
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [avatarFileName, setAvatarFileName] = useState("");

  useEffect(() => {
    if (avatarRemoved) {
      setAvatarPreview(null);
      setAvatarFileName("");
    }
  }, [avatarRemoved]);

  const avatarInitials = useMemo(() => {
    if (!user.username) return "?";
    return user.username
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [user.username]);

  async function handleSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const result = await updateSettings(new FormData(e.currentTarget));
    if (result?.error) {
      setSaving(false);
      return;
    }

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
            <Label htmlFor="avatarFile">{t("profileImage")}</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-semibold text-muted-foreground">
                {avatarPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarPreview} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>
              <div className="space-y-3">
                <Input
                  id="avatarFile"
                  type="file"
                  name="avatarFile"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    setAvatarRemoved(false);
                    setAvatarFileName(file.name);
                    void getPreviewUrl(file).then(setAvatarPreview);
                  }}
                />
                <input type="hidden" name="removeAvatar" value={avatarRemoved ? "1" : ""} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setAvatarRemoved(true)}>
                    {t("removeProfileImage")}
                  </Button>
                  {avatarFileName ? <span className="self-center text-sm text-muted-foreground">{avatarFileName}</span> : null}
                </div>
                <p className="text-sm text-muted-foreground">{t("profileImageHelp")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>{t("theme")}</Label>
            <ThemePicker defaultValue={normalizeTheme(user.theme)} />
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
