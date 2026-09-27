import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  collectionFindFirst: vi.fn(),
  collectionFindMany: vi.fn(),
  itemFindFirst: vi.fn(),
}));

vi.mock("@stackly/db", () => ({
  prisma: {
    collection: {
      findFirst: mocks.collectionFindFirst,
      findMany: mocks.collectionFindMany,
    },
    item: { findFirst: mocks.itemFindFirst },
  },
}));

import {
  getCollectionPreviewInitials,
  normalizeCollectionPreviewColor,
  resolvePublicCollectionSocialPreview,
} from "@/lib/public/collection-social-preview";

describe("resolvePublicCollectionSocialPreview", () => {
  beforeEach(() => {
    mocks.collectionFindFirst.mockReset();
    mocks.collectionFindMany.mockReset();
    mocks.itemFindFirst.mockReset();
  });

  it("returns null when the collection is not public", async () => {
    mocks.collectionFindFirst.mockResolvedValue(null);

    await expect(resolvePublicCollectionSocialPreview("private")).resolves.toBeNull();
    expect(mocks.collectionFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "private", finalVisibility: "public" },
    }));
    expect(mocks.itemFindFirst).not.toHaveBeenCalled();
  });

  it("prefers the collection image without traversing its contents", async () => {
    mocks.collectionFindFirst.mockResolvedValue({
      id: "root",
      title: "Graphic Novels",
      color: "abc",
      image: "/uploads/collection.webp",
    });

    const preview = await resolvePublicCollectionSocialPreview("root");

    expect(preview).toMatchObject({
      collectionId: "root",
      title: "Graphic Novels",
      color: "#AABBCC",
      initials: "GN",
      imageUrl: "/uploads/collection.webp",
      imageSource: "collection",
    });
    expect(preview?.fingerprint).toMatch(/^[0-9a-f]{16}$/);
    expect(mocks.itemFindFirst).not.toHaveBeenCalled();
    expect(mocks.collectionFindMany).not.toHaveBeenCalled();
  });

  it("uses the first direct public item image and prefers its large thumbnail", async () => {
    mocks.collectionFindFirst.mockResolvedValue({ id: "root", title: "Comics", color: null, image: null });
    mocks.itemFindFirst.mockResolvedValue({
      id: "item-1",
      imageLargeThumbnail: "/large.webp",
      image: "/original.webp",
      imageSmallThumbnail: "/small.webp",
    });

    const preview = await resolvePublicCollectionSocialPreview("root");

    expect(preview).toMatchObject({
      color: "#6366F1",
      initials: "C",
      imageUrl: "/large.webp",
      imageSource: "item",
    });
    expect(mocks.collectionFindMany).not.toHaveBeenCalled();
    expect(mocks.itemFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ collectionId: "root", finalVisibility: "public" }),
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }));
  });

  it("searches public subcollections breadth-first in deterministic order", async () => {
    mocks.collectionFindFirst.mockResolvedValue({ id: "root", title: "Comics", color: "#112233", image: null });
    mocks.itemFindFirst.mockImplementation(async ({ where }: { where: { collectionId: string } }) => {
      if (where.collectionId === "child-b") {
        return { id: "item-b", imageLargeThumbnail: null, image: "/b.webp", imageSmallThumbnail: "/b-small.webp" };
      }
      if (where.collectionId === "grandchild-a") {
        return { id: "item-a", imageLargeThumbnail: "/a.webp", image: null, imageSmallThumbnail: null };
      }
      return null;
    });
    mocks.collectionFindMany.mockImplementation(async ({ where }: { where: { parentId: string } }) => {
      if (where.parentId === "root") return [
        { id: "child-a", title: "Alpha" },
        { id: "child-b", title: "Beta" },
      ];
      if (where.parentId === "child-a") return [{ id: "grandchild-a", title: "Nested" }];
      return [];
    });

    const preview = await resolvePublicCollectionSocialPreview("root");

    expect(preview?.imageUrl).toBe("/b.webp");
    expect(mocks.itemFindFirst.mock.calls.map(([query]) => query.where.collectionId)).toEqual([
      "root",
      "child-a",
      "child-b",
    ]);
    expect(mocks.collectionFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { parentId: "root", finalVisibility: "public" },
      orderBy: [{ title: "asc" }, { id: "asc" }],
    }));
  });

  it("stops cycles and returns a generated fallback", async () => {
    mocks.collectionFindFirst.mockResolvedValue({ id: "root", title: "", color: "invalid", image: null });
    mocks.itemFindFirst.mockResolvedValue(null);
    mocks.collectionFindMany.mockImplementation(async ({ where }: { where: { parentId: string } }) => {
      if (where.parentId === "root") return [{ id: "child", title: "Child" }];
      if (where.parentId === "child") return [{ id: "root", title: "Root again" }];
      return [];
    });

    const first = await resolvePublicCollectionSocialPreview("root");
    const second = await resolvePublicCollectionSocialPreview("root");

    expect(first).toMatchObject({
      color: "#6366F1",
      initials: "ST",
      imageUrl: null,
      imageSource: "fallback",
    });
    expect(second?.fingerprint).toBe(first?.fingerprint);
    expect(mocks.itemFindFirst).toHaveBeenCalledTimes(4);
  });
});

describe("collection preview formatting", () => {
  it("normalizes colors and limits initials to two words", () => {
    expect(normalizeCollectionPreviewColor(" #0a1B2c ")).toBe("#0A1B2C");
    expect(normalizeCollectionPreviewColor("f0a")).toBe("#FF00AA");
    expect(normalizeCollectionPreviewColor("nope")).toBe("#6366F1");
    expect(getCollectionPreviewInitials("  La grande collezione ")).toBe("LG");
  });
});
