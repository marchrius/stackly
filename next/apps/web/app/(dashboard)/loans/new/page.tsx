import type { Metadata } from "next";
import Link from "next/link";
import { LoanForm } from "@/components/loans/LoanForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button } from "@koillection/ui";
import { getTranslations } from "next-intl/server";

interface Props {
  searchParams: Promise<{ itemId?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loans");
  return { title: t("new") };
}

export default async function NewLoanPage({ searchParams }: Props) {
  const session = await requireAuth();
  const t = await getTranslations("loans");
  const { itemId } = await searchParams;

  const items = await prisma.item.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>
      {items.length > 0 ? (
        <LoanForm items={items} defaultItemId={itemId} />
      ) : (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">{t("noItemsAvailable")}</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/items">{t("goToItems")}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
