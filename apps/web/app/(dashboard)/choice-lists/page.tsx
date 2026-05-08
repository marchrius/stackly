import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { List, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("choiceLists");
  return { title: t("title") };
}

export default async function ChoiceListsPage() {
  const session = await requireAuth();
  const t = await getTranslations("choiceLists");

  const choiceLists = await prisma.choiceList.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { fields: true, data: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={<p>{t("count", { count: choiceLists.length })}</p>}
        actions={
          <Button asChild>
            <Link href="/choice-lists/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />

      {choiceLists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {choiceLists.map((choiceList) => {
            const choices = Array.isArray(choiceList.choices)
              ? choiceList.choices.length
              : 0;
            return (
              <Link key={choiceList.id} href={`/choice-lists/${choiceList.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {choiceList.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{t("choicesCount", { count: choices })}</p>
                    <p>
                      {t("fieldsCount", { count: choiceList._count.fields })}
                    </p>
                    <p>{t("dataCount", { count: choiceList._count.data })}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={List} title={t("empty")} />
      )}
    </div>
  );
}
