import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@stackly/ui";
import { AdminUserCreateForm } from "@/components/settings/AdminUserCreateForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("usersNew") };
}

export default async function NewAdminUserPage() {
  const t = await getTranslations("admin");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("usersNew")}</CardTitle>
        <CardDescription>{t("usersNewDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminUserCreateForm />
      </CardContent>
    </Card>
  );
}
