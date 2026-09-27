import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ collection: vi.fn(), album: vi.fn(), wishlist: vi.fn() }));
vi.mock("@stackly/db", () => ({ prisma: {
  collection: { findFirst: mocks.collection },
  album: { findFirst: mocks.album },
  wishlist: { findFirst: mocks.wishlist },
} }));
import { getPublicSocialTitle } from "@/lib/public/social-title";

beforeEach(() => vi.resetAllMocks());

describe("public contextual titles", () => {
  it("adds exactly two levels to an item, nearest parent first", async () => {
    mocks.collection.mockResolvedValueOnce({ title: "GTO", parentId: "manga" })
      .mockResolvedValueOnce({ title: "Manga", parentId: "library" });
    expect(await getPublicSocialTitle("Vol. 1 ", "collections", "gto")).toBe("Vol. 1 - GTO - Manga");
    expect(mocks.collection).toHaveBeenCalledTimes(2);
    expect(mocks.collection).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "gto", finalVisibility: "public" } }));
  });

  it("adds one parent to a collection", async () => {
    mocks.collection.mockResolvedValue({ title: "Manga", parentId: null });
    expect(await getPublicSocialTitle("GTO", "collections", "manga", "gto")).toBe("GTO - Manga");
  });

  it.each(["albums", "wishlists"] as const)("uses the hierarchy for %s", async (kind) => {
    const mock = kind === "albums" ? mocks.album : mocks.wishlist;
    mock.mockResolvedValue(kind === "albums" ? { title: "Viaggi", parentId: null } : { name: "Manga", parentId: null });
    expect(await getPublicSocialTitle("Giappone", kind, "parent")).toBe(kind === "albums" ? "Giappone - Viaggi" : "Giappone - Manga");
  });

  it("does not disclose private parents or continue beyond them", async () => {
    mocks.collection.mockResolvedValue(null);
    expect(await getPublicSocialTitle("Vol. 1", "collections", "private")).toBe("Vol. 1");
    expect(mocks.collection).toHaveBeenCalledTimes(1);
  });

  it("handles roots and cycles without repeated titles", async () => {
    expect(await getPublicSocialTitle(" GTO ", "collections", null)).toBe("GTO");
    mocks.collection.mockResolvedValue({ title: "Manga", parentId: "gto" });
    expect(await getPublicSocialTitle("GTO", "collections", "manga", "gto")).toBe("GTO - Manga");
    expect(mocks.collection).toHaveBeenCalledTimes(1);
  });
});
