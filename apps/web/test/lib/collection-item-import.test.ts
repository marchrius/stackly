import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectionFindFirst: vi.fn(),
  scraperFindFirst: vi.fn(),
  itemFindFirst: vi.fn(),
  importLogCreate: vi.fn(),
  importLogUpdate: vi.fn(),
  importLogEntryCreate: vi.fn(),
}));

vi.mock("@stackly/db", () => ({
  prisma: {
    collection: { findFirst: mocks.collectionFindFirst },
    scraper: { findFirst: mocks.scraperFindFirst },
    item: { findFirst: mocks.itemFindFirst },
    importLog: { create: mocks.importLogCreate, update: mocks.importLogUpdate },
    importLogEntry: { create: mocks.importLogEntryCreate },
  },
}));

vi.mock("@/lib/item-persistence", () => ({
  computeFinalVisibility: vi.fn(),
  syncDatumEntries: vi.fn(),
}));

vi.mock("@/lib/server/scraper-preview", () => ({ previewScrape: vi.fn() }));
vi.mock("@/lib/server/uploads", () => ({ downloadRemoteAsset: vi.fn() }));

import { importCollectionItems } from "@/lib/server/collection-item-import";

describe("importCollectionItems logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collectionFindFirst.mockResolvedValue({ title: "Dragonero", finalVisibility: "public" });
    mocks.scraperFindFirst.mockResolvedValue({ name: "ComicsBox", headers: [], dataPaths: [] });
    mocks.importLogCreate.mockResolvedValue({ id: "log-1" });
    mocks.itemFindFirst.mockResolvedValue(null);
    mocks.importLogEntryCreate.mockResolvedValue({});
    mocks.importLogUpdate.mockResolvedValue({});
  });

  it("persists the reason for every failed URL and finalizes the import", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("blocked", { status: 403, statusText: "Forbidden" }))
      .mockResolvedValueOnce(new Response("error", { status: 500, statusText: "Server Error" })));

    const result = await importCollectionItems({
      ownerId: "owner-1",
      collectionId: "collection-1",
      scraperId: "scraper-1",
      urls: ["https://example.test/items/1", "https://example.test/items/2"],
    });

    expect(result).toEqual({ created: 0, skipped: 0, failed: 2, logId: "log-1" });
    expect(mocks.importLogEntryCreate).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        status: "failed",
        sourceUrl: "https://example.test/items/1",
        message: "Remote page returned HTTP 403 Forbidden",
      }),
    });
    expect(mocks.importLogEntryCreate).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        status: "failed",
        sourceUrl: "https://example.test/items/2",
        message: "Remote page returned HTTP 500 Server Error",
      }),
    });
    expect(mocks.importLogUpdate).toHaveBeenCalledWith({
      where: { id: "log-1" },
      data: expect.objectContaining({ status: "failed", created: 0, skipped: 0, failed: 2 }),
    });
  });
});
