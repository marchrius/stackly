"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardContent, CardFooter } from "@koillection/ui";
import { registerUser } from "@/lib/actions/user.actions";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function RegisterForm() {
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const t = useTranslations("auth.register");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);
    if (result?.error) {
      setErrors(result.error as Record<string, string[]>);
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("username")}</Label>
            <Input id="username" name="username" required minLength={3} maxLength={32} />
            {errors.username && <p className="text-destructive text-xs">{errors.username[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("email")}</Label>
            <Input id="email" name="email" type="email" required />
            {errors.email && <p className="text-destructive text-xs">{errors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            {errors.password && <p className="text-destructive text-xs">{errors.password[0]}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t("alreadyHaveAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">{t("login")}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
