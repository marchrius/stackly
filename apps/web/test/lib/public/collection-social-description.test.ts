import { describe, expect, it } from "vitest";
import { getCollectionSocialDescription } from "@/lib/public/collection-social-description";

describe("collection social description", () => {
  it("preserves a short title and normalizes whitespace", () => {
    expect(getCollectionSocialDescription("  Manga\n collection ")).toBe(
      "Explore Manga collection on Stackly. Discover the items and details in this public collection.",
    );
  });

  it.each(["a".repeat(200), "📚".repeat(200)])("limits long titles without breaking Unicode", (title) => {
    const description = getCollectionSocialDescription(title);
    expect(Array.from(description).length).toBeLessThanOrEqual(125);
    expect(description).toContain("… on Stackly.");
    expect(description).not.toContain("\uFFFD");
  });

  it("provides a fallback for empty titles", () => {
    expect(getCollectionSocialDescription(" ")).toContain("Explore this collection on Stackly.");
  });
});
