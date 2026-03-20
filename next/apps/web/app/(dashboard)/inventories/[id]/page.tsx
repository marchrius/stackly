import type { Metadata } from "next";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@koillection/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

function getEntryCount(content: unknown) {
  if (Array.isArray(content)) return content.length;
  if (content && typeof content === "object") return Object.keys(content).length;
  return 0;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("inventories");
  return { title: t("title") };
}

export default async function InventoryDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("inventories");

  const inventory = await prisma.inventory.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!inventory) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{inventory.name}</h1>
          <p className="text-muted-foreground">{t("entriesCount", { count: getEntryCount(inventory.content) })}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/inventories/${inventory.id}/edit`}>{t("edit")}</Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/inventories/${inventory.id}`}
            redirectTo="/inventories"
            description={t("delete.confirm", { name: inventory.name })}
            triggerLabel={t("deleteAction")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("content")}</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">{JSON.stringify(inventory.content ?? [], null, 2)}</pre>
        </CardContent>
      </Card>
    </div>
  );
}
