"use client";

import type { Photo, Album } from "@stackly/db";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@stackly/ui";
import { createPhoto, updatePhoto } from "@/lib/actions/photo.actions";
import { getUploadUrl, VISIBILITY_OPTIONS } from "@stackly/lib";

interface AlbumOption {
  id: string;
  title: string;
}

interface PhotoFormProps {
  photo?: Photo;
  albums: AlbumOption[];
  /** Pre-selects the album when creating a new photo from an album page */
  albumId?: string;
}

function toUploadUrl(p: string | null | undefined): string | null {
  return getUploadUrl(p);
}

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export function PhotoForm({ photo, albums, albumId }: PhotoFormProps) {
  const t = useTranslations("photos");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const tVisibility = useTranslations("visibility");
  const [loading, setLoading] = useState(false);
  const isEdit = !!photo;

  const [visibility, setVisibility] = useState(photo?.visibility ?? "public");
  const [selectedAlbumId, setSelectedAlbumId] = useState(
    albumId ?? photo?.albumId ?? (albums[0]?.id ?? ""),
  );
  const [imagePath, setImagePath] = useState<string | null>(photo?.image ?? null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("visibility", visibility);
    formData.set("albumId", selectedAlbumId);
    formData.set("image", imagePath ?? "");
    formData.set("deleteImage", deleteImage ? "true" : "false");

    if (isEdit) await updatePhoto(photo.id, formData);
    else await createPhoto(formData);

    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setLoading(true);
    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("entity", "photo");

      const res = await fetch("/api/upload", { method: "POST", body: payload });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? tUpload("imageFailed"));
      }
      const result = (await res.json()) as { path?: string; smallThumbnail?: string; largeThumbnail?: string };
      const uploaded = result.path;
      if (!uploaded) throw new Error(tUpload("invalidResponse"));
      setImagePath(uploaded);
      setDeleteImage(false);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : tUpload("imageFailed"));
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

  const previewUrl = toUploadUrl(photo?.imageSmallThumbnail ?? imagePath);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")} *</Label>
        <Input id="title" name="title" required defaultValue={photo?.title ?? ""} placeholder={t("form.titlePlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile">{t("form.image")}</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {previewUrl ? (
            <div className="flex items-center gap-3">
              <img src={previewUrl} alt={t("form.previewAlt")} className="h-24 w-24 rounded object-cover" />
              <div className="flex gap-2 flex-wrap">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  {t("form.changeImage")}
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveImage} disabled={loading}>
                  {t("form.removeImage")}
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {t("form.uploadImage")}
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
        <Label htmlFor="albumId">{t("form.album")} *</Label>
        <Select value={selectedAlbumId} onValueChange={setSelectedAlbumId} required>
          <SelectTrigger id="albumId">
            <SelectValue placeholder={t("form.albumPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {albums.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">{t("form.comment")}</Label>
        <Textarea id="comment" name="comment" defaultValue={photo?.comment ?? ""} rows={3} placeholder={t("form.commentPlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="place">{t("form.place")}</Label>
        <Input id="place" name="place" defaultValue={photo?.place ?? ""} placeholder={t("form.placePlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="takenAt">{t("form.takenAt")}</Label>
        <Input
          id="takenAt"
          name="takenAt"
          type="date"
          defaultValue={formatDateForInput(photo?.takenAt)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">{t("form.visibility")}</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{tVisibility(o.value)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="albumId" value={selectedAlbumId} />
      <input type="hidden" name="image" value={imagePath ?? ""} />
      <input type="hidden" name="deleteImage" value={deleteImage ? "true" : "false"} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? tCommon("saving") : isEdit ? tCommon("update") : t("form.save")}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
