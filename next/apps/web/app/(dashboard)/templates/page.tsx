import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button } from "@koillection/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TemplateList } from "@/components/templates/TemplateList";

export const metadata: Metadata = { title: "Template" };

export default async function TemplatesPage() {
  const session = await requireAuth();

  const templates = await prisma.template.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { fields: { orderBy: { position: "asc" } }, _count: { select: { collections: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Template</h1>
          <p className="text-muted-foreground">{templates.length} template</p>
        </div>
        <Button asChild>
          <Link href="/templates/new"><Plus className="mr-2 h-4 w-4" />Nuovo template</Link>
        </Button>
      </div>
      <TemplateList templates={templates} />
    </div>
  );
}

