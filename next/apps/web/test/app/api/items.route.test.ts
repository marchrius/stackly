import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const {
  mockRequireApiSession,
  mockJsonError,
  mockLogApiAction,
  mockResolveItemContext,
  mockComputeFinalVisibility,
  mockSyncDatumEntries,
  mockPrisma,
} = vi.hoisted(() => ({
  mockRequireApiSession: vi.fn(),
  mockJsonError: vi.fn((message: string, status: number) => new Response(JSON.stringify({ error: message }), { status })),
  mockLogApiAction: vi.fn(),
  mockResolveItemContext: vi.fn(),
  mockComputeFinalVisibility: vi.fn(() => "internal"),
  mockSyncDatumEntries: vi.fn(),
  mockPrisma: {
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/api-helpers", () => ({
  requireApiSession: mockRequireApiSession,
  jsonError: mockJsonError,
  logApiAction: mockLogApiAction,
  parsePagination: vi.fn(),
}));

vi.mock("@/lib/item-persistence", () => ({
  resolveItemContext: mockResolveItemContext,
  computeFinalVisibility: mockComputeFinalVisibility,
  syncDatumEntries: mockSyncDatumEntries,
}));

vi.mock("@koillection/db", () => ({
  prisma: mockPrisma,
}));

import { POST } from "@/app/api/items/route";

describe("POST /api/items", () => {
  it("returns 400 when the item context is invalid", async () => {
    mockRequireApiSession.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockResolveItemContext.mockResolvedValue({ error: "Collection not found" });

    const response = await POST(new NextRequest("http://localhost/api/items", {
      method: "POST",
      body: JSON.stringify({
        name: "Item test",
        quantity: 1,
        visibility: "public",
        collectionId: "missing-collection",
        tagIds: [],
        dataPayload: [],
      }),
    }));
    expect(response).toBeDefined();
    if (!response) throw new Error("Expected a response");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Collection not found" });
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });

  it("creates the item, syncs datum entries and logs the action", async () => {
    mockRequireApiSession.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockResolveItemContext.mockResolvedValue({ parentVisibility: "internal" });

    const tx = {
      item: {
        create: vi.fn().mockResolvedValue({
          id: "item-1",
          name: "Item test",
          finalVisibility: "internal",
          tags: [],
          data: [],
          collection: { id: "collection-1", title: "Collection" },
        }),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          id: "item-1",
          name: "Item test",
          tags: [{ id: "tag-1", label: "Rare" }],
          data: [{ id: "datum-1", label: "Author", value: "Alice" }],
          collection: { id: "collection-1", title: "Collection" },
        }),
      },
    };

    mockPrisma.$transaction.mockImplementation(async (callback: (trx: typeof tx) => Promise<unknown>) => callback(tx));

    const response = await POST(new NextRequest("http://localhost/api/items", {
      method: "POST",
      body: JSON.stringify({
        name: "Item test",
        quantity: 2,
        visibility: "public",
        collectionId: "collection-1",
        tagIds: ["tag-1", "tag-1"],
        dataPayload: [{ label: "Price", type: "price", visibility: "public", value: "19.99", currency: "EUR" }],
      }),
    }));
    expect(response).toBeDefined();
    if (!response) throw new Error("Expected a response");

    expect(tx.item.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        name: "Item test",
        quantity: 2,
        collectionId: "collection-1",
        ownerId: "user-1",
        parentVisibility: "internal",
        finalVisibility: "internal",
        tags: { connect: [{ id: "tag-1" }] },
      }),
    }));
    expect(mockSyncDatumEntries).toHaveBeenCalledWith(
      tx,
      "item-1",
      "internal",
      [{ label: "Price", type: "price", visibility: "public", value: "19.99", currency: "EUR" }],
      [],
    );
    expect(mockLogApiAction).toHaveBeenCalledWith("user-1", "create", "item-1", "Item test", "Item");
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({
      id: "item-1",
      name: "Item test",
      tags: [{ id: "tag-1", label: "Rare" }],
      data: [{ id: "datum-1", label: "Author", value: "Alice" }],
      collection: { id: "collection-1", title: "Collection" },
    });
  });
});
