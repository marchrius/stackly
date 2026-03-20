import { describe, expect, it } from "vitest";
import { formatCurrencyAmount, formatPriceValue, parseListValues } from "@/lib/datum-format";

describe("datum format helpers", () => {
  it("keeps plain numeric values when no currency is available", () => {
    expect(formatPriceValue("19.99", null)).toBe("19.99");
  });

  it("formats aggregated currency amounts", () => {
    expect(formatCurrencyAmount(25, "EUR")).toMatch(/25/);
  });

  it("parses JSON lists and comma-separated lists", () => {
    expect(parseListValues('["one","two"]')).toEqual(["one", "two"]);
    expect(parseListValues("one, two")).toEqual(["one", "two"]);
  });
});
