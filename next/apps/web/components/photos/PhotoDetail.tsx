"use client";

import type { Photo } from "@koillection/db";
import Link from "next/link";
import { Button, Badge } from "@koillection/ui";
import { Edit, Trash2, ChevronRight, MapPin, Calendar } from "lucide-react";
import { deletePhoto } from "@/lib/actions/photo.actions";

interface Ancestor {
  id: string;
  title: string;
}

interface AlbumRef {
  id: string;
  title: string;
  parentId?: string | null;
  ancestors?: Ancestor[];
}

type PhotoWithAlbum = Photo & {
  album: AlbumRef | null;
};

export function PhotoDetail({ photo }: { photo: PhotoWithAlbum }) {
  const albumAncestors = photo.album?.ancestors ?? [];

  function formatDate(d: Date | string | null | undefined): string {
    if (!d) return "";
    return new Date(d).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" });
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
        <Link href="/albums" className="hover:text-foreground transition-colors">Album</Link>
        {albumAncestors.map((a) => (
          <span key={a.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/albums/${a.id}`} className="hover:text-foreground transition-colors">{a.title}</Link>
          </span>
        ))}
        {photo.album && (
          <span className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={`/albums/${photo.album.id}`} className="hover:text-foreground transition-colors">
              {photo.album.title}
            </Link>
          </span>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{photo.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{photo.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{photo.visibility}</Badge>
            {photo.takenAt && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(photo.takenAt)}
              </span>
            )}
            {photo.place && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {photo.place}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/photos/${photo.id}/edit`}>
              <Edit className="mr-1 h-4 w-4" />Modifica
            </Link>
          </Button>
          <form action={deletePhoto.bind(null, photo.id)}>
            <Button variant="destructive" size="sm" type="submit">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Immagine principale */}
      <div className="overflow-hidden rounded-xl border bg-muted">
        {photo.image ? (
          <img
            src={`/uploads/${photo.image}`}
            alt={photo.title}
            className="w-full max-h-[70vh] object-contain"
          />
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Nessuna immagine
          </div>
        )}
      </div>

      {/* Commento */}
      {photo.comment && (
        <p className="text-muted-foreground leading-relaxed">{photo.comment}</p>
      )}
    </div>
  );
}

