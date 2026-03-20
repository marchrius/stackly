"use client";

import type { TagCategory } from "@koillection/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label, Textarea } from "@koillection/ui";
import { useTranslations } from "next-intl";

interface TagCategoryFormProps {
  category?: Pick<TagCategory, "id" | "label" | "description" | "color">;
}

function normalizeColorValue(value: string | null | undefined): string {
  if (!value) return "#6366f1";
  return value.startsWith("#") ? value : `#${value}`;
}

export function TagCategoryForm({ category }: TagCategoryFormProps) {
  const router = useRouter();
  const t = useTranslations("tags");
  const tCommon = useTranslations("common");
  const [label, setLabel] = useState(category?.label ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [color, setColor] = useState(normalizeColorValue(category?.color));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(category);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch(isEdit ? `/api/tag-categories/${category!.id}` : "/api/tag-categories", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label.trim(),
        description: description.trim() || null,
        color: color.trim() || null,
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t("categories.form.saveFailed"));
      setSaving(false);
      return;
    }

    const saved = (await response.json()) as { id: string };
    router.push(`/tags/categories/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="label">{t("categories.form.label")}</Label>
        <Input id="label" required value={label} onChange={(event) => setLabel(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("categories.form.description")}</Label>
        <Textarea id="description" value={description} rows={4} onChange={(event) => setDescription(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">{t("categories.form.color")}</Label>
        <div className="flex items-center gap-3">
          <input
            id="color"
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-16 cursor-pointer rounded border border-input"
          />
          <Input value={color} onChange={(event) => setColor(event.target.value)} maxLength={7} className="max-w-32" />
        </div>
      </div>

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
