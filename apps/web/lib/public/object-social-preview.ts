import { createHash } from "node:crypto";
import type { Metadata } from "next";
import { getPublicAlbum, getPublicItem, getPublicWishlist } from "./public-queries";
import { getCollectionPreviewInitials, normalizeCollectionPreviewColor, normalizeStoredImageUrl, type PublicCollectionSocialPreview } from "./collection-social-preview";
import { resolvePublicUrl } from "@/lib/public-app-url";
import { getPublicSocialTitle } from "./social-title";

export const objectLabels = { items: "Public item", albums: "Public album", wishlists: "Public wishlist" } as const;
export type PublicObjectKind = keyof typeof objectLabels;
export function isPublicObjectKind(value: string): value is PublicObjectKind {
  return Object.prototype.hasOwnProperty.call(objectLabels, value);
}

// Traverse only public nodes, with cycle protection for malformed hierarchies.
async function findImage(kind: "albums" | "wishlists", id: string, visited = new Set<string>()): Promise<string | null> {
  if (visited.has(id)) return null;
  visited.add(id);
  const node = kind === "albums" ? await getPublicAlbum(id) : await getPublicWishlist(id);
  if (!node) return null;
  if (node.image) return node.image;
  const entries = "photos" in node ? node.photos : node.wishes;
  for (const entry of entries) {
    if (entry.image || entry.imageSmallThumbnail) return entry.image || entry.imageSmallThumbnail;
  }
  for (const child of node.children) {
    const image = await findImage(kind, child.id, visited);
    if (image) return image;
  }
  return null;
}

export async function resolveObjectSocialPreview(kind: PublicObjectKind, id: string): Promise<PublicCollectionSocialPreview | null> {
  const node = kind === "items" ? await getPublicItem(id)
    : kind === "albums" ? await getPublicAlbum(id) : await getPublicWishlist(id);
  if (!node) return null;
  const title = "title" in node ? node.title : node.name;
  const contextualTitle = kind === "items"
    ? await getPublicSocialTitle(title, "collections", "collectionId" in node ? node.collectionId : null)
    : await getPublicSocialTitle(title, kind, "parentId" in node ? node.parentId : null, id);
  const color = normalizeCollectionPreviewColor("color" in node ? node.color : null);
  const image = kind === "items"
    ? ("imageLargeThumbnail" in node ? node.imageLargeThumbnail : null) || node.image || ("imageSmallThumbnail" in node ? node.imageSmallThumbnail : null)
    : await findImage(kind, id);
  const preview = {
    collectionId: id, title, color, initials: getCollectionPreviewInitials(title),
    contextualTitle,
    imageUrl: normalizeStoredImageUrl(image), imageSource: image ? "item" as const : "fallback" as const,
  };
  return { ...preview, fingerprint: createHash("sha256").update(JSON.stringify({ version: 2, kind, ...preview })).digest("hex").slice(0, 16) };
}

export function buildObjectSocialMetadata(kind: PublicObjectKind, id: string, preview: PublicCollectionSocialPreview | null): Metadata {
  if (!preview) return { title: objectLabels[kind] };
  const suffix = ` on Stackly. Explore this ${objectLabels[kind].toLowerCase()} and its publicly shared details.`;
  const title = Array.from(preview.title.replace(/\s+/gu, " ").trim());
  const budget = 125 - 8 - suffix.length;
  const shortTitle = title.length > budget ? `${title.slice(0, budget - 1).join("").trimEnd()}…` : title.join("");
  const description = `Explore ${shortTitle}${suffix}`;
  const url = resolvePublicUrl(`/public/${kind}/${encodeURIComponent(id)}`);
  const image = resolvePublicUrl(`/api/public/previews/${kind}/${encodeURIComponent(id)}?v=${preview.fingerprint}`);
  const pageTitle = preview.contextualTitle ?? preview.title.trim();
  return {
    title: { absolute: pageTitle }, description, alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Stackly", title: pageTitle, description, url,
      images: [{ url: image, width: 1200, height: 630, type: "image/jpeg", alt: preview.title }] },
    twitter: { card: "summary_large_image", title: pageTitle, description, images: [image] },
  };
}
