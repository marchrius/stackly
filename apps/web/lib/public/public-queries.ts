import { prisma } from "@stackly/db";

export const PUBLIC_VISIBILITY = "public";

const publicDatumInclude = {
  choiceList: { select: { id: true, name: true, displayMode: true, selectionMode: true } },
} as const;

export async function getPublicCollection(id: string) {
  return prisma.collection.findFirst({
    where: { id, finalVisibility: PUBLIC_VISIBILITY },
    include: {
      children: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        include: { _count: { select: { children: true, items: true } } },
        orderBy: { title: "asc" },
      },
      items: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        orderBy: { name: "asc" },
        take: 60,
      },
      data: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        orderBy: { position: "asc" },
        include: publicDatumInclude,
      },
    },
  });
}

export async function getPublicCollectionAncestors(parentId: string | null) {
  const ancestors: { id: string; title: string }[] = [];
  let cursor = parentId;

  while (cursor) {
    const parent = await prisma.collection.findFirst({
      where: { id: cursor, finalVisibility: PUBLIC_VISIBILITY },
      select: { id: true, title: true, parentId: true },
    });
    if (!parent) break;
    ancestors.unshift({ id: parent.id, title: parent.title });
    cursor = parent.parentId;
  }

  return ancestors;
}

export async function getPublicItem(id: string) {
  return prisma.item.findFirst({
    where: { id, finalVisibility: PUBLIC_VISIBILITY },
    include: {
      data: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        orderBy: { position: "asc" },
        include: publicDatumInclude,
      },
      tags: { where: { visibility: PUBLIC_VISIBILITY } },
      collection: { select: { id: true, title: true, finalVisibility: true } },
      relatedItems: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        select: { id: true, name: true, imageSmallThumbnail: true, quantity: true },
      },
      relatedTo: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        select: { id: true, name: true, imageSmallThumbnail: true, quantity: true },
      },
    },
  });
}

export async function getPublicAlbum(id: string) {
  return prisma.album.findFirst({
    where: { id, finalVisibility: PUBLIC_VISIBILITY },
    include: {
      children: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        include: { _count: { select: { children: true, photos: true } } },
        orderBy: { title: "asc" },
      },
      photos: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        orderBy: { createdAt: "desc" },
        take: 80,
      },
    },
  });
}

export async function getPublicAlbumAncestors(parentId: string | null) {
  const ancestors: { id: string; title: string }[] = [];
  let cursor = parentId;

  while (cursor) {
    const parent = await prisma.album.findFirst({
      where: { id: cursor, finalVisibility: PUBLIC_VISIBILITY },
      select: { id: true, title: true, parentId: true },
    });
    if (!parent) break;
    ancestors.unshift({ id: parent.id, title: parent.title });
    cursor = parent.parentId;
  }

  return ancestors;
}

export async function getPublicWishlist(id: string) {
  return prisma.wishlist.findFirst({
    where: { id, finalVisibility: PUBLIC_VISIBILITY },
    include: {
      children: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        include: { _count: { select: { children: true, wishes: true } } },
        orderBy: { name: "asc" },
      },
      wishes: {
        where: { finalVisibility: PUBLIC_VISIBILITY },
        orderBy: { name: "asc" },
      },
      _count: { select: { children: true, wishes: true } },
    },
  });
}

export async function getPublicWishlistAncestors(parentId: string | null) {
  const ancestors: { id: string; name: string }[] = [];
  let cursor = parentId;

  while (cursor) {
    const parent = await prisma.wishlist.findFirst({
      where: { id: cursor, finalVisibility: PUBLIC_VISIBILITY },
      select: { id: true, name: true, parentId: true },
    });
    if (!parent) break;
    ancestors.unshift({ id: parent.id, name: parent.name });
    cursor = parent.parentId;
  }

  return ancestors;
}
