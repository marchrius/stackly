import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { TagDetail } from "@/components/tags/TagDetail";

export const metadata: Metadata = { title: "Dettaglio Tag" };

interface Props { params: Promise<{ id: string }> }

export default async function TagDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const tag = await prisma.tag.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      category: true,
      items: { take: 50, orderBy: { name: "asc" } },
      _count: { select: { items: true } },
    },
  });

  if (!tag) notFound();
  return <TagDetail tag={tag} />;
}

