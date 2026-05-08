import type { Metadata } from "next";
import Link from "next/link";
import { LoansList } from "@/components/loans/LoansList";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button } from "@stackly/ui";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loans");
  return { title: t("title") };
}

export default async function LoansPage() {
  const session = await requireAuth();
  const t = await getTranslations("loans");

  const loans = await prisma.loan.findMany({
    where: { ownerId: session.user.id },
    orderBy: { lentAt: "desc" },
    include: { item: { select: { id: true, name: true } } },
  });

  const active = loans.filter((loan) => !loan.returnedAt);
  const returned = loans.filter((loan) => loan.returnedAt);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("count", { count: loans.length })}</p>
        </div>
        <Button asChild>
          <Link href="/loans/new">{t("new")}</Link>
        </Button>
      </div>

      <LoansList active={active} returned={returned} />
    </div>
  );
}
