import type { Metadata } from "next";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@koillection/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("categories.title") };
}

export default async function TagCategoryDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const category = await prisma.tagCategory.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      tags: { orderBy: { label: "asc" }, include: { _count: { select: { items: true } } } },
      _count: { select: { tags: true } },
    },
  });

  if (!category) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {category.color && <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: category.color }} />}
            <h1 className="text-2xl font-bold tracking-tight">{category.label}</h1>
          </div>
          <p className="text-muted-foreground">{t("categories.tagsCount", { count: category._count.tags })}</p>
          {category.description && <p className="mt-2 text-sm text-muted-foreground">{category.description}</p>}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/tags/categories/${category.id}/edit`}>{t("categories.edit")}</Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/tag-categories/${category.id}`}
            redirectTo="/tags/categories"
            description={t("categories.delete.confirm", { name: category.label })}
            triggerLabel={t("categories.deleteAction")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("categories.taggedTags")}</CardTitle>
        </CardHeader>
        <CardContent>
          {category.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {category.tags.map((tag) => (
                <Link key={tag.id} href={`/tags/${tag.id}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                    {tag.label}
                    {tag._count.items > 0 && <span className="ml-1 text-muted-foreground">({tag._count.items})</span>}
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("categories.noTags")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
