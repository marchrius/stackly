import type { Metadata } from "next";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loans");
  return { title: t("title") };
}

export default async function LoanDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("loans");

  const loan = await prisma.loan.findFirst({
    where: { id, ownerId: session.user.id },
    include: { item: { select: { id: true, name: true } } },
  });

  if (!loan) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{loan.item?.name ?? t("untitled")}</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant={loan.returnedAt ? "secondary" : "outline"}>{loan.returnedAt ? t("closed") : t("open")}</Badge>
            <span className="text-sm text-muted-foreground">{t("lentToLabel", { name: loan.lentTo })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/loans/${loan.id}/edit`}>{t("edit")}</Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/loans/${loan.id}`}
            redirectTo="/loans"
            description={t("delete.confirm", { name: loan.item?.name ?? loan.lentTo })}
            triggerLabel={t("deleteAction")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {loan.item && (
            <p>
              <span className="font-medium">{t("itemLabel")}: </span>
              <Link href={`/items/${loan.item.id}`} className="hover:text-primary">{loan.item.name}</Link>
            </p>
          )}
          <p><span className="font-medium">{t("lentTo")}: </span>{loan.lentTo}</p>
          <p><span className="font-medium">{t("lentAt")}: </span>{new Date(loan.lentAt).toLocaleDateString()}</p>
          <p><span className="font-medium">{t("returnedAt")}: </span>{loan.returnedAt ? new Date(loan.returnedAt).toLocaleDateString() : t("notReturned")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
