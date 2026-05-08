import type { Template, Field } from "@stackly/db";
import Link from "next/link";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { FileText, Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";

type TemplateWithRelations = Template & {
  fields: Field[];
  _count: { collections: number };
};

export function TemplateList({
  templates,
}: {
  templates: TemplateWithRelations[];
}) {
  const t = useTranslations("templates");

  if (templates.length === 0) {
    return <EmptyState icon={FileText} title={t("empty")} />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((tmpl) => (
        <Link key={tmpl.id} href={`/templates/${tmpl.id}/edit`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {tmpl.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{t("fieldsCount", { count: tmpl.fields.length })}</span>
                {tmpl._count.collections > 0 && (
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {t("collectionsCount", { count: tmpl._count.collections })}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {tmpl.fields.slice(0, 5).map((f) => (
                  <Badge key={f.id} variant="secondary" className="text-xs">
                    {f.name}
                  </Badge>
                ))}
                {tmpl.fields.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{tmpl.fields.length - 5}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
