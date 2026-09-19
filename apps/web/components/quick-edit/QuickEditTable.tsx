"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Input } from "@stackly/ui";
import { useTranslations } from "next-intl";
import { buildQuickEditColumns, datumColumnKey, quickEditInputValue, type QuickEditDatum } from "@/lib/quick-edit";
import type { QuickEditResult } from "@/lib/actions/quick-edit.actions";

export interface QuickEditRow {
  id: string;
  name: string;
  color?: string | null;
  quantity?: number;
  visibility: string;
  data: QuickEditDatum[];
}

interface Props {
  kind: "collections" | "items";
  rows: QuickEditRow[];
  save: (payload: string) => Promise<QuickEditResult>;
}

function normalizeColor(value: string | null | undefined) {
  if (!value) return "";
  const color = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-f]{6}$/i.test(color) ? color : "";
}

function ColorCell({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const pickerValue = normalizeColor(value) || "#6366f1";
  return (
    <div className="flex items-center gap-1">
      <input
        type="color"
        value={pickerValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer rounded border border-input bg-background p-0.5"
      />
      <Input
        className="h-8 min-w-24 font-mono"
        value={value}
        placeholder="#6366f1"
        maxLength={7}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function QuickEditTable({ kind, rows, save }: Props) {
  const t = useTranslations("quickEdit");
  const tCommon = useTranslations("common");
  const tVisibility = useTranslations("visibility");
  const columns = useMemo(() => buildQuickEditColumns(rows), [rows]);
  const [values, setValues] = useState(() => rows.map((row) => ({
    id: row.id,
    name: row.name,
    color: normalizeColor(row.color),
    quantity: row.quantity,
    visibility: row.visibility,
    cells: columns.map((column) => ({
      key: column.key,
      value: quickEditInputValue(row.data.find((datum) => datum.label && datumColumnKey(datum.label) === column.key)),
    })),
  })));
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [pending, startTransition] = useTransition();

  function update(rowIndex: number, key: string, value: string | number | null) {
    setStatus("idle");
    setValues((current) => current.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row));
  }

  function updateCell(rowIndex: number, key: string, value: string) {
    setStatus("idle");
    setValues((current) => current.map((row, index) => index === rowIndex
      ? { ...row, cells: row.cells.map((cell) => cell.key === key ? { ...cell, value } : cell) }
      : row));
  }

  function submit() {
    startTransition(async () => {
      const result = await save(JSON.stringify(values));
      setStatus(result.success ? "saved" : "error");
    });
  }

  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{tCommon("none")}</p>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95">
            <tr>
              <th className="sticky left-0 z-20 min-w-64 border-b border-r bg-muted px-2 py-1.5 text-left font-medium">{kind === "collections" ? t("titleColumn") : tCommon("name")}</th>
              {kind === "collections" ? <th className="min-w-32 border-b border-r px-2 py-1.5 text-left font-medium">{t("color")}</th> : <th className="min-w-24 border-b border-r px-2 py-1.5 text-left font-medium">{tCommon("quantity")}</th>}
              <th className="min-w-32 border-b border-r px-2 py-1.5 text-left font-medium">{tCommon("visibility")}</th>
              {columns.map((column) => <th key={column.key} className="min-w-44 border-b border-r px-2 py-1.5 text-left font-medium"><span>{column.label}</span><span className="ml-1 text-xs font-normal text-muted-foreground">({column.type})</span></th>)}
            </tr>
          </thead>
          <tbody>
            {values.map((row, rowIndex) => (
              <tr key={row.id} className="even:bg-muted/25">
                <td className="sticky left-0 z-[5] border-b border-r bg-background p-1"><Input className="h-8" value={row.name} onChange={(event) => update(rowIndex, "name", event.target.value)} /></td>
                <td className="border-b border-r p-1">{kind === "collections" ? <ColorCell value={row.color ?? ""} onChange={(value) => update(rowIndex, "color", value)} /> : <Input className="h-8" type="number" min={0} value={row.quantity ?? 0} onChange={(event) => update(rowIndex, "quantity", Number(event.target.value))} />}</td>
                <td className="border-b border-r p-1">
                  <select className="h-8 w-full rounded-md border bg-background px-2" value={row.visibility} onChange={(event) => update(rowIndex, "visibility", event.target.value)}>
                    <option value="public">{tVisibility("public")}</option><option value="internal">{tVisibility("internal")}</option><option value="private">{tVisibility("private")}</option>
                  </select>
                </td>
                {columns.map((column) => {
                  const cell = row.cells.find((entry) => entry.key === column.key)!;
                  return <td key={column.key} className="border-b border-r p-1">
                    {column.editable ? column.type === "checkbox" ? (
                      <div className="flex h-8 items-center justify-center"><input type="checkbox" checked={cell.value === "1" || cell.value === "true"} onChange={(event) => updateCell(rowIndex, column.key, event.target.checked ? "1" : "0")} /></div>
                    ) : column.type === "color" ? <ColorCell value={cell.value} onChange={(value) => updateCell(rowIndex, column.key, value)} />
                    : <Input className="h-8" type={column.type === "number" || column.type === "price" || column.type === "rating" ? "number" : column.type === "date" ? "date" : "text"} value={cell.value} onChange={(event) => updateCell(rowIndex, column.key, event.target.value)} />
                    : <span className="block px-2 text-xs text-muted-foreground" title={t("unsupportedHint")}>{t("readOnly")}</span>}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={submit} disabled={pending}>{pending ? tCommon("saving") : tCommon("save")}</Button>
        {status === "saved" && <span className="text-sm text-emerald-600">{t("saved")}</span>}
        {status === "error" && <span className="text-sm text-destructive">{t("saveFailed")}</span>}
      </div>
    </div>
  );
}
