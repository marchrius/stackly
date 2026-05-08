import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { notFound } from "next/navigation";
import { PhotoDetail } from "@/components/photos/PhotoDetail";
import { getAlbumAncestors } from "@/lib/albums-tree";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("photos");
  return { title: t("detailTitle") };
}

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
