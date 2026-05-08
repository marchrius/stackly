import { describe, expect, it } from "vitest";
import { buildItemMediaEntries, getDisplayData, mergeRelatedItems } from "@/lib/item-detail";

describe("item detail helpers", () => {
  it("builds a media gallery from the main image plus image/video datum entries", () => {
    const entries = buildItemMediaEntries({
      id: "item-1",
      name: "Watchmen",
      image: "covers/watchmen.jpg",
      imageSmallThumbnail: "covers/watchmen_small.jpg",
      imageLargeThumbnail: "covers/watchmen_large.jpg",
      data: [
        { id: "d1", type: "image", label: "Back cover", image: "covers/back.jpg", imageSmallThumbnail: "covers/back_small.jpg", video: null },
        { id: "d2", type: "video", label: "Trailer", image: null, imageSmallThumbnail: null, video: "videos/trailer.mp4" },
        { id: "d3", type: "text", label: "Author", image: null, imageSmallThumbnail: null, video: null },
      ],
    });

    expect(entries).toEqual([
      {
        id: "item-item-1",
        label: "main",
        kind: "image",
        src: "/uploads/covers/watchmen_large.jpg",
        thumbnailSrc: "/uploads/covers/watchmen_small.jpg",
      },
      {
        id: "d1",
        label: "Back cover",
        kind: "image",
        src: "/uploads/covers/back.jpg",
        thumbnailSrc: "/uploads/covers/back_small.jpg",
      },
      {
        id: "d2",
        label: "Trailer",
        kind: "video",
        src: "/uploads/videos/trailer.mp4",
        thumbnailSrc: null,
      },
    ]);
  });

  it("does not duplicate the uploads prefix for migrated legacy paths", () => {
    const entries = buildItemMediaEntries({
      id: "item-1",
      name: "Watchmen",
      image: "uploads/covers/watchmen.jpg",
      imageSmallThumbnail: "public/uploads/covers/watchmen_small.jpg",
      imageLargeThumbnail: "/uploads/covers/watchmen_large.jpg",
      data: [],
    });

    expect(entries[0]).toMatchObject({
      src: "/uploads/covers/watchmen_large.jpg",
      thumbnailSrc: "/uploads/covers/watchmen_small.jpg",
    });
  });

  it("filters out media datum entries from the textual display block", () => {
    const data = getDisplayData([
      { id: "d1", type: "text" },
      { id: "d2", type: "image" },
      { id: "d3", type: "video" },
      { id: "d4", type: "section" },
      { id: "d5", type: "sign" },
    ]);

    expect(data).toEqual([
      { id: "d1", type: "text" },
      { id: "d4", type: "section" },
    ]);
  });

  it("deduplicates and sorts related items", () => {
    expect(
      mergeRelatedItems(
        [
          { id: "b", name: "Batman", imageSmallThumbnail: null },
          { id: "a", name: "Akira", imageSmallThumbnail: null },
        ],
        [
          { id: "a", name: "Akira", imageSmallThumbnail: null },
          { id: "c", name: "Corto Maltese", imageSmallThumbnail: null },
        ],
      ),
    ).toEqual([
      { id: "a", name: "Akira", imageSmallThumbnail: null },
      { id: "b", name: "Batman", imageSmallThumbnail: null },
      { id: "c", name: "Corto Maltese", imageSmallThumbnail: null },
    ]);
  });
});
