import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { Button } from "@koillection/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("collections");
  return { title: t("title") };
}

export default async function CollectionsPage() {
  const session = await requireAuth();
  const t = await getTranslations("collections");

  const collections = await prisma.collection.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { title: "asc" },
    include: { _count: { select: { children: true, items: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {collections.length} {t("title").toLowerCase()}
          </p>
        </div>
        <Button asChild>
          <Link href="/collections/new">
            <Plus className="mr-2 h-4 w-4" />
            {t("new")}
          </Link>
        </Button>
      </div>
      <CollectionGrid collections={collections} />
    </div>
  );
}
