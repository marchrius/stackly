import { describe, expect, it, vi } from "vitest";

vi.mock("@stackly/db", () => ({
  prisma: {},
}));

import { syncDatumEntries } from "@/lib/item-persistence";

describe("syncDatumEntries", () => {
  it("persists currency for newly created price datum entries", async () => {
    const tx = {
      datum: {
        create: vi.fn().mockResolvedValue({ id: "datum-1" }),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await syncDatumEntries(
      tx as never,
      "item-1",
      "public",
      [{ label: "Price", type: "price", visibility: "public", value: "19.99", currency: "EUR" }],
      [],
    );

    expect(tx.datum.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        itemId: "item-1",
        type: "price",
        value: "19.99",
        currency: "EUR",
      }),
    });
  });

  it("persists updated currency for existing price datum entries", async () => {
    const tx = {
      datum: {
        create: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: "datum-1" }),
        delete: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    };

    await syncDatumEntries(
      tx as never,
      "item-1",
      "internal",
      [{ id: "datum-1", label: "Price", type: "price", visibility: "public", value: "24.50", currency: "GBP" }],
      [{ id: "datum-1" }],
    );

    expect(tx.datum.update).toHaveBeenCalledWith({
      where: { id: "datum-1" },
      data: expect.objectContaining({
        type: "price",
        value: "24.50",
        currency: "GBP",
      }),
    });
  });
});
