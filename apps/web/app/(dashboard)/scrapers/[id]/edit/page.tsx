import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { ROLES } from "@stackly/lib";
import { ScraperForm } from "@/components/scrapers/ScraperForm";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("scrapers");
  return { title: t("edit") };
}

export default async function EditScraperPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("scrapers");
  const canManageAll = session.user.roles.includes(ROLES.ADMIN);

  const scraper = await prisma.scraper.findFirst({
    where: canManageAll ? { id } : { id, ownerId: session.user.id },
    include: { dataPaths: { orderBy: { position: "asc" } } },
  });

  if (!scraper) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
        <p className="text-muted-foreground">{t("editDescription", { name: scraper.name })}</p>
      </div>
      <ScraperForm scraper={scraper} />
    </div>
  );
}
