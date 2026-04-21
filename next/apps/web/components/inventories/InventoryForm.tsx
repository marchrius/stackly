"use client";

import type { Inventory } from "@stackly/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label, Textarea } from "@stackly/ui";
import { useTranslations } from "next-intl";

interface InventoryFormProps {
  inventory?: Pick<Inventory, "id" | "name" | "content">;
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

export function InventoryForm({ inventory }: InventoryFormProps) {
  const router = useRouter();
  const t = useTranslations("inventories");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(inventory?.name ?? "");
  const [content, setContent] = useState(formatJson(inventory?.content));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(inventory);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    let parsedContent: unknown = [];
    try {
      parsedContent = JSON.parse(content || "[]");
    } catch {
      setError(t("form.invalidJson"));
      setSaving(false);
      return;
    }

    const response = await fetch(isEdit ? `/api/inventories/${inventory!.id}` : "/api/inventories", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), content: parsedContent }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t("form.saveFailed"));
      setSaving(false);
      return;
    }

    const saved = (await response.json()) as { id: string };
    router.push(`/inventories/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input id="name" name="name" required value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">{t("form.content")}</Label>
        <Textarea
          id="content"
          name="content"
          rows={14}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          spellCheck={false}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">{t("form.contentHelp")}</p>
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
