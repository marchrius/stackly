import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { AlbumDetail } from "@/components/albums/AlbumDetail";

export const metadata: Metadata = { title: "Dettaglio Album" };

interface Props { params: Promise<{ id: string }> }

export default async function AlbumDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const album = await prisma.album.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: { include: { _count: { select: { children: true, photos: true } } }, orderBy: { title: "asc" } },
      photos: { orderBy: { createdAt: "desc" }, take: 60 },
      _count: { select: { children: true, photos: true } },
    },
  });

  if (!album) notFound();
  return <AlbumDetail album={album} />;
}

