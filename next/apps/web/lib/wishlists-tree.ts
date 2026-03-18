import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  TreeValidationError,
} from "./collections-tree";

export { computeFinalVisibility, deleteUploadImageVariants, TreeValidationError };

interface ResolveWishlistParentInput {
  ownerId: string;
  parentId?: string | null;
  currentWishlistId?: string;
}

interface ResolveWishlistParentOutput {
  parentId: string | null;
  parentVisibility: string;
}

export async function resolveWishlistParent({
  ownerId,
  parentId,
  currentWishlistId,
}: ResolveWishlistParentInput): Promise<ResolveWishlistParentOutput> {
  if (!parentId) return { parentId: null, parentVisibility: "public" };

  if (currentWishlistId && parentId === currentWishlistId) {
    throw new TreeValidationError("Una wishlist non può essere padre di se stessa", 400);
  }

  const parent = await prisma.wishlist.findFirst({
    where: { id: parentId, ownerId },
    select: { id: true, finalVisibility: true, parentId: true },
  });

  if (!parent) {
    throw new TreeValidationError("Wishlist padre non trovata o non autorizzata", 403);
  }

  if (currentWishlistId) {
    let cursorParentId = parent.parentId;
    while (cursorParentId) {
      if (cursorParentId === currentWishlistId) {
        throw new TreeValidationError(
          "Operazione non valida: ciclo nella gerarchia wishlist",
          400,
        );
      }

      const ancestor = await prisma.wishlist.findFirst({
        where: { id: cursorParentId, ownerId },
        select: { parentId: true },
      });

      cursorParentId = ancestor?.parentId ?? null;
    }
  }

  return { parentId: parent.id, parentVisibility: parent.finalVisibility };
}

export async function syncWishlistDescendantsVisibility(
  ownerId: string,
  parentWishlistId: string,
  parentFinalVisibility: string,
): Promise<void> {
  const children = await prisma.wishlist.findMany({
    where: { ownerId, parentId: parentWishlistId },
    select: { id: true, visibility: true, finalVisibility: true, parentVisibility: true },
  });

  for (const child of children) {
    const nextFinalVisibility = computeFinalVisibility(child.visibility, parentFinalVisibility);

    if (child.parentVisibility !== parentFinalVisibility || child.finalVisibility !== nextFinalVisibility) {
      await prisma.wishlist.update({
        where: { id: child.id },
        data: {
          parentVisibility: parentFinalVisibility,
          finalVisibility: nextFinalVisibility,
          updatedAt: new Date(),
        },
      });
    }

    await prisma.wish.updateMany({
      where: { wishlistId: child.id },
      data: { parentVisibility: nextFinalVisibility, finalVisibility: nextFinalVisibility },
    });

    await syncWishlistDescendantsVisibility(ownerId, child.id, nextFinalVisibility);
  }
}

export async function getWishlistAncestors(
  ownerId: string,
  parentId: string | null,
): Promise<{ id: string; name: string }[]> {
  const chain: { id: string; name: string }[] = [];
  let cursor = parentId;

  while (cursor) {
    const node = await prisma.wishlist.findFirst({
      where: { id: cursor, ownerId },
      select: { id: true, name: true, parentId: true },
    });

    if (!node) break;

    chain.unshift({ id: node.id, name: node.name });
    cursor = node.parentId;
  }

  return chain;
}

