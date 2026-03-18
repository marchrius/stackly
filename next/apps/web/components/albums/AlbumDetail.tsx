"use client";

import type { Album, Photo } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { AlbumGrid } from "./AlbumGrid";
import { Edit, Trash2, Plus, ChevronRight } from "lucide-react";
import { deleteAlbum } from "@/lib/actions/media.actions";

interface Ancestor {
  id: string;
  title: string;
}

type AlbumWithRelations = Album & {
  children: (Album & { _count: { children: number; photos: number } })[];
  photos: Photo[];
  _count: { children: number; photos: number };
  ancestors?: Ancestor[];
};

export function AlbumDetail({ album }: { album: AlbumWithRelations }) {
  const ancestors = album.ancestors ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {(ancestors.length > 0 || album.parentId) && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          <Link href="/albums" className="hover:text-foreground transition-colors">
            Album
          </Link>
          {ancestors.map((a) => (
            <span key={a.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5" />
              <Link href={`/albums/${a.id}`} className="hover:text-foreground transition-colors">
                {a.title}
              </Link>
            </span>
          ))}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium">{album.title}</span>
        </nav>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {album.image ? (
            <img
              src={`/uploads/${album.image}`}
              alt={album.title}
              className="h-14 w-14 rounded-lg object-cover border"
            />
          ) : (
            <div
              className="h-14 w-14 rounded-lg flex items-center justify-center text-2xl font-bold text-white"
              style={{ backgroundColor: album.color ? `#${album.color}` : "#8b5cf6" }}
            >
              {album.title.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{album.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{album.visibility}</Badge>
              <span className="text-sm text-muted-foreground">
                {album._count.photos} foto · {album._count.children} sub-album
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/albums/${album.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />
              Modifica
            </Link>
          </Button>
          <form action={deleteAlbum.bind(null, album.id)}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Sub-album */}
      {(album.children.length > 0 || true) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">
              Sub-album {album.children.length > 0 && `(${album.children.length})`}
            </h2>
            <Button asChild size="sm" variant="outline">
              <Link href={`/albums/new?parentId=${album.id}`}>
                <Plus className="mr-1 h-3.5 w-3.5" />
                Nuovo sub-album
              </Link>
            </Button>
          </div>
          {album.children.length > 0 && <AlbumGrid albums={album.children} />}
        </section>
      )}

      {/* Foto */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            Foto {album._count.photos > 0 && `(${album._count.photos})`}
          </h2>
          <Button asChild size="sm">
            <Link href={`/albums/${album.id}/photos/new`}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Aggiungi foto
            </Link>
          </Button>
        </div>

        {album.photos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nessuna foto in questo album.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {album.photos.map((photo) => (
              <Link
                key={photo.id}
                href={`/photos/${photo.id}`}
                className="group relative overflow-hidden rounded-lg border aspect-square bg-muted block"
              >
                {photo.imageSmallThumbnail ? (
                  <img
                    src={`/uploads/${photo.imageSmallThumbnail}`}
                    alt={photo.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground text-xs p-2 text-center">
                    {photo.title}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{photo.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}



