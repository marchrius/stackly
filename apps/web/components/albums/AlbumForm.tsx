"use client";

import type { Album } from "@stackly/db";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("albums");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const tVisibility = useTranslations("visibility");
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
        throw new Error(err?.error ?? tUpload("imageFailed"));
      }
      const result = (await res.json()) as { path?: string; smallThumbnail?: string };
      const uploaded = result.smallThumbnail ?? result.path;
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">{t("form.title")} *</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={album?.title ?? ""}
          placeholder={t("form.titlePlaceholder")}
        />
      </div>

      {selectableParents.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="parentId">{t("form.parent")}</Label>
          <Select value={selectedParentId} onValueChange={setSelectedParentId}>
            <SelectTrigger id="parentId">
              <SelectValue placeholder={t("form.noRootParent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("form.noRootParent")}</SelectItem>
              {selectableParents.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="color">{t("form.color")}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={normalizeColor(album?.color)}
            className="h-9 w-16 cursor-pointer rounded border border-input"
          />
          <span className="text-sm text-muted-foreground">{t("form.colorHelp")}</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile">{t("form.image")}</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {toUploadUrl(imagePath) ? (
            <div className="flex items-center gap-3">
              <img
                src={toUploadUrl(imagePath) ?? ""}
                alt={t("form.previewAlt")}
                className="h-20 w-20 rounded object-cover"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {t("form.changeImage")}
                </Button>
                <Button type="button" variant="outline" onClick={handleRemoveImage} disabled={loading}>
                  {t("form.removeImage")}
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
              {t("form.uploadImage")}
            </Button>
          )}
          <input
            ref={fileInputRef}
            id="imageFile"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/heic,image/heif,.heic,.heif"
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
        <Label htmlFor="visibility">{t("form.visibility")}</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {tVisibility(o.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="parentId" value={selectedParentId === "none" ? "" : selectedParentId} />
      <input type="hidden" name="image" value={imagePath ?? ""} />
      <input type="hidden" name="deleteImage" value={deleteImage ? "true" : "false"} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? tCommon("saving") : isEdit ? tCommon("update") : t("form.create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}

