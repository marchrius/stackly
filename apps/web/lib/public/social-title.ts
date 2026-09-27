import { prisma } from "@stackly/db";

type ContainerKind = "collections" | "albums" | "wishlists";

/** Nearest public parent first, at most two levels. Stop at private boundaries. */
export async function getPublicSocialTitle(
  title: string,
  kind: ContainerKind,
  parentId: string | null | undefined,
  selfId?: string,
): Promise<string> {
  const parts = [title.trim()];
  const visited = new Set(selfId ? [selfId] : []);
  let cursor = parentId;
  for (let level = 0; level < 2 && cursor && !visited.has(cursor); level++) {
    visited.add(cursor);
    const where = { id: cursor, finalVisibility: "public" };
    const node = kind === "wishlists"
      ? await prisma.wishlist.findFirst({ where, select: { name: true, parentId: true } })
      : kind === "albums"
        ? await prisma.album.findFirst({ where, select: { title: true, parentId: true } })
        : await prisma.collection.findFirst({ where, select: { title: true, parentId: true } });
    if (!node) break;
    const name = ("title" in node ? node.title : node.name).trim();
    if (name) parts.push(name);
    cursor = node.parentId;
  }
  return parts.filter(Boolean).join(" - ");
}
