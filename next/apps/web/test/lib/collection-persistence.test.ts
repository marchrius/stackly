import { describe, expect, it, vi } from "vitest";

vi.mock("@koillection/db", () => ({
  prisma: {},
}));

import { syncCollectionDatumEntries } from "@/lib/collection-persistence";

describe("syncCollectionDatumEntries", () => {
  it("creates new collection datum entries with collection linkage", async () => {
    const tx = {
      datum: {
        create: vi.fn().mockResolvedValue({ id: "datum-1" }),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await syncCollectionDatumEntries(
      tx as never,
      "collection-1",
      "internal",
      [{ label: "Publisher", type: "text", visibility: "public", value: "Marvel" }],
      [],
    );

    expect(tx.datum.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        collectionId: "collection-1",
        type: "text",
        value: "Marvel",
        parentVisibility: "internal",
        finalVisibility: "internal",
      }),
    });
  });

  it("updates existing collection file datum entries", async () => {
    const tx = {
      datum: {
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "datum-1" }),
        delete: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await syncCollectionDatumEntries(
      tx as never,
      "collection-1",
      "private",
      [
        {
          id: "datum-1",
          label: "Catalog",
          type: "file",
          visibility: "internal",
          file: "collections/catalog.pdf",
          originalFilename: "catalog.pdf",
        },
      ],
      [{ id: "datum-1" }],
    );

    expect(tx.datum.update).toHaveBeenCalledWith({
      where: { id: "datum-1" },
      data: expect.objectContaining({
        type: "file",
        file: "collections/catalog.pdf",
        originalFilename: "catalog.pdf",
        finalVisibility: "private",
      }),
    });
  });
});
