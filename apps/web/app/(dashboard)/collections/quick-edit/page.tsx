import Link from "next/link";
import { Button } from "@stackly/ui";
import { prisma } from "@stackly/db";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { QuickEditTable } from "@/components/quick-edit/QuickEditTable";
import { saveQuickEditCollections } from "@/lib/actions/quick-edit.actions";

export default async function QuickEditCollectionsPage({ searchParams }: { searchParams: Promise<{ parentId?: string }> }) {
  const { parentId: rawParentId } = await searchParams;
  const parentId = rawParentId || null;
  const session = await requireAuth();
  const [t, tCommon] = await Promise.all([getTranslations("quickEdit"), getTranslations("common")]);
  const parent = parentId ? await prisma.collection.findFirst({ where: { id: parentId, ownerId: session.user.id }, select: { id: true, title: true } }) : null;
  if (parentId && !parent) notFound();
  const rows = await prisma.collection.findMany({ where: { ownerId: session.user.id, parentId }, orderBy: { title: "asc" }, include: { data: { orderBy: { position: "asc" } } } });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{t("collectionsTitle")}</h1><p className="text-sm text-muted-foreground">{t("description", { count: rows.length })}</p></div><Button asChild variant="outline"><Link href={parent ? `/collections/${parent.id}` : "/collections"}>{tCommon("back")}</Link></Button></div>
    <QuickEditTable kind="collections" rows={rows.map((row) => ({ ...row, name: row.title }))} save={saveQuickEditCollections.bind(null, parentId)} />
  </div>;
}
