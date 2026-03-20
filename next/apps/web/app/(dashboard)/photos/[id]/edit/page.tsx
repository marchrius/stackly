import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { notFound } from "next/navigation";
import { PhotoForm } from "@/components/photos/PhotoForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("photos");
  return { title: t("edit") };
}

interface Props { params: Promise<{ id: string }> }

export default async function EditPhotoPage({ params }: Props) {
  const { id } = await params;
  const session = await requireAuth();
  const t = await getTranslations("photos");

  const [photo, allAlbums] = await Promise.all([
    prisma.photo.findFirst({ where: { id, ownerId: session.user.id } }),
    prisma.album.findMany({
      where: { ownerId: session.user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
  ]);

  if (!photo) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("edit")}</h1>
      <PhotoForm photo={photo} albums={allAlbums} />
    </div>
  );
}
