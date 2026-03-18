import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { AlbumForm } from "@/components/albums/AlbumForm";

export const metadata: Metadata = { title: "Modifica Album" };

interface Props { params: Promise<{ id: string }> }

export default async function EditAlbumPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();

  const [album, allAlbums] = await Promise.all([
    prisma.album.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.album.findMany({
      where: { ownerId: session.user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!album) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Album</h1>
      <AlbumForm album={album} parentOptions={allAlbums} />
    </div>
  );
}

