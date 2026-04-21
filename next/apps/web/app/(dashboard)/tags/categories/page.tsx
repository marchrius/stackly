import type { Metadata } from "next";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("categories.title") };
}

export default async function TagCategoriesPage() {
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const categories = await prisma.tagCategory.findMany({
    where: { ownerId: session.user.id },
    orderBy: { label: "asc" },
    include: { _count: { select: { tags: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("categories.title")}</h1>
          <p className="text-muted-foreground">{t("categories.count", { count: categories.length })}</p>
        </div>
        <Button asChild>
          <Link href="/tags/categories/new">{t("categories.new")}</Link>
        </Button>
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base">
                      <Link href={`/tags/categories/${category.id}`} className="hover:text-primary">{category.label}</Link>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{t("categories.tagsCount", { count: category._count.tags })}</p>
                  </div>
                  {category.color && <span className="mt-1 h-3 w-3 shrink-0 rounded-full border" style={{ backgroundColor: category.color }} />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {category.description && <p className="text-muted-foreground">{category.description}</p>}
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/tags/categories/${category.id}/edit`}>{t("categories.edit")}</Link>
                  </Button>
                  <DeleteResourceButton
                    endpoint={`/api/tag-categories/${category.id}`}
                    redirectTo="/tags/categories"
                    description={t("categories.delete.confirm", { name: category.label })}
                    triggerLabel={t("categories.deleteAction")}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("categories.empty")}</p>
      )}
    </div>
  );
}
