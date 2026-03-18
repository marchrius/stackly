"use client";

import type { Item, Datum, Tag, ChoiceList } from "@koillection/db";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@koillection/ui";
import { createItem, updateItem } from "@/lib/actions/item.actions";
import { DATUM_TYPES, VISIBILITY_OPTIONS } from "@koillection/lib";
import { Plus, Trash2, GripVertical } from "lucide-react";

type ItemWithRelations = Item & { data: Datum[]; tags: Tag[] };

interface ItemFormProps {
  item?: ItemWithRelations;
  tags: Tag[];
  choiceLists: ChoiceList[];
  defaultCollectionId?: string | undefined;
}

export function ItemForm({ item, tags, choiceLists, defaultCollectionId }: ItemFormProps) {
  const isEdit = !!item;
  const [loading, setLoading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(item?.tags.map((t) => t.id) ?? []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    selectedTags.forEach((id) => formData.append("tagIds[]", id));
    if (defaultCollectionId) formData.set("collectionId", defaultCollectionId);
    if (isEdit) {
      await updateItem(item.id, formData);
    } else {
      await createItem(formData);
    }
    setLoading(false);
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={item?.name ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantità</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={item?.quantity ?? 1} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="visibility">Visibilità</Label>
          <Select name="visibility" defaultValue={item?.visibility ?? "public"}>
            <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tag selection */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <Label>Tag</Label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleTag(tag.id)}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea oggetto"}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
      </div>
    </form>
  );
}

