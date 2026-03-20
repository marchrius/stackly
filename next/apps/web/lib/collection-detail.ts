type CollectionCounters = {
  children: number;
  items: number;
};

type CollectionPriceGroup = {
  label: string;
  currencies: Array<{ currency: string; value: number }>;
};

type CollectionCachedSummary = {
  counters: CollectionCounters;
  prices: CollectionPriceGroup[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readNumber(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function mergePriceBucket(bucket: unknown, target: Map<string, Map<string, number>>) {
  const prices = asRecord(bucket);
  if (!prices) return;

  for (const [label, currenciesValue] of Object.entries(prices)) {
    const currencies = asRecord(currenciesValue);
    if (!currencies) continue;

    const entry = target.get(label) ?? new Map<string, number>();
    for (const [currency, amount] of Object.entries(currencies)) {
      if (typeof amount !== "number" || !Number.isFinite(amount)) continue;
      entry.set(currency, (entry.get(currency) ?? 0) + amount);
    }
    target.set(label, entry);
  }
}

export function getCollectionCachedSummary(cachedValues: unknown): CollectionCachedSummary {
  const root = asRecord(cachedValues);
  const countersRoot = asRecord(root?.counters);
  const pricesRoot = asRecord(root?.prices);

  const publicCounters = asRecord(countersRoot?.publicCounters);
  const internalCounters = asRecord(countersRoot?.internalCounters);
  const privateCounters = asRecord(countersRoot?.privateCounters);

  const counters = {
    children: readNumber(publicCounters, "children") + readNumber(internalCounters, "children") + readNumber(privateCounters, "children"),
    items: readNumber(publicCounters, "items") + readNumber(internalCounters, "items") + readNumber(privateCounters, "items"),
  };

  const mergedPrices = new Map<string, Map<string, number>>();
  mergePriceBucket(pricesRoot?.publicPrices, mergedPrices);
  mergePriceBucket(pricesRoot?.internalPrices, mergedPrices);
  mergePriceBucket(pricesRoot?.privatePrices, mergedPrices);

  const prices = [...mergedPrices.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, currencies]) => ({
      label,
      currencies: [...currencies.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([currency, value]) => ({ currency, value })),
    }));

  return { counters, prices };
}
