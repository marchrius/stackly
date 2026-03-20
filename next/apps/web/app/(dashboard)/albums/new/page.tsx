import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { AlbumForm } from "@/components/albums/AlbumForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("albums");
  return { title: t("new") };
}

interface Props {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewAlbumPage({ searchParams }: Props) {
  const { parentId } = await searchParams;
  const session = await requireAuth();
  const t = await getTranslations("albums");

  const allAlbums = await prisma.album.findMany({
    where: { ownerId: session.user.id },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      <AlbumForm parentOptions={allAlbums} parentId={parentId} />
    </div>
  );
}
