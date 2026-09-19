import Link from "next/link";
import { Button } from "@stackly/ui";
import { prisma } from "@stackly/db";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { QuickEditTable } from "@/components/quick-edit/QuickEditTable";
import { saveQuickEditItems } from "@/lib/actions/quick-edit.actions";

export default async function QuickEditItemsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAuth();
  const [t, tCommon] = await Promise.all([getTranslations("quickEdit"), getTranslations("common")]);
  const collection = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true, title: true } });
  if (!collection) notFound();
  const rows = await prisma.item.findMany({ where: { ownerId: session.user.id, collectionId: id }, orderBy: { name: "asc" }, include: { data: { orderBy: { position: "asc" } } } });
  return <div className="space-y-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">{t("itemsTitle", { collection: collection.title })}</h1><p className="text-sm text-muted-foreground">{t("description", { count: rows.length })}</p></div><Button asChild variant="outline"><Link href={`/collections/${id}/items`}>{tCommon("back")}</Link></Button></div>
    <QuickEditTable kind="items" rows={rows} save={saveQuickEditItems.bind(null, id)} />
  </div>;
}
