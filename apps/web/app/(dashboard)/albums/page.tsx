import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { Button } from "@stackly/ui";
import { AlbumGrid } from "@/components/albums/AlbumGrid";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/shared/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("albums");
  return { title: t("title") };
}

export default async function AlbumsPage() {
  const session = await requireAuth();
  const t = await getTranslations("albums");

  const albums = await prisma.album.findMany({
    where: { ownerId: session.user.id, parentId: null },
    orderBy: { title: "asc" },
    include: { _count: { select: { children: true, photos: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={
          <p>
            {albums.length} {t("title").toLowerCase()}
          </p>
        }
        actions={
          <Button asChild>
            <Link href="/albums/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <AlbumGrid albums={albums} />
    </div>
  );
}
