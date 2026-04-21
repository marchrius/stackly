import type { Metadata } from "next";
import Link from "next/link";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { getTranslations } from "next-intl/server";

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("count", { count: choiceLists.length })}</p>
        </div>
        <Button asChild>
          <Link href="/choice-lists/new">{t("new")}</Link>
        </Button>
      </div>

      {choiceLists.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {choiceLists.map((choiceList) => {
            const choices = Array.isArray(choiceList.choices) ? choiceList.choices.length : 0;
            return (
              <Link key={choiceList.id} href={`/choice-lists/${choiceList.id}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{choiceList.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    <p>{t("choicesCount", { count: choices })}</p>
                    <p>{t("fieldsCount", { count: choiceList._count.fields })}</p>
                    <p>{t("dataCount", { count: choiceList._count.data })}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
