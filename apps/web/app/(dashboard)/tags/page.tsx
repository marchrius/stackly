import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button } from "@stackly/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TagList } from "@/components/tags/TagList";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tags");
  return { title: t("title") };
}

export default async function TagsPage() {
  const session = await requireAuth();
  const t = await getTranslations("tags");

  const [tags, categories] = await Promise.all([
    prisma.tag.findMany({
      where: { ownerId: session.user.id },
      orderBy: { label: "asc" },
      include: { category: true, _count: { select: { items: true } } },
    }),
    prisma.tagCategory.findMany({
      where: { ownerId: session.user.id },
      orderBy: { label: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={<p>{t("count", { count: tags.length })}</p>}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/tags/categories">{t("manageCategories")}</Link>
            </Button>
            <Button asChild>
              <Link href="/tags/new">
                <Plus className="mr-2 h-4 w-4" />
                {t("new")}
              </Link>
            </Button>
          </>
        }
      />
      <TagList tags={tags} categories={categories} />
    </div>
  );
}
