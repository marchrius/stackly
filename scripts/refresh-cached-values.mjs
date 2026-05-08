import {
  closePrisma,
  hasFlag,
  mergePriceBuckets,
  normalizeVisibility,
  printHelp,
  prisma,
  visibilityCountersShape,
  VISIBILITIES,
} from "./_lib/maintenance.mjs";

async function main() {
  if (hasFlag("--help")) {
    printHelp([
      "Usage: npm run maintenance:refresh-cached-values -- [--dry-run]",
      "",
      "Refreshes direct counters and collection cachedValues for collections, wishlists, and albums.",
    ]);
    return;
  }

  const dryRun = hasFlag("--dry-run");

  const [collections, items, datums, wishlists, wishes, albums, photos] = await Promise.all([
    prisma.collection.findMany({ select: { id: true, parentId: true, finalVisibility: true } }),
    prisma.item.findMany({ select: { id: true, collectionId: true, finalVisibility: true } }),
    prisma.datum.findMany({
      where: { type: "price" },
      select: { label: true, value: true, currency: true, finalVisibility: true, itemId: true, collectionId: true },
    }),
    prisma.wishlist.findMany({ select: { id: true, parentId: true, finalVisibility: true } }),
    prisma.wish.findMany({ select: { id: true, wishlistId: true, finalVisibility: true } }),
    prisma.album.findMany({ select: { id: true, parentId: true, finalVisibility: true } }),
    prisma.photo.findMany({ select: { id: true, albumId: true, finalVisibility: true } }),
  ]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const collectionChildren = groupByParent(collections);
  const wishlistChildren = groupByParent(wishlists);
  const albumChildren = groupByParent(albums);
  const itemsByCollection = groupByForeignKey(items, "collectionId");
  const wishesByWishlist = groupByForeignKey(wishes, "wishlistId");
  const photosByAlbum = groupByForeignKey(photos, "albumId");
  const pricesByCollection = new Map();

  for (const datum of datums) {
    const collectionId = datum.collectionId ?? itemById.get(datum.itemId ?? "")?.collectionId ?? null;
    if (!collectionId) continue;
    if (!pricesByCollection.has(collectionId)) pricesByCollection.set(collectionId, []);
    pricesByCollection.get(collectionId).push(datum);
  }

  const collectionUpdates = [];
  const wishlistUpdates = [];
  const albumUpdates = [];

  for (const collection of collections.filter((entry) => !entry.parentId)) {
    computeCollection(collection.id, {
      collectionChildren,
      itemsByCollection,
      pricesByCollection,
      collectionUpdates,
    });
  }

  for (const wishlist of wishlists.filter((entry) => !entry.parentId)) {
    computeTreeCounters(wishlist.id, {
      childGroups: wishlistChildren,
      leafGroups: wishesByWishlist,
      childLabel: "children",
      leafLabel: "wishes",
      updates: wishlistUpdates,
    });
  }

  for (const album of albums.filter((entry) => !entry.parentId)) {
    computeTreeCounters(album.id, {
      childGroups: albumChildren,
      leafGroups: photosByAlbum,
      childLabel: "children",
      leafLabel: "photos",
      updates: albumUpdates,
    });
  }

  if (!dryRun) {
    await prisma.$transaction([
      ...collectionUpdates.map((entry) =>
        prisma.collection.update({ where: { id: entry.id }, data: entry.data }),
      ),
      ...wishlistUpdates.map((entry) =>
        prisma.wishlist.update({ where: { id: entry.id }, data: entry.data }),
      ),
      ...albumUpdates.map((entry) =>
        prisma.album.update({ where: { id: entry.id }, data: entry.data }),
      ),
    ]);
  }

  console.log(`${dryRun ? "Would refresh" : "Refreshed"} ${collectionUpdates.length} collection cache(s).`);
  console.log(`${dryRun ? "Would refresh" : "Refreshed"} ${wishlistUpdates.length} wishlist counter set(s).`);
  console.log(`${dryRun ? "Would refresh" : "Refreshed"} ${albumUpdates.length} album counter set(s).`);
}

function computeCollection(id, context) {
  const result = {
    ...visibilityCountersShape("children", "items"),
    prices: {
      publicPrices: {},
      internalPrices: {},
      privatePrices: {},
    },
  };

  const directChildren = context.collectionChildren.get(id) ?? [];
  const directItems = context.itemsByCollection.get(id) ?? [];
  const directPrices = context.pricesByCollection.get(id) ?? [];

  for (const child of directChildren) {
    result.counters[counterKey(normalizeVisibility(child.finalVisibility))].children += 1;
  }

  for (const item of directItems) {
    result.counters[counterKey(normalizeVisibility(item.finalVisibility))].items += 1;
  }

  for (const datum of directPrices) {
    const amount = Number.parseFloat(datum.value ?? "");
    if (!Number.isFinite(amount)) continue;
    const label = datum.label || "price";
    const currency = datum.currency || "default";
    const bucket = result.prices[priceKey(normalizeVisibility(datum.finalVisibility))];
    const bucketByLabel = (bucket[label] ??= {});
    bucketByLabel[currency] = (bucketByLabel[currency] ?? 0) + amount;
  }

  for (const child of directChildren) {
    const nested = computeCollection(child.id, context);
    for (const visibility of VISIBILITIES) {
      result.counters[counterKey(visibility)].children += nested.counters[counterKey(visibility)].children;
      result.counters[counterKey(visibility)].items += nested.counters[counterKey(visibility)].items;
      mergePriceBuckets(result.prices[priceKey(visibility)], nested.prices[priceKey(visibility)]);
    }
  }

  context.collectionUpdates.push({
    id,
    data: {
      childrenCount: directChildren.length,
      cachedValues: result,
    },
  });

  return result;
}

function computeTreeCounters(id, context) {
  const result = visibilityCountersShape(context.childLabel, context.leafLabel);
  const directChildren = context.childGroups.get(id) ?? [];
  const directLeaves = context.leafGroups.get(id) ?? [];

  for (const child of directChildren) {
    result.counters[counterKey(normalizeVisibility(child.finalVisibility))][context.childLabel] += 1;
  }

  for (const leaf of directLeaves) {
    result.counters[counterKey(normalizeVisibility(leaf.finalVisibility))][context.leafLabel] += 1;
  }

  for (const child of directChildren) {
    const nested = computeTreeCounters(child.id, context);
    for (const visibility of VISIBILITIES) {
      result.counters[counterKey(visibility)][context.childLabel] += nested.counters[counterKey(visibility)][context.childLabel];
      result.counters[counterKey(visibility)][context.leafLabel] += nested.counters[counterKey(visibility)][context.leafLabel];
    }
  }

  context.updates.push({
    id,
    data: {
      [`${context.childLabel}Count`]: directChildren.length,
      ...(context.leafLabel === "wishes" ? { wishesCount: directLeaves.length } : {}),
      ...(context.leafLabel === "photos" ? { photosCount: directLeaves.length } : {}),
    },
  });

  return result;
}

function groupByParent(records) {
  const groups = new Map();
  for (const record of records) {
    const key = record.parentId ?? "__root__";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

function groupByForeignKey(records, field) {
  const groups = new Map();
  for (const record of records) {
    const key = record[field];
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  }
  return groups;
}

function counterKey(visibility) {
  return `${visibility}Counters`;
}

function priceKey(visibility) {
  return `${visibility}Prices`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePrisma);
