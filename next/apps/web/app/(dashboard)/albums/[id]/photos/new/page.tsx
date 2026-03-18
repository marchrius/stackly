import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { PhotoForm } from "@/components/photos/PhotoForm";

export const metadata: Metadata = { title: "Nuova Foto" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewPhotoPage({ params }: Props) {
  const { id: albumId } = await params;
  const session = await requireAuth();

  const album = await prisma.album.findFirst({
    where: { id: albumId, ownerId: session.user.id },
    select: { id: true, title: true },
  });
  if (!album) notFound();

  // Provide all albums so the user can reassign if needed
  const allAlbums = await prisma.album.findMany({
    where: { ownerId: session.user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        Nuova foto — <span className="text-muted-foreground font-normal">{album.title}</span>
      </h1>
      <PhotoForm albums={allAlbums} albumId={albumId} />
    </div>
  );
}

