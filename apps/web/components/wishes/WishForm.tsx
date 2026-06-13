"use client";

import type { Wish } from "@stackly/db";
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
import { CURRENCIES, getUploadUrl, VISIBILITY_OPTIONS } from "@stackly/lib";
import { createWish, updateWish } from "@/lib/actions/wish.actions";

interface WishlistOption {
  id: string;
  name: string;
}

interface WishFormProps {
  wish?: Wish;
  wishlists: WishlistOption[];
  wishlistId?: string;
}

function toUploadUrl(path: string | null | undefined): string | null {
  return getUploadUrl(path);
}

export function WishForm({ wish, wishlists, wishlistId }: WishFormProps) {
  const t = useTranslations("wishes");
  const tCommon = useTranslations("common");
  const tUpload = useTranslations("upload");
  const tVisibility = useTranslations("visibility");
  const [loading, setLoading] = useState(false);
  const isEdit = !!wish;

  const [visibility, setVisibility] = useState(wish?.visibility ?? "public");
  const [selectedWishlistId, setSelectedWishlistId] = useState(
    wishlistId ?? wish?.wishlistId ?? (wishlists[0]?.id ?? ""),
  );
  const [selectedCurrency, setSelectedCurrency] = useState(wish?.currency ?? "none");
  const [imagePath, setImagePath] = useState<string | null>(wish?.image ?? null);
  const [deleteImage, setDeleteImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("visibility", visibility);
    formData.set("wishlistId", selectedWishlistId);
    formData.set("currency", selectedCurrency === "none" ? "" : selectedCurrency);
    formData.set("image", imagePath ?? "");
    formData.set("deleteImage", deleteImage ? "true" : "false");

    if (isEdit) await updateWish(wish.id, formData);
    else await createWish(formData);

    setLoading(false);
  }

  async function handleImageUpload(file: File) {
    setUploadError(null);
    setLoading(true);

    try {
      const payload = new FormData();
      payload.set("file", file);
      payload.set("entity", "wish");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? tUpload("imageFailed"));
      }

      const result = (await response.json()) as { path?: string };
      if (!result.path) throw new Error(tUpload("invalidResponse"));

      setImagePath(result.path);
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
        <Label htmlFor="name">{t("form.name")} *</Label>
        <Input id="name" name="name" required defaultValue={wish?.name ?? ""} placeholder={t("form.namePlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile">{t("form.image")}</Label>
        <div className="flex flex-col gap-3 rounded-md border p-3">
          {toUploadUrl(wish?.imageSmallThumbnail ?? imagePath) ? (
            <div className="flex items-center gap-3">
              <img
                src={toUploadUrl(wish?.imageSmallThumbnail ?? imagePath) ?? ""}
                alt={t("form.previewAlt")}
                className="h-20 w-20 rounded object-cover"
              />
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
        <Label htmlFor="wishlistId">{t("form.wishlist")} *</Label>
        <Select value={selectedWishlistId} onValueChange={setSelectedWishlistId}>
          <SelectTrigger id="wishlistId">
            <SelectValue placeholder={t("form.wishlistPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {wishlists.map((wishlist) => (
              <SelectItem key={wishlist.id} value={wishlist.id}>
                {wishlist.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">{t("form.url")}</Label>
        <Input id="url" name="url" type="url" defaultValue={wish?.url ?? ""} placeholder="https://…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">{t("form.price")}</Label>
          <Input id="price" name="price" defaultValue={wish?.price ?? ""} placeholder={t("form.pricePlaceholder")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">{t("form.currency")}</Label>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger id="currency">
              <SelectValue placeholder={tCommon("none")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{tCommon("none")}</SelectItem>
              {CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">{t("form.comment")}</Label>
        <Textarea id="comment" name="comment" rows={4} defaultValue={wish?.comment ?? ""} placeholder={t("form.commentPlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">{t("form.visibility")}</Label>
        <Select value={visibility} onValueChange={setVisibility}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {tVisibility(option.value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <input type="hidden" name="visibility" value={visibility} />
      <input type="hidden" name="wishlistId" value={selectedWishlistId} />
      <input type="hidden" name="currency" value={selectedCurrency === "none" ? "" : selectedCurrency} />
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
