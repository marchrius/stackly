import { describe, expect, it } from "vitest";
import { buildQuickEditColumns, normalizeQuickEditValue, quickEditInputValue, type QuickEditDatum } from "@/lib/quick-edit";

function datum(overrides: Partial<QuickEditDatum>): QuickEditDatum {
  return { id: "datum", label: "Field", type: "text", value: null, currency: null, displayMode: "list", visibility: "public", choiceListId: null, position: 0, ...overrides };
}

describe("quick edit", () => {
  it("builds the union of custom fields across rows", () => {
    const columns = buildQuickEditColumns([
      { data: [datum({ label: "N.", type: "number" })] },
      { data: [datum({ id: "other", label: "Author" })] },
    ]);
    expect(columns.map((column) => column.label)).toEqual(["Author", "N."]);
  });

  it("deduplicates labels case-insensitively and marks media as read only", () => {
    const columns = buildQuickEditColumns([{ data: [datum({ label: "Cover", type: "image" }), datum({ id: "two", label: "cover" })] }]);
    expect(columns).toEqual([{ key: "cover", label: "Cover", type: "image", editable: false }]);
  });

  it("converts list values between compact text and storage JSON", () => {
    const value = datum({ type: "list", value: '["one","two"]' });
    expect(quickEditInputValue(value)).toBe("one, two");
    expect(normalizeQuickEditValue("list", "one, two")).toBe('["one","two"]');
  });

  it("treats blank custom values as absent", () => {
    expect(normalizeQuickEditValue("text", "   ")).toBeNull();
  });
});
