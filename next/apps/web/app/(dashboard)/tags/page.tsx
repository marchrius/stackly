import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button } from "@koillection/ui";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TagList } from "@/components/tags/TagList";

export const metadata: Metadata = { title: "Tag" };

export default async function TagsPage() {
  const session = await requireAuth();

  const [tags, categories] = await Promise.all([
    prisma.tag.findMany({
      where: { ownerId: session.user.id },
      orderBy: { label: "asc" },
      include: { category: true, _count: { select: { items: true } } },
    }),
    prisma.tagCategory.findMany({
      where: { ownerId: session.user.id },
      orderBy: { label: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tag</h1>
          <p className="text-muted-foreground">{tags.length} tag</p>
        </div>
        <Button asChild>
          <Link href="/tags/new"><Plus className="mr-2 h-4 w-4" />Nuovo tag</Link>
        </Button>
      </div>
      <TagList tags={tags} categories={categories} />
    </div>
  );
}

