import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { Plus } from "lucide-react";
import { prisma } from "@stackly/db";
import { ROLES } from "@stackly/lib";
import { requireAdmin } from "@/lib/auth-utils";
import { updateUserAdminRole, updateUserEnabled } from "@/lib/actions/admin.actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin");
  return { title: t("usersTitle") };
}

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      enabled: true,
      primaryAuthMethod: true,
      roles: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("usersTitle")}</h1>
          <p className="text-muted-foreground">{t("usersCount", { count: users.length })}</p>
        </div>
        <Button asChild>
          <Link href="/settings/admin/users/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("usersNew")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("users")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => {
            const isSelf = user.id === session.user.id;
            const roles = Array.isArray(user.roles) ? user.roles.filter((role): role is string => typeof role === "string") : [];
            const isAdmin = roles.includes(ROLES.ADMIN);

            return (
              <div key={user.id} className="grid gap-4 rounded-lg border p-4 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{user.username}</p>
                    <Badge variant={user.enabled ? "secondary" : "outline"}>{user.enabled ? t("enabled") : t("disabled")}</Badge>
                    {isAdmin ? <Badge variant="outline">{t("adminRole")}</Badge> : null}
                    {isSelf ? <Badge variant="outline">{t("currentUser")}</Badge> : null}
                  </div>
                  <p className="truncate text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("userMeta", {
                      authMethod: user.primaryAuthMethod,
                      date: new Date(user.createdAt).toLocaleDateString(),
                    })}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <form action={updateUserAdminRole.bind(null, user.id)} className="flex items-center gap-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" name="isAdmin" defaultChecked={isAdmin} disabled={isSelf} />
                      <span>{t("adminRole")}</span>
                    </label>
                    <Button type="submit" variant="outline" size="sm" disabled={isSelf}>
                      {tCommon("save")}
                    </Button>
                  </form>

                  <form action={updateUserEnabled.bind(null, user.id)} className="flex items-center gap-2">
                    <input type="hidden" name="enabled" value={user.enabled ? "" : "on"} />
                    <Button type="submit" variant="outline" size="sm" disabled={isSelf}>
                      {user.enabled ? t("disableUser") : t("enableUser")}
                    </Button>
                  </form>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
