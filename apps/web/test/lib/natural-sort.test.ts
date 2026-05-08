import { describe, expect, it } from "vitest";
import { compareNaturalText, sortByNaturalText } from "@/lib/natural-sort";

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
});
