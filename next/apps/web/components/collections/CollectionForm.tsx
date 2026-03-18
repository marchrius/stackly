"use client";

import type { Collection, Template } from "@koillection/db";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { createCollection, updateCollection } from "@/lib/actions/collection.actions";
import { VISIBILITY_OPTIONS } from "@koillection/lib";

interface CollectionFormProps {
  collection?: Collection;
  templates: Template[];
  parentId?: string;
}

export function CollectionForm({ collection, templates, parentId }: CollectionFormProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!collection;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (parentId) formData.set("parentId", parentId);
    if (isEdit) {
      await updateCollection(collection.id, formData);
    } else {
      await createCollection(formData);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titolo *</Label>
        <Input id="title" name="title" required defaultValue={collection?.title ?? ""} placeholder="Nome della collezione" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="color">Colore</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            id="color"
            name="color"
            defaultValue={collection?.color ? `#${collection.color}` : "#6366f1"}
            className="h-9 w-16 cursor-pointer rounded border border-input"
          />
          <span className="text-sm text-muted-foreground">Colore identificativo della collezione</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilità</Label>
        <Select name="visibility" defaultValue={collection?.visibility ?? "public"}>
          <SelectTrigger id="visibility">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VISIBILITY_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {templates.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="itemsDefaultTemplateId">Template predefinito per gli oggetti</Label>
          <Select name="itemsDefaultTemplateId" defaultValue={collection?.itemsDefaultTemplateId ?? ""}>
            <SelectTrigger id="itemsDefaultTemplateId">
              <SelectValue placeholder="Nessun template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nessun template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea collezione"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
      </div>
    </form>
  );
}

