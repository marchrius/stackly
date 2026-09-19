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

export type CollectionAggregateCounters = {
  children: number;
  items: number;
};

type CollectionCounterNode = {
  id: string;
  parentId: string | null;
  directItems: number;
};

export function getAggregateCollectionCounters(
  collections: CollectionCounterNode[],
): Record<string, CollectionAggregateCounters> {
  const nodesById = new Map(collections.map((collection) => [collection.id, collection]));
  const childrenByParent = new Map<string, CollectionCounterNode[]>();

  for (const collection of collections) {
    if (!collection.parentId || !nodesById.has(collection.parentId)) continue;
    const children = childrenByParent.get(collection.parentId) ?? [];
    children.push(collection);
    childrenByParent.set(collection.parentId, children);
  }

  const counters: Record<string, CollectionAggregateCounters> = {};
  const visiting = new Set<string>();

  function visit(collection: CollectionCounterNode): CollectionAggregateCounters {
    if (counters[collection.id]) return counters[collection.id];
    if (visiting.has(collection.id)) {
      return { children: 0, items: collection.directItems };
    }

    visiting.add(collection.id);
    const directChildren = childrenByParent.get(collection.id) ?? [];
    const result = directChildren.reduce<CollectionAggregateCounters>(
      (total, child) => {
        const childCounters = visit(child);
        total.children += 1 + childCounters.children;
        total.items += childCounters.items;
        return total;
      },
      { children: 0, items: collection.directItems },
    );
    visiting.delete(collection.id);
    counters[collection.id] = result;
    return result;
  }

  for (const collection of collections) visit(collection);
  return counters;
}

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
