import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { Button } from "@koillection/ui";
import { AlbumGrid } from "@/components/albums/AlbumGrid";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Album" };

export default async function AlbumsPage() {
  const session = await requireAuth();

  const albums = await prisma.album.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { title: "asc" },
    include: { _count: { select: { children: true, photos: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Album</h1>
          <p className="text-muted-foreground">{albums.length} album</p>
        </div>
        <Button asChild>
          <Link href="/albums/new"><Plus className="mr-2 h-4 w-4" />Nuovo album</Link>
        </Button>
      </div>
      <AlbumGrid albums={albums} />
    </div>
  );
}

