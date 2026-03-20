"use client";

import type { Tag, TagCategory } from "@koillection/db";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@koillection/ui";
import { useTranslations } from "next-intl";

type EditableTag = Pick<Tag, "id" | "label" | "description" | "visibility" | "categoryId">;

interface TagFormProps {
  tag?: EditableTag;
  categories: Pick<TagCategory, "id" | "label">[];
}

export function TagForm({ tag, categories }: TagFormProps) {
  const router = useRouter();
  const t = useTranslations("tags");
  const tCommon = useTranslations("common");
  const tVisibility = useTranslations("visibility");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState(tag?.categoryId ?? "none");

  const isEdit = Boolean(tag);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      label: String(formData.get("label") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      categoryId: selectedCategoryId === "none" ? null : selectedCategoryId,
      visibility: String(formData.get("visibility") ?? "public"),
    };

    const response = await fetch(isEdit ? `/api/tags/${tag!.id}` : "/api/tags", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t("form.saveFailed"));
      setSaving(false);
      return;
    }

    const saved = (await response.json()) as { id: string };
    router.push(`/tags/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="label">{t("form.label")}</Label>
        <Input id="label" name="label" required defaultValue={tag?.label ?? ""} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("form.description")}</Label>
        <Textarea id="description" name="description" rows={4} defaultValue={tag?.description ?? ""} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="categoryId">{t("form.category")}</Label>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger id="categoryId">
              <SelectValue placeholder={t("form.noCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("form.noCategory")}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="visibility">{tCommon("visibility")}</Label>
          <Select name="visibility" defaultValue={tag?.visibility ?? "public"}>
            <SelectTrigger id="visibility">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{tVisibility("public")}</SelectItem>
              <SelectItem value="internal">{tVisibility("internal")}</SelectItem>
              <SelectItem value="private">{tVisibility("private")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <input type="hidden" name="categoryId" value={selectedCategoryId === "none" ? "" : selectedCategoryId} />

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>
          {saving ? tCommon("saving") : isEdit ? tCommon("edit") : tCommon("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
