"use client";

import type { Album } from "@koillection/db";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { createAlbum, updateAlbum } from "@/lib/actions/media.actions";
import { VISIBILITY_OPTIONS } from "@koillection/lib";

export function AlbumForm({ album }: { album?: Album }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!album;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (isEdit) await updateAlbum(album.id, formData);
    else await createAlbum(formData);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Titolo *</Label>
        <Input id="title" name="title" required defaultValue={album?.title ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Colore</Label>
        <input type="color" id="color" name="color" defaultValue={album?.color ? `#${album.color}` : "#8b5cf6"} className="h-9 w-16 cursor-pointer rounded border border-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilità</Label>
        <Select name="visibility" defaultValue={album?.visibility ?? "public"}>
          <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
          <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea album"}</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
      </div>
    </form>
  );
}

