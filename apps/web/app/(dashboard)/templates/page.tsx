import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button } from "@stackly/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TemplateList } from "@/components/templates/TemplateList";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("templates");
  return { title: t("title") };
}

export default async function TemplatesPage() {
  const session = await requireAuth();
  const t = await getTranslations("templates");

  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      fields: { orderBy: { position: "asc" } },
      _count: { select: { collections: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={<p>{t("count", { count: templates.length })}</p>}
        actions={
          <Button asChild>
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <TemplateList templates={templates} />
    </div>
  );
}
