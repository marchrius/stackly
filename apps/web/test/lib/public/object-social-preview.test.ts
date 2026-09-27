import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ album: vi.fn(), item: vi.fn(), wishlist: vi.fn() }));
vi.mock("@/lib/public/public-queries", () => ({
  getPublicAlbum: mocks.album, getPublicItem: mocks.item, getPublicWishlist: mocks.wishlist,
}));
import { buildObjectSocialMetadata, isPublicObjectKind, resolveObjectSocialPreview } from "@/lib/public/object-social-preview";

beforeEach(() => vi.resetAllMocks());

describe("public object social previews", () => {
  it.each(["items", "albums", "wishlists"] as const)("does not expose missing/private %s", async (kind) => {
    mocks.album.mockResolvedValue(null);
    mocks.item.mockResolvedValue(null);
    mocks.wishlist.mockResolvedValue(null);
    expect(await resolveObjectSocialPreview(kind, "private")).toBeNull();
    expect(buildObjectSocialMetadata(kind, "private", null).openGraph).toBeUndefined();
  });

  it("uses the large item thumbnail and falls back to initials", async () => {
    mocks.item.mockResolvedValue({ name: "My item", imageLargeThumbnail: "user/large.jpg", image: "user/original.jpg" });
    expect(await resolveObjectSocialPreview("items", "i1")).toMatchObject({ imageUrl: "/uploads/user/large.jpg", initials: "MI" });
    mocks.item.mockResolvedValue({ name: "My item", image: null });
    expect(await resolveObjectSocialPreview("items", "i1")).toMatchObject({ imageSource: "fallback", imageUrl: null });
  });

  it.each(["albums", "wishlists"] as const)("finds descendant images in %s and protects against cycles", async (kind) => {
    const mock = kind === "albums" ? mocks.album : mocks.wishlist;
    const entries = kind === "albums" ? "photos" : "wishes";
    mock.mockImplementation(async (id: string) => ({
      title: "Album", name: "Wishlist", image: null, color: "#123456",
      [entries]: id === "child" ? [{ image: "user/photo.jpg" }] : [],
      children: [{ id: id === "root" ? "child" : "root" }],
    }));
    expect(await resolveObjectSocialPreview(kind, "root")).toMatchObject({ imageUrl: "/uploads/user/photo.jpg" });
    mock.mockResolvedValue({ title: "Empty", name: "Empty", image: null, [entries]: [], children: [{ id: "root" }] });
    expect(await resolveObjectSocialPreview(kind, "root")).toMatchObject({ imageSource: "fallback" });
  });

  it.each(["items", "albums", "wishlists"] as const)("builds bounded metadata and versioned JPEG URLs for %s", (kind) => {
    const metadata = buildObjectSocialMetadata(kind, "id", {
      collectionId: "id", title: "📚".repeat(200), contextualTitle: "Vol. 1 - GTO - Manga", color: "#123456", initials: "A", imageUrl: null, imageSource: "fallback", fingerprint: "v2",
    });
    expect(Array.from(metadata.description!).length).toBeLessThanOrEqual(125);
    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.description).toBe(metadata.description);
    expect(metadata.title).toEqual({ absolute: "Vol. 1 - GTO - Manga" });
    expect(metadata.openGraph?.title).toBe("Vol. 1 - GTO - Manga");
    expect(metadata.twitter?.title).toBe("Vol. 1 - GTO - Manga");
    expect(metadata.openGraph?.images).toEqual([expect.objectContaining({ type: "image/jpeg", width: 1200, height: 630, url: expect.stringContaining(`/previews/${kind}/id?v=v2`) })]);
  });

  it("rejects unknown kinds including inherited object properties", () => {
    expect(isPublicObjectKind("items")).toBe(true);
    expect(isPublicObjectKind("constructor")).toBe(false);
  });
});
