import type { Metadata } from "next";
import { InventoryForm } from "@/components/inventories/InventoryForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventories");
  return { title: t("edit") };
}

export default async function EditInventoryPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("inventories");

  const inventory = await prisma.inventory.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true, name: true, content: true },
  });

  if (!inventory) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      </div>
      <InventoryForm inventory={inventory} />
    </div>
  );
}
