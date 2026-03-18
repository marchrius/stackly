"use client";

import type { Album, Photo } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { AlbumGrid } from "./AlbumGrid";
import { Edit, Trash2 } from "lucide-react";
import { deleteAlbum } from "@/lib/actions/media.actions";

type AlbumWithRelations = Album & {
  children: (Album & { _count: { children: number; photos: number } })[];
  photos: Photo[];
  _count: { children: number; photos: number };
};

export function AlbumDetail({ album }: { album: AlbumWithRelations }) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{album.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline">{album.visibility}</Badge>
            <span className="text-sm text-muted-foreground">{album._count.photos} foto</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/albums/${album.id}/edit`}><Edit className="mr-1 h-4 w-4" />Modifica</Link>
          </Button>
          <form action={deleteAlbum.bind(null, album.id)}>
            <Button variant="destructive" size="sm" type="submit"><Trash2 className="h-4 w-4" /></Button>
          </form>
        </div>
      </div>

      {album.children.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Sub-album</h2>
          <AlbumGrid albums={album.children} />
        </section>
      )}

      {album.photos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Foto</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {album.photos.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-lg border aspect-square bg-muted">
                {photo.imageSmallThumbnail ? (
                  <img src={`/uploads/${photo.imageSmallThumbnail}`} alt={photo.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs">{photo.title}</div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

