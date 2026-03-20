import { describe, expect, it } from "vitest";
import { getCollectionCachedSummary } from "@/lib/collection-detail";

describe("collection detail helpers", () => {
  it("merges counters and price buckets from all visibility levels", () => {
    expect(getCollectionCachedSummary({
      counters: {
        publicCounters: { children: 1, items: 2 },
        internalCounters: { children: 3, items: 4 },
        privateCounters: { children: 5, items: 6 },
      },
      prices: {
        publicPrices: { Cover: { EUR: 10 } },
        internalPrices: { Cover: { EUR: 5, USD: 3 } },
        privatePrices: { Boxed: { GBP: 8 } },
      },
    })).toEqual({
      counters: { children: 9, items: 12 },
      prices: [
        { label: "Boxed", currencies: [{ currency: "GBP", value: 8 }] },
        {
          label: "Cover",
          currencies: [
            { currency: "EUR", value: 15 },
            { currency: "USD", value: 3 },
          ],
        },
      ],
    });
  });

  it("returns empty counters and prices for invalid cached payloads", () => {
    expect(getCollectionCachedSummary(null)).toEqual({
      counters: { children: 0, items: 0 },
      prices: [],
    });
  });
});
