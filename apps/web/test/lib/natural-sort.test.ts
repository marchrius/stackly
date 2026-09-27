import { describe, expect, it } from "vitest";
import { compareNaturalText, compareSortValues, sortByDefinitions, sortByNaturalText } from "@/lib/natural-sort";

describe("natural-sort", () => {
  it("sorts embedded volume numbers as integers", () => {
    const values = ["Volume 1", "Volume 10", "Volume 2", "Volume 12", "Volume 3"];

    expect(sortByNaturalText(values, (value) => value)).toEqual(["Volume 1", "Volume 2", "Volume 3", "Volume 10", "Volume 12"]);
  });

  it("can sort objects by a textual field", () => {
    const items = [{ name: "Item 12" }, { name: "Item 1" }, { name: "Item 2" }];

    expect(sortByNaturalText(items, (item) => item.name).map((item) => item.name)).toEqual(["Item 1", "Item 2", "Item 12"]);
  });

  it("uses the same comparison for direct text comparisons", () => {
    expect(compareNaturalText("Album 2", "Album 10")).toBeLessThan(0);
  });

  it("supports reusable natural sort definitions with deterministic tie breakers", () => {
    const items = [
      { id: "b", name: "Issue 10" },
      { id: "c", name: "Issue 2" },
      { id: "a", name: "Issue 2" },
      { id: "d", name: "Issue 1" },
    ];

    expect(sortByDefinitions(items, [
      { getValue: (item) => item.name, type: "natural" },
      { getValue: (item) => item.id, type: "text" },
    ]).map((item) => item.id)).toEqual(["d", "a", "c", "b"]);
  });

  it("supports numbers, dates, directions and null placement", () => {
    const items = [
      { id: "missing", position: null, publishedAt: null },
      { id: "second", position: 2, publishedAt: "2024-01-01" },
      { id: "tenth", position: 10, publishedAt: "2025-01-01" },
    ];

    expect(sortByDefinitions(items, [{ getValue: (item) => item.position, type: "position" }]).map((item) => item.id))
      .toEqual(["second", "tenth", "missing"]);
    expect(sortByDefinitions(items, [{ getValue: (item) => item.publishedAt, type: "date", direction: "desc", nulls: "last" }]).map((item) => item.id))
      .toEqual(["tenth", "second", "missing"]);
  });

  it("exposes value comparison for contexts that compose their own sorting", () => {
    expect(compareSortValues("2", "10", { type: "number" })).toBeLessThan(0);
    expect(compareSortValues("Volume 2", "Volume 10", { type: "natural" })).toBeLessThan(0);
  });
});
