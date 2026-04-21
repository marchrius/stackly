"use client";

import type { ChoiceList } from "@stackly/db";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button, Input, Label, Textarea } from "@stackly/ui";
import { useTranslations } from "next-intl";

interface ChoiceListFormProps {
  choiceList?: Pick<ChoiceList, "id" | "name" | "choices">;
}

export function ChoiceListForm({ choiceList }: ChoiceListFormProps) {
  const router = useRouter();
  const t = useTranslations("choiceLists");
  const tCommon = useTranslations("common");
  const [name, setName] = useState(choiceList?.name ?? "");
  const [choicesText, setChoicesText] = useState(() => {
    const choices = Array.isArray(choiceList?.choices)
      ? choiceList?.choices.filter((choice): choice is string => typeof choice === "string")
      : [];
    return choices.join("\n");
  });
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
