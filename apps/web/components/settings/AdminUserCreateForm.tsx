"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label } from "@stackly/ui";
import { useTranslations } from "next-intl";
import { createAdminUser } from "@/lib/actions/admin.actions";

export function AdminUserCreateForm() {
  const t = useTranslations("admin.usersForm");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const result = await createAdminUser(new FormData(event.currentTarget));
    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    router.push("/settings/admin/users");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="username">{t("username")}</Label>
          <Input id="username" name="username" required maxLength={32} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input id="password" name="password" type="password" required minLength={8} />
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="enabled" defaultChecked />
          <span>{t("enabled")}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isAdmin" />
          <span>{t("admin")}</span>
        </label>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("submit")}
      </Button>
    </form>
  );
}
