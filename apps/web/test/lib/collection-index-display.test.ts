import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { RESERVED_SORTING_VALUES } from "@/lib/collection-display-config";
import { getCollectionCounter, getCollectionDatumDisplayValue, sortCollectionsForDisplay, type CollectionIndexCollection } from "@/lib/collection-index-display";

function makeCollection(overrides: Partial<CollectionIndexCollection>): CollectionIndexCollection {
  return {
    id: overrides.id ?? randomUUID(),
    title: overrides.title ?? "Collection",
    color: null,
    image: null,
    scrapedFromUrl: null,
    visibility: "public",
    parentVisibility: "public",
    finalVisibility: "public",
    seenCounter: 0,
    childrenCount: 0,
    cachedValues: null,
    ownerId: null,
    parentId: null,
    itemsDefaultTemplateId: null,
    childrenDisplayConfigId: null,
    itemsDisplayConfigId: null,
    createdAt: new Date(),
    updatedAt: null,
    _count: { children: 0, items: 0 },
    data: [],
    ...overrides,
  };
}

describe("collection-index-display", () => {
  it("sorts by reserved item counters", () => {
    const collections = [
      makeCollection({ title: "Alpha", _count: { children: 0, items: 1 } }),
      makeCollection({ title: "Beta", _count: { children: 0, items: 5 } }),
    ];

    const sorted = sortCollectionsForDisplay(collections, {
      sortingProperty: RESERVED_SORTING_VALUES.numberOfItems,
      sortingType: null,
      sortingDirection: "DESC",
    });

    expect(sorted.map((collection) => collection.title)).toEqual(["Beta", "Alpha"]);
  });

  it("sorts by datum values", () => {
    const collections = [
      makeCollection({ title: "Comics", data: [{ id: "1", type: "text", label: "Author", value: "Zeta", currency: null, file: null, originalFilename: null, displayMode: "list" }] }),
      makeCollection({ title: "Books", data: [{ id: "2", type: "text", label: "Author", value: "Alpha", currency: null, file: null, originalFilename: null, displayMode: "list" }] }),
    ];

    const sorted = sortCollectionsForDisplay(collections, {
      sortingProperty: "Author",
      sortingType: "text",
      sortingDirection: "ASC",
    });

    expect(sorted.map((collection) => collection.title)).toEqual(["Books", "Comics"]);
  });

  it("formats datum values for list columns", () => {
    const collection = makeCollection({
      data: [
        { id: "3", type: "choice-list", label: "Genres", value: '["Sci-Fi","Drama"]', currency: null, file: null, originalFilename: null, displayMode: "list" },
      ],
    });

    expect(getCollectionDatumDisplayValue(collection, "Genres")).toBe("Sci-Fi, Drama");
  });

  it("prefers cached counters when available", () => {
    const collection = makeCollection({
      _count: { children: 1, items: 1 },
      cachedValues: {
        counters: {
          publicCounters: { children: 2, items: 3 },
          internalCounters: { children: 1, items: 0 },
          privateCounters: { children: 0, items: 4 },
        },
      },
    });

    expect(getCollectionCounter(collection, "children")).toBe(3);
    expect(getCollectionCounter(collection, "items")).toBe(7);
  });
});
