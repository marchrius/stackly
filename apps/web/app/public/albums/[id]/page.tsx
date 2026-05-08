import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@stackly/ui";
import { ChevronRight } from "lucide-react";
import { PublicCollectionCard, PublicCount, PublicGrid, PublicPhotoCard } from "@/components/public/PublicCards";
import { PublicShell } from "@/components/public/PublicShell";
import { getPublicAlbum, getPublicAlbumAncestors } from "@/lib/public/public-queries";
import { getUploadUrl } from "@stackly/lib";
import { sortByNaturalText } from "@/lib/natural-sort";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const album = await getPublicAlbum(id);
  return { title: album?.title ?? "Album" };
}

export default async function PublicAlbumPage({ params }: Props) {
  const { id } = await params;
  const [tPublic, tAlbums] = await Promise.all([
    getTranslations("public"),
    getTranslations("albums"),
  ]);
  const album = await getPublicAlbum(id);

  if (!album) notFound();

  const ancestors = await getPublicAlbumAncestors(album.parentId);
  const imageUrl = getUploadUrl(album.image);
  const sortedChildren = sortByNaturalText(album.children, (child) => child.title);
  const sortedPhotos = sortByNaturalText(album.photos, (photo) => photo.title);

  return (
    <PublicShell eyebrow={tPublic("eyebrow")} title={album.title}>
      <div className="space-y-8">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <span>{tAlbums("title")}</span>
          {ancestors.map((ancestor) => (
            <span key={ancestor.id} className="inline-flex items-center gap-1">
              <ChevronRight className="h-3 w-3" />
              <Link href={`/public/albums/${ancestor.id}`} className="hover:text-foreground">
                {ancestor.title}
              </Link>
            </span>
          ))}
        </nav>

        <section className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="flex aspect-[10/13] items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {imageUrl ? (
              <img src={imageUrl} alt={album.title} className="max-h-full max-w-full object-contain" />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
                style={{ backgroundColor: album.color ? (album.color.startsWith("#") ? album.color : `#${album.color}`) : "#8b5cf6" }}
              >
                {album.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <Badge variant="outline">{tPublic("publicBadge")}</Badge>
            <PublicCount icon="layers" label={tAlbums("childrenCount", { count: album.children.length })} />
            <PublicCount icon="photos" label={tAlbums("photosCount", { count: album.photos.length })} />
          </div>
        </section>

        {album.children.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tAlbums("subAlbums")}</h2>
            <PublicGrid>
              {sortedChildren.map((child) => (
                <PublicCollectionCard
                  key={child.id}
                  href={`/public/albums/${child.id}`}
                  title={child.title}
                  image={child.image}
                  color={child.color}
                  meta={tAlbums("cardMeta", { children: child._count.children, photos: child._count.photos })}
                />
              ))}
            </PublicGrid>
          </section>
        ) : null}

        {album.photos.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{tAlbums("photos")}</h2>
            <PublicGrid>
              {sortedPhotos.map((photo) => (
                <PublicPhotoCard key={photo.id} title={photo.title} image={photo.imageSmallThumbnail ?? photo.image} />
              ))}
            </PublicGrid>
          </section>
        ) : null}
      </div>
    </PublicShell>
  );
}
