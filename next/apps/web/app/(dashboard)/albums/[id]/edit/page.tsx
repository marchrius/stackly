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
  const album = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!album) notFound();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Modifica Album</h1>
      <AlbumForm album={album} />
    </div>
  );
}

