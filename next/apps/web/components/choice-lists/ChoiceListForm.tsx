"use client";

import type { ChoiceList } from "@stackly/db";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "@stackly/ui";
import { useTranslations } from "next-intl";
import { normalizeChoiceValues } from "@/lib/choice-lists";

interface ChoiceListFormProps {
  choiceList?: Pick<ChoiceList, "id" | "name" | "choices" | "displayMode" | "selectionMode">;
}

export function ChoiceListForm({ choiceList }: ChoiceListFormProps) {
  const router = useRouter();
  const t = useTranslations("choiceLists");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(choiceList?.name ?? "");
  const [choicesText, setChoicesText] = useState(() => {
    const choices = normalizeChoiceValues(choiceList?.choices);
    return choices.join("\n");
  });
  const [displayMode, setDisplayMode] = useState(choiceList?.displayMode === "list" ? "list" : "pill");
  const [selectionMode, setSelectionMode] = useState(choiceList?.selectionMode === "single" ? "single" : "multiple");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(choiceList);

  const choicesPreview = useMemo(
    () => choicesText.split(/\r?\n|,/).map((choice) => choice.trim()).filter(Boolean),
    [choicesText],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      choices: choicesPreview,
      displayMode,
      selectionMode,
    };

    const response = await fetch(isEdit ? `/api/choice-lists/${choiceList!.id}` : "/api/choice-lists", {
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
    router.push(`/choice-lists/${saved.id}`);
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
        <Label htmlFor="choices">{t("form.choices")}</Label>
        <Textarea
          id="choices"
          name="choices"
          rows={10}
          value={choicesText}
          onChange={(event) => setChoicesText(event.target.value)}
          placeholder={t("form.choicesPlaceholder")}
        />
        <p className="text-sm text-muted-foreground">{t("form.choicesHelp")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayMode">{t("form.displayMode")}</Label>
          <Select value={displayMode} onValueChange={(value) => setDisplayMode(value as "pill" | "list")}>
            <SelectTrigger id="displayMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pill">{t("form.displayModes.pill")}</SelectItem>
              <SelectItem value="list">{t("form.displayModes.list")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="selectionMode">{t("form.selectionMode")}</Label>
          <Select value={selectionMode} onValueChange={(value) => setSelectionMode(value as "single" | "multiple")}>
            <SelectTrigger id="selectionMode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">{t("form.selectionModes.single")}</SelectItem>
              <SelectItem value="multiple">{t("form.selectionModes.multiple")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {choicesPreview.length > 0 && (
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          {t("choicesCount", { count: choicesPreview.length })}
        </div>
      )}

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
