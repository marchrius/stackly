import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@stackly/ui";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { ROLES } from "@stackly/lib";
import { DeleteResourceButton } from "@/components/shared/DeleteResourceButton";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

function normalizeHeaders(headers: unknown) {
  if (!Array.isArray(headers)) return [];

  return headers.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const header = "header" in entry && typeof entry.header === "string" ? entry.header : "";
    const value = "value" in entry && typeof entry.value === "string" ? entry.value : "";
    return header || value ? [{ header, value }] : [];
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scrapers");
  return { title: t("details") };
}

export default async function ScraperDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("scrapers");
  const canManageAll = session.user.roles.includes(ROLES.ADMIN);

  const scraper = await prisma.scraper.findFirst({
    where: canManageAll ? { id } : { id, ownerId: session.user.id },
    include: { dataPaths: { orderBy: { position: "asc" } } },
  });

  if (!scraper) notFound();

  const headers = normalizeHeaders(scraper.headers);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{scraper.name}</h1>
          <p className="text-muted-foreground">{t("type", { type: scraper.type ? t(`types.${scraper.type}` as never) : t("unknownType") })}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/scrapers/${scraper.id}/edit`}>{t("edit")}</Link>
          </Button>
          <DeleteResourceButton
            endpoint={`/api/scrapers/${scraper.id}`}
            redirectTo="/scrapers"
            triggerLabel={t("deleteAction")}
            description={t("delete.confirm", { name: scraper.name })}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("details")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium">{t("form.urlPattern")}</p>
              <p className="text-muted-foreground">{scraper.urlPattern || t("notConfigured")}</p>
            </div>
            <div>
              <p className="font-medium">{t("form.namePath")}</p>
              <p className="text-muted-foreground">{scraper.namePath || t("notConfigured")}</p>
            </div>
            <div>
              <p className="font-medium">{t("form.imagePath")}</p>
              <p className="text-muted-foreground">{scraper.imagePath || t("notConfigured")}</p>
            </div>
            {scraper.type === "wish" && (
              <div>
                <p className="font-medium">{t("form.pricePath")}</p>
                <p className="text-muted-foreground">{scraper.pricePath || t("notConfigured")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("form.headers")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {headers.length > 0 ? (
              headers.map((header, index) => (
                <div key={`${header.header}-${index}`} className="rounded-lg border p-3">
                  <p className="font-medium">{header.header}</p>
                  <p className="text-muted-foreground break-all">{header.value}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{t("noHeaders")}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {scraper.type !== "wish" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("form.dataPaths")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {scraper.dataPaths.length > 0 ? (
              scraper.dataPaths.map((path) => (
                <div key={path.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3">
                  <span className="font-medium">{path.name}</span>
                  <Badge variant="outline">{t(`pathTypes.${path.type}` as never)}</Badge>
                  <span className="break-all text-muted-foreground">{path.path}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">{t("noPaths")}</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
