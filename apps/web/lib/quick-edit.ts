export const QUICK_EDIT_UNSUPPORTED_TYPES = new Set(["image", "file", "video", "section", "blank-line"]);

export interface QuickEditDatum {
  id: string;
  label: string | null;
  type: string;
  value: string | null;
  currency: string | null;
  displayMode: string;
  visibility: string;
  choiceListId: string | null;
  position: number | null;
}

export interface QuickEditColumn {
  key: string;
  label: string;
  type: string;
  editable: boolean;
}

export function datumColumnKey(label: string) {
  return label.trim().toLocaleLowerCase();
}

export function buildQuickEditColumns(rows: Array<{ data: QuickEditDatum[] }>): QuickEditColumn[] {
  const columns = new Map<string, QuickEditColumn>();

  for (const row of rows) {
    for (const datum of row.data) {
      const label = datum.label?.trim();
      if (!label) continue;
      const key = datumColumnKey(label);
      if (!columns.has(key)) {
        columns.set(key, {
          key,
          label,
          type: datum.type,
          editable: !QUICK_EDIT_UNSUPPORTED_TYPES.has(datum.type),
        });
      }
    }
  }

  return [...columns.values()].sort((left, right) => left.label.localeCompare(right.label, undefined, { numeric: true }));
}

export function quickEditInputValue(datum: QuickEditDatum | undefined) {
  if (!datum?.value) return "";
  if (datum.type !== "list" && datum.type !== "choice-list") return datum.value;
  try {
    const parsed = JSON.parse(datum.value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string").join(", ") : datum.value;
  } catch {
    return datum.value;
  }
}

export function normalizeQuickEditValue(type: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (type === "checkbox") return value === "1" || value === "true" ? "1" : "0";
  if (type === "list" || type === "choice-list") {
    return JSON.stringify(trimmed.split(",").map((entry) => entry.trim()).filter(Boolean));
  }
  return trimmed;
}
