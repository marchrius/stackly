"use client";

import type { Loan } from "@stackly/db";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@stackly/ui";
import { useTranslations } from "next-intl";

interface ItemOption {
  id: string;
  name: string;
}

interface LoanFormProps {
  loan?: Pick<Loan, "id" | "lentTo" | "lentAt" | "returnedAt" | "itemId">;
  items: ItemOption[];
  defaultItemId?: string;
}

function formatDateForInput(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().slice(0, 10);
}

export function LoanForm({ loan, items, defaultItemId }: LoanFormProps) {
  const router = useRouter();
  const t = useTranslations("loans");
  const tCommon = useTranslations("common");
  const [itemId, setItemId] = useState(loan?.itemId ?? defaultItemId ?? items[0]?.id ?? "");
  const [lentTo, setLentTo] = useState(loan?.lentTo ?? "");
  const [lentAt, setLentAt] = useState(formatDateForInput(loan?.lentAt) || new Date().toISOString().slice(0, 10));
  const [returnedAt, setReturnedAt] = useState(formatDateForInput(loan?.returnedAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(loan);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      itemId,
      lentTo: lentTo.trim(),
      lentAt,
      returnedAt: returnedAt || null,
    };

    const response = await fetch(isEdit ? `/api/loans/${loan!.id}` : "/api/loans", {
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

    router.push("/loans");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="space-y-2">
        <Label htmlFor="itemId">{t("form.item")}</Label>
        <Select value={itemId} onValueChange={setItemId}>
          <SelectTrigger id="itemId">
            <SelectValue placeholder={t("form.selectItem")} />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lentTo">{t("form.lentTo")}</Label>
          <Input id="lentTo" value={lentTo} onChange={(event) => setLentTo(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lentAt">{t("form.lentAt")}</Label>
          <Input id="lentAt" type="date" value={lentAt} onChange={(event) => setLentAt(event.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="returnedAt">{t("form.returnedAt")}</Label>
        <Input id="returnedAt" type="date" value={returnedAt} onChange={(event) => setReturnedAt(event.target.value)} />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving || !itemId}>
          {saving ? tCommon("saving") : isEdit ? tCommon("edit") : tCommon("create")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
