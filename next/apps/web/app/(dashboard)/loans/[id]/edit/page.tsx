import type { Metadata } from "next";
import { LoanForm } from "@/components/loans/LoanForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loans");
  return { title: t("edit") };
}

export default async function EditLoanPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("loans");

  const [loan, items] = await Promise.all([
    prisma.loan.findFirst({
      where: { id, ownerId: session.user.id },
      select: { id: true, itemId: true, lentTo: true, lentAt: true, returnedAt: true },
    }),
    prisma.item.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!loan) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      </div>
      <LoanForm loan={loan} items={items} />
    </div>
  );
}
