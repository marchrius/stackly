"use client";

import type { ChoiceList, Field, Template } from "@stackly/db";
import { DATUM_TYPES } from "@stackly/lib";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stackly/ui";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type EditableTemplate = Pick<Template, "id" | "name"> & { fields: Field[] };

type TemplateFieldState = {
  id?: string;
  name: string;
  type: string;
  visibility: string;
  choiceListId: string;
  displayMode: "pill" | "list";
};

interface TemplateFormProps {
  template?: EditableTemplate;
  choiceLists: Pick<ChoiceList, "id" | "name">[];
}

function mapField(field?: Field): TemplateFieldState {
  return {
    id: field?.id,
    name: field?.name ?? "",
    type: field?.type ?? "text",
    visibility: field?.visibility ?? "public",
    choiceListId: field?.choiceListId ?? "",
    displayMode: field?.displayMode === "pill" ? "pill" : "list",
  };
}

export function TemplateForm({ template, choiceLists }: TemplateFormProps) {
  const router = useRouter();
  const t = useTranslations("templates");
  const tCommon = useTranslations("common");
  const tVisibility = useTranslations("visibility");
  const [name, setName] = useState(template?.name ?? "");
  const [fields, setFields] = useState<TemplateFieldState[]>(
    template?.fields.length
      ? [...template.fields].sort((a, b) => a.position - b.position).map((field) => mapField(field))
      : [mapField()],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(template);

  function updateField(index: number, patch: Partial<TemplateFieldState>) {
    setFields((current) =>
      current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    );
  }

  function addField() {
    setFields((current) => [...current, mapField()]);
  }

  function removeField(index: number) {
    setFields((current) => (current.length === 1 ? current : current.filter((_, fieldIndex) => fieldIndex !== index)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: name.trim(),
      fields: fields.map((field) => ({
        id: field.id,
        name: field.name.trim(),
        type: field.type,
        visibility: field.visibility,
        choiceListId: field.type === "choice-list" && field.choiceListId ? field.choiceListId : null,
        displayMode: field.type === "list" ? field.displayMode : "list",
      })),
    };

    const response = await fetch(isEdit ? `/api/templates/${template!.id}` : "/api/templates", {
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
    router.push(`/templates/${saved.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="name">{t("form.name")}</Label>
        <Input id="name" name="name" required value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("form.fields")}</h2>
            <p className="text-sm text-muted-foreground">{t("form.fieldsHelp")}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-2 h-4 w-4" />
            {t("form.addField")}
          </Button>
        </div>

        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id ?? `new-${index}`} className="rounded-lg border p-4">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`field-name-${index}`}>{t("form.fieldName")}</Label>
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide">
                      {t(`fieldTypes.${field.type}` as never)}
                    </Badge>
                  </div>
                  <Input
                    id={`field-name-${index}`}
                    value={field.name}
                    onChange={(event) => updateField(index, { name: event.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`field-type-${index}`}>{t("form.fieldType")}</Label>
                  <Select value={field.type} onValueChange={(value) => updateField(index, { type: value })}>
                    <SelectTrigger id={`field-type-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATUM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(`fieldTypes.${type.value}` as never)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {field.type === "list" ? (
                  <div className="space-y-2">
                    <Label htmlFor={`field-display-mode-${index}`}>{t("form.displayMode")}</Label>
                    <Select value={field.displayMode} onValueChange={(value) => updateField(index, { displayMode: value as "pill" | "list" })}>
                      <SelectTrigger id={`field-display-mode-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list">{t("form.displayModes.list")}</SelectItem>
                        <SelectItem value="pill">{t("form.displayModes.pill")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div />
                )}

                <div className="space-y-2">
                  <Label htmlFor={`field-visibility-${index}`}>{t("form.fieldVisibility")}</Label>
                  <Select value={field.visibility} onValueChange={(value) => updateField(index, { visibility: value })}>
                    <SelectTrigger id={`field-visibility-${index}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{tVisibility("public")}</SelectItem>
                      <SelectItem value="internal">{tVisibility("internal")}</SelectItem>
                      <SelectItem value="private">{tVisibility("private")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`field-choice-list-${index}`}>{t("form.choiceList")}</Label>
                  <Select
                    value={field.choiceListId || "none"}
                    onValueChange={(value) => updateField(index, { choiceListId: value === "none" ? "" : value })}
                    disabled={field.type !== "choice-list"}
                  >
                    <SelectTrigger id={`field-choice-list-${index}`}>
                      <SelectValue placeholder={t("form.noChoiceList")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("form.noChoiceList")}</SelectItem>
                      {choiceLists.map((choiceList) => (
                        <SelectItem key={choiceList.id} value={choiceList.id}>
                          {choiceList.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeField(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("form.removeField")}</span>
                  </Button>
                </div>
              </div>
            </div>
          ))}
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
