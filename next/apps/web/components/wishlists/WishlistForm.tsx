"use client";

import type { Wishlist } from "@koillection/db";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@koillection/ui";
import { createWishlist, updateWishlist } from "@/lib/actions/media.actions";
import { VISIBILITY_OPTIONS } from "@koillection/lib";

export function WishlistForm({ wishlist }: { wishlist?: Wishlist }) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!wishlist;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    if (isEdit) await updateWishlist(wishlist.id, formData);
    else await createWishlist(formData);
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" name="name" required defaultValue={wishlist?.name ?? ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Colore</Label>
        <input type="color" id="color" name="color" defaultValue={wishlist?.color ? `#${wishlist.color}` : "#ec4899"} className="h-9 w-16 cursor-pointer rounded border border-input" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visibility">Visibilità</Label>
        <Select name="visibility" defaultValue={wishlist?.visibility ?? "public"}>
          <SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
          <SelectContent>{VISIBILITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Salvataggio…" : isEdit ? "Aggiorna" : "Crea wishlist"}</Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>Annulla</Button>
      </div>
    </form>
  );
}

