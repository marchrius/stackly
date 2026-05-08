import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templates");
  return { title: t("title") };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("templates");

  const template = await prisma.template.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      fields: {
        orderBy: { position: "asc" },
        include: { choiceList: { select: { id: true, name: true } } },
      },
      _count: { select: { collections: true } },
    },
  });

  if (!template) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{template.name}</h1>
          <p className="text-muted-foreground">
            {t("fieldsCount", { count: template.fields.length })}
            {template._count.collections > 0 ? ` · ${t("collectionsCount", { count: template._count.collections })}` : ""}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/templates/${template.id}/edit`}>{t("edit")}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("form.fields")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {template.fields.length > 0 ? (
            template.fields.map((field) => (
              <div key={field.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm">
                <span className="font-medium">{field.name}</span>
                <Badge variant="outline">{t(`fieldTypes.${field.type}` as never)}</Badge>
                <Badge variant="secondary">{field.visibility}</Badge>
                {field.choiceList && <Badge>{field.choiceList.name}</Badge>}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("noFields")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
