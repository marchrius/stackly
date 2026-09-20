import { prisma } from "@stackly/db";
import { computeFinalVisibility, syncDatumEntries, type ManagedDatumPayload } from "@/lib/item-persistence";
import { previewScrape } from "@/lib/server/scraper-preview";
import { downloadRemoteAsset } from "@/lib/server/uploads";

export type CollectionItemImportSummary = { created: number; skipped: number; failed: number };

function scraperHeaders(headers: unknown): Record<string, string> {
  if (!Array.isArray(headers)) return {};
  return Object.fromEntries(headers.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const header = "header" in entry && typeof entry.header === "string" ? entry.header : "";
    const value = "value" in entry && typeof entry.value === "string" ? entry.value : "";
    return header ? [[header, value]] : [];
  }));
}

export async function importCollectionItems({ ownerId, collectionId, scraperId, urls }: {
  ownerId: string;
  collectionId: string;
  scraperId: string;
  urls: string[];
}): Promise<CollectionItemImportSummary> {
  const [collection, scraper] = await Promise.all([
    prisma.collection.findFirst({ where: { id: collectionId, ownerId }, select: { finalVisibility: true } }),
    prisma.scraper.findFirst({
      where: { id: scraperId, ownerId, type: "item" },
      include: { dataPaths: { orderBy: { position: "asc" } } },
    }),
  ]);
  if (!collection || !scraper) throw new Error("Invalid collection item import configuration");

  const normalizedUrls = [...new Set(urls.flatMap((value) => {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.protocol === "http:" || url.protocol === "https:" ? [url.toString()] : [];
    } catch {
      return [];
    }
  }))].slice(0, 100);

  const summary: CollectionItemImportSummary = { created: 0, skipped: 0, failed: 0 };
  for (const url of normalizedUrls) {
    const existing = await prisma.item.findFirst({ where: { ownerId, collectionId, scrapedFromUrl: url }, select: { id: true } });
    if (existing) {
      summary.skipped++;
      continue;
    }

    try {
      const response = await fetch(url, { headers: scraperHeaders(scraper.headers), cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`Unable to fetch ${url}`);
      const html = await response.text();
      const preview = await previewScrape({
        html,
        config: { url, namePath: scraper.namePath, imagePath: scraper.imagePath, dataPaths: scraper.dataPaths },
        scrapName: true,
        scrapImage: true,
      });
      if (!preview.name?.trim()) throw new Error("The item scraper did not extract a name");

      let image: Awaited<ReturnType<typeof downloadRemoteAsset>> | null = null;
      if (preview.imageUrl) {
        try { image = await downloadRemoteAsset({ url: preview.imageUrl, userId: ownerId, entity: "items", kind: "image" }); } catch {}
      }

      const payload: ManagedDatumPayload[] = [];
      for (const [position, datum] of preview.data.entries()) {
        if (!datum.value) continue;
        if (datum.type === "image") {
          try {
            const stored = await downloadRemoteAsset({ url: datum.value, userId: ownerId, entity: "items", kind: "image" });
            payload.push({ label: datum.label, type: datum.type, visibility: "public", position, image: stored.path, imageSmallThumbnail: stored.smallThumbnail ?? null, originalFilename: stored.originalFilename ?? null });
          } catch {}
        } else {
          payload.push({ label: datum.label, type: datum.type, visibility: "public", position, value: datum.value });
        }
      }

      const finalVisibility = computeFinalVisibility("public", collection.finalVisibility);
      const item = await prisma.$transaction(async (tx) => {
        const created = await tx.item.create({ data: {
          name: preview.name!.trim(), quantity: 1, visibility: "public",
          parentVisibility: collection.finalVisibility, finalVisibility,
          collectionId, ownerId, scrapedFromUrl: url,
          image: image?.path ?? null,
          imageSmallThumbnail: image?.smallThumbnail ?? null,
          imageLargeThumbnail: image?.largeThumbnail ?? null,
        } });
        await syncDatumEntries(tx, created.id, finalVisibility, payload, []);
        return created;
      });
      await prisma.log.create({ data: { type: "create", loggedAt: new Date(), objectId: item.id, objectLabel: item.name, objectClass: "Item", ownerId } });
      summary.created++;
    } catch {
      summary.failed++;
    }
  }
  return summary;
}
