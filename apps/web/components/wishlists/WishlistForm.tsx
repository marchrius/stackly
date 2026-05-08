"use client";

import type { Wishlist } from "@stackly/db";
import { useMemo, useRef, useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackly/ui";
import { createWishlist, updateWishlist } from "@/lib/actions/media.actions";
import { getUploadUrl, VISIBILITY_OPTIONS } from "@stackly/lib";

interface ParentOption {
  id: string;
  name: string;
}

interface WishlistFormProps {
  wishlist?: Wishlist;
  parentOptions?: ParentOption[];
  parentId?: string;
}

function normalizeColor(value: string | null | undefined): string {
  if (!value) return "#ec4899";
  return value.startsWith("#") ? value : `#${value}`;
}

function toUploadUrl(path: string | null | undefined): string | null {
  return getUploadUrl(path);
}

export function WishlistForm({ wishlist, parentOptions = [], parentId }: WishlistFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!wishlist;

  const [visibility, setVisibility] = useState(wishlist?.visibility ?? "public");
  const [selectedParentId, setSelectedParentId] = useState(parentId ?? wishlist?.parentId ?? "none");
  const [imagePath, setImagePath] = useState<string | null>(wishlist?.image ?? null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectableParents = useMemo(() => {
    if (!wishlist) return parentOptions;
    return parentOptions.filter((option) => option.id !== wishlist.id);
  }, [wishlist, parentOptions]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("visibility", visibility);
    formData.set("parentId", selectedParentId === "none" ? "" : selectedParentId);
    formData.set("image", imagePath ?? "");
    formData.set("deleteImage", deleteImage ? "true" : "false");

    if (isEdit) await updateWishlist(wishlist.id, formData);
    else await createWishlist(formData);

    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setLoading(true);

    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("entity", "wishlist");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Upload immagine non riuscito");
      }

      const result = (await response.json()) as { path?: string; smallThumbnail?: string };
      const uploadedPath = result.smallThumbnail ?? result.path;

      if (!uploadedPath) {
        throw new Error("Risposta upload non valida");
      }

      setImagePath(uploadedPath);
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
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={wishlist?.name ?? ""} placeholder="Nome della wishlist" />
      </div>
      {selectableParents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="parentId">Wishlist padre</Label>
          <Select value={selectedParentId} onValueChange={setSelectedParentId}>
            <SelectTrigger id="parentId"><SelectValue placeholder="Nessuna (wishlist principale)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nessuna (wishlist principale)</SelectItem>
              {selectableParents.map((parent) => <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="imageFile">Immagine</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {toUploadUrl(imagePath) ? (
            <div className="flex items-center gap-3">
              <img src={toUploadUrl(imagePath) ?? ""} alt="Anteprima wishlist" className="h-20 w-20 rounded object-cover" />
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  Sostituisci
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveImage} disabled={loading}>
                  Rimuovi
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
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
      <div className="space-y-2">
        <Label htmlFor="color">Colore</Label>
        <div className="flex items-center gap-2">
          <input type="color" id="color" name="color" defaultValue={normalizeColor(wishlist?.color)} className="h-9 w-16 cursor-pointer rounded border border-input" />
          <span className="text-sm text-muted-foreground">Colore identificativo della wishlist</span>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilità</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
          <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="parentId" value={selectedParentId === "none" ? "" : selectedParentId} />
      <input type="hidden" name="image" value={imagePath ?? ""} />
      <input type="hidden" name="deleteImage" value={deleteImage ? "true" : "false"} />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea wishlist"}</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
      </div>
    </form>
  );
}
