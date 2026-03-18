import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { PhotoDetail } from "@/components/photos/PhotoDetail";
import { getAlbumAncestors } from "@/lib/albums-tree";

export const metadata: Metadata = { title: "Dettaglio Foto" };

interface Props { params: Promise<{ id: string }> }

export default async function PhotoDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const photo = await prisma.photo.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      album: { select: { id: true, title: true, parentId: true } },
    },
  });

  if (!photo) notFound();

  const albumAncestors = photo.album
    ? await getAlbumAncestors(session.user.id, photo.album.parentId)
    : [];

  return (
    <PhotoDetail
      photo={{
        ...photo,
        album: photo.album ? { ...photo.album, ancestors: albumAncestors } : null,
      }}
    />
  );
}

