"use client";

import type { Album } from "@koillection/db";
import Link from "next/link";
import { Card, CardContent } from "@koillection/ui";
import { Image, Layers } from "lucide-react";
import { useTranslations } from "next-intl";

type AlbumWithCount = Album & { _count: { children: number; photos: number } };

export function AlbumGrid({ albums }: { albums: AlbumWithCount[] }) {
  const t = useTranslations("albums");

  if (albums.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Image className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-lg font-medium">{t("empty")}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {albums.map((album) => (
        <Link key={album.id} href={`/albums/${album.id}`}>
          <Card className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div
              className="relative aspect-[10/13] flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: album.color ? `#${album.color}22` : undefined }}
            >
              {album.image ? (
                <img
                  src={`/uploads/${album.image}`}
                  alt={album.title}
                  loading="lazy"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: album.color ? `#${album.color}` : "#8b5cf6" }}
                >
                  {album.title.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <p className="font-medium text-sm truncate">{album.title}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {album._count.children > 0 && <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{album._count.children}</span>}
                {album._count.photos > 0 && <span className="flex items-center gap-1"><Image className="h-3 w-3" />{album._count.photos}</span>}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
