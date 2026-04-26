"use client";

import type { Album } from "@stackly/db";
import { useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stackly/ui";
import { createAlbum, updateAlbum } from "@/lib/actions/media.actions";
import { getUploadUrl, VISIBILITY_OPTIONS } from "@stackly/lib";

interface ParentOption {
  id: string;
  title: string;
}

interface AlbumFormProps {
  album?: Album;
  parentOptions?: ParentOption[];
  parentId?: string;
}

function normalizeColor(value: string | null | undefined): string {
  if (!value) return "#8b5cf6";
  return value.startsWith("#") ? value : `#${value}`;
}

function toUploadUrl(p: string | null | undefined): string | null {
  return getUploadUrl(p);
}

export function AlbumForm({ album, parentOptions = [], parentId }: AlbumFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!album;

  const [visibility, setVisibility] = useState(album?.visibility ?? "public");
  const [selectedParentId, setSelectedParentId] = useState(
    parentId ?? album?.parentId ?? "none",
  );
  const [imagePath, setImagePath] = useState<string | null>(album?.image ?? null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectableParents = useMemo(() => {
    if (!album) return parentOptions;
    return parentOptions.filter((o) => o.id !== album.id);
  }, [album, parentOptions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("visibility", visibility);
    formData.set("parentId", selectedParentId === "none" ? "" : selectedParentId);
    formData.set("image", imagePath ?? "");
    formData.set("deleteImage", deleteImage ? "true" : "false");

    if (isEdit) await updateAlbum(album.id, formData);
    else await createAlbum(formData);

    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setLoading(true);
    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("entity", "album");

      const res = await fetch("/api/upload", { method: "POST", body: payload });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Upload immagine non riuscito");
      }
      const result = (await res.json()) as { path?: string; smallThumbnail?: string };
      const uploaded = result.smallThumbnail ?? result.path;
      if (!uploaded) throw new Error("Risposta upload non valida");
      setImagePath(uploaded);
      setDeleteImage(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload immagine non riuscito");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  }

  function handleRemoveImage() {
    setImagePath(null);
    setDeleteImage(true);
    setUploadError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titolo */}
      <div className="space-y-2">
        <Label htmlFor="title">Titolo *</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={album?.title ?? ""}
          placeholder="Nome dell'album"
        />
      </div>

      {/* Album padre */}
      {selectableParents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="parentId">Album padre</Label>
          <Select value={selectedParentId} onValueChange={setSelectedParentId}>
            <SelectTrigger id="parentId">
              <SelectValue placeholder="Nessuno (album principale)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuno (album principale)</SelectItem>
              {selectableParents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Colore */}
      <div className="space-y-2">
        <Label htmlFor="color">Colore</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={normalizeColor(album?.color)}
            className="h-9 w-16 cursor-pointer rounded border border-input"
          />
          <span className="text-sm text-muted-foreground">Colore identificativo dell&apos;album</span>
        </div>
      </div>

      {/* Immagine */}
      <div className="space-y-2">
        <Label htmlFor="imageFile">Immagine</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {toUploadUrl(imagePath) ? (
            <div className="flex items-center gap-3">
              <img
                src={toUploadUrl(imagePath) ?? ""}
                alt="Anteprima album"
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Sostituisci
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveImage} disabled={loading}>
                  Rimuovi
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Carica immagine
            </Button>
          )}
          <input
            ref={fileInputRef}
            id="imageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageUpload(file);
            }}
          />
          {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        </div>
      </div>

      {/* Visibilità */}
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilità</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hidden fields */}
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="parentId" value={selectedParentId === "none" ? "" : selectedParentId} />
      <input type="hidden" name="image" value={imagePath ?? ""} />
      <input type="hidden" name="deleteImage" value={deleteImage ? "true" : "false"} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea album"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Annulla
        </Button>
      </div>
    </form>
  );
}


