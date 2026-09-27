import { createHash } from "node:crypto";
import { prisma } from "@stackly/db";
import { getUploadUrl } from "@stackly/lib";
import { getPublicSocialTitle } from "./social-title";

const PUBLIC_VISIBILITY = "public";
const DEFAULT_COLLECTION_COLOR = "#6366F1";

type PreviewImageSource = "collection" | "item" | "fallback";

export type PublicCollectionSocialPreview = {
  collectionId: string;
  title: string;
  contextualTitle?: string;
  color: string;
  initials: string;
  imageUrl: string | null;
  imageSource: PreviewImageSource;
  fingerprint: string;
};

type PublicCollectionNode = {
  id: string;
  title: string;
};

type PublicItemImage = {
  id: string;
  imageLargeThumbnail: string | null;
  image: string | null;
  imageSmallThumbnail: string | null;
};

export function normalizeCollectionPreviewColor(color: string | null | undefined): string {
  const value = color?.trim().replace(/^#/, "") ?? "";
  if (/^[0-9a-f]{3}$/i.test(value)) {
    return `#${value.split("").map((character) => character.repeat(2)).join("").toUpperCase()}`;
  }
  if (/^[0-9a-f]{6}$/i.test(value)) return `#${value.toUpperCase()}`;
  return DEFAULT_COLLECTION_COLOR;
}

export function getCollectionPreviewInitials(title: string): string {
  const words = title.trim().split(/\s+/u).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => Array.from(word)[0]?.toLocaleUpperCase()).join("");
  return initials || "ST";
}

function selectItemImage(item: PublicItemImage | null): string | null {
  const image = item?.imageLargeThumbnail ?? item?.image ?? item?.imageSmallThumbnail ?? null;
  return normalizeStoredImageUrl(image);
}

export function normalizeStoredImageUrl(image: string | null | undefined): string | null {
  if (!image?.trim()) return null;

  try {
    const parsed = new URL(image);
    if (["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(parsed.hostname)) {
      return getUploadUrl(parsed.pathname);
    }
    return image;
  } catch {
    return getUploadUrl(image);
  }
}

function createPreviewFingerprint(input: Omit<PublicCollectionSocialPreview, "fingerprint">): string {
  return createHash("sha256")
    .update(JSON.stringify({
      version: 2,
      collectionId: input.collectionId,
      title: input.title,
      color: input.color,
      initials: input.initials,
      imageUrl: input.imageUrl,
      imageSource: input.imageSource,
    }))
    .digest("hex")
    .slice(0, 16);
}

async function findFirstPublicItemImage(collectionId: string): Promise<PublicItemImage | null> {
  return prisma.item.findFirst({
    where: {
      collectionId,
      finalVisibility: PUBLIC_VISIBILITY,
      OR: [
        { imageLargeThumbnail: { not: null } },
        { image: { not: null } },
        { imageSmallThumbnail: { not: null } },
      ],
    },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      imageLargeThumbnail: true,
      image: true,
      imageSmallThumbnail: true,
    },
  });
}

async function findPublicChildren(parentId: string): Promise<PublicCollectionNode[]> {
  return prisma.collection.findMany({
    where: { parentId, finalVisibility: PUBLIC_VISIBILITY },
    orderBy: [{ title: "asc" }, { id: "asc" }],
    select: { id: true, title: true },
  });
}

async function findRecursivePublicItemImage(rootId: string): Promise<PublicItemImage | null> {
  const rootItem = await findFirstPublicItemImage(rootId);
  if (rootItem) return rootItem;

  const queue = await findPublicChildren(rootId);
  const visited = new Set([rootId]);

  while (queue.length > 0) {
    const collection = queue.shift();
    if (!collection || visited.has(collection.id)) continue;
    visited.add(collection.id);

    const item = await findFirstPublicItemImage(collection.id);
    if (item) return item;

    const children = await findPublicChildren(collection.id);
    for (const child of children) {
      if (!visited.has(child.id)) queue.push(child);
    }
  }

  return null;
}

export async function resolvePublicCollectionSocialPreview(
  id: string,
): Promise<PublicCollectionSocialPreview | null> {
  const collection = await prisma.collection.findFirst({
    where: { id, finalVisibility: PUBLIC_VISIBILITY },
    select: { id: true, title: true, color: true, image: true, parentId: true },
  });
  if (!collection) return null;

  const color = normalizeCollectionPreviewColor(collection.color);
  const initials = getCollectionPreviewInitials(collection.title);
  const item = collection.image ? null : await findRecursivePublicItemImage(collection.id);
  const imageUrl = normalizeStoredImageUrl(collection.image) ?? selectItemImage(item);
  const imageSource: PreviewImageSource = collection.image
    ? "collection"
    : imageUrl
      ? "item"
      : "fallback";

  const preview = {
    collectionId: collection.id,
    title: collection.title,
    contextualTitle: await getPublicSocialTitle(collection.title, "collections", collection.parentId, collection.id),
    color,
    initials,
    imageUrl,
    imageSource,
  };

  return { ...preview, fingerprint: createPreviewFingerprint(preview) };
}
