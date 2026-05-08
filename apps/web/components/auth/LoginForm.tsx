"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Input, Label, Card, CardContent, CardFooter } from "@stackly/ui";
import Link from "next/link";
import { useTranslations } from "next-intl";

interface LoginFormProps {
  oidcEnabled: boolean;
}

export function LoginForm({ oidcEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const t = useTranslations("auth.login");
  const authError = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError(t("invalidCredentials"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function handleOidcSignIn() {
    setOidcLoading(true);
    await signIn("oidc", { callbackUrl: "/" });
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6 space-y-4">
          {oidcEnabled ? (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={oidcLoading || loading}
              onClick={handleOidcSignIn}
            >
              {oidcLoading ? t("submitting") : t("oidcSubmit")}
            </Button>
          ) : null}

          {oidcEnabled ? (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">{t("orContinueWith")}</span>
              </div>
            </div>
          ) : null}

          {(error || authError) && (
            <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
              {error ||
                (authError === "oidc_link_required"
                ? t("oidcLinkRequired")
                  : authError === "oidc_link_forbidden"
                    ? t("oidcLinkForbidden")
                  : authError === "OAuthSignin" || authError === "OAuthCallback"
                    ? t("oidcFailed")
                    : t("invalidCredentials"))}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="username">{t("username")}</Label>
            <Input id="username" name="username" type="text" required autoFocus autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("password")}</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("submitting") : t("submit")}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-primary hover:underline">{t("register")}</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
