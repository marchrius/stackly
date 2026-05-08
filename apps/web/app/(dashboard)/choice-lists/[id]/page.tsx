import type { Metadata } from "next";
import Link from "next/link";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getChoiceListDisplayMode, isSingleChoiceList } from "@/lib/choice-lists";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("choiceLists");
  return { title: t("title") };
}

export default async function ChoiceListDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("choiceLists");

  const choiceList = await prisma.choiceList.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      fields: { select: { id: true, name: true, template: { select: { id: true, name: true } } }, orderBy: { name: "asc" } },
      _count: { select: { data: true } },
    },
  });

  if (!choiceList) notFound();

  const choices = Array.isArray(choiceList.choices)
    ? choiceList.choices.filter((choice): choice is string => typeof choice === "string")
    : [];
  const displayMode = getChoiceListDisplayMode(choiceList);
  const selectionMode = isSingleChoiceList(choiceList) ? "single" : "multiple";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{choiceList.name}</h1>
          <p className="text-muted-foreground">
            {t("choicesCount", { count: choices.length })}
            {choiceList.fields.length > 0 ? ` · ${t("fieldsCount", { count: choiceList.fields.length })}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{t(`form.displayModes.${displayMode}`)}</Badge>
            <Badge variant="outline">{t(`form.selectionModes.${selectionMode}`)}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/choice-lists/${choiceList.id}/edit`}>{t("edit")}</Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/choice-lists/${choiceList.id}`}
            redirectTo="/choice-lists"
            description={t("delete.confirm", { name: choiceList.name })}
            triggerLabel={t("deleteAction")}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("choices")}</CardTitle>
        </CardHeader>
        <CardContent>
          {choices.length > 0 ? (
            displayMode === "list" ? (
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {choices.map((choice) => (
                  <li key={choice}>{choice}</li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-wrap gap-2">
                {choices.map((choice) => (
                  <Badge key={choice} variant="secondary">
                    {choice}
                  </Badge>
                ))}
              </div>
            )
          ) : (
            <p className="text-sm text-muted-foreground">{t("emptyChoices")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("linkedFields")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {choiceList.fields.length > 0 ? (
            choiceList.fields.map((field) => (
              <div key={field.id} className="rounded-lg border p-3">
                <p className="font-medium">{field.name}</p>
                {field.template && (
                  <Link href={`/templates/${field.template.id}`} className="text-muted-foreground hover:text-primary">
                    {field.template.name}
                  </Link>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">{t("noLinkedFields")}</p>
          )}
          <p className="text-muted-foreground">{t("dataCount", { count: choiceList._count.data })}</p>
        </CardContent>
      </Card>
    </div>
  );
}
