import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  TreeValidationError,
} from "./collections-tree";

export { computeFinalVisibility, deleteUploadImageVariants, TreeValidationError };

interface ResolveAlbumParentInput {
  ownerId: string;
  parentId?: string | null;
  currentAlbumId?: string;
}

interface ResolveAlbumParentOutput {
  parentId: string | null;
  parentVisibility: string;
}

export async function resolveAlbumParent({
  ownerId,
  parentId,
  currentAlbumId,
}: ResolveAlbumParentInput): Promise<ResolveAlbumParentOutput> {
  if (!parentId) return { parentId: null, parentVisibility: "public" };

  if (currentAlbumId && parentId === currentAlbumId) {
    throw new TreeValidationError("Un album non può essere padre di se stesso", 400);
  }

  const parent = await prisma.album.findFirst({
    where: { id: parentId, ownerId },
    select: { id: true, finalVisibility: true, parentId: true },
  });

  if (!parent) {
    throw new TreeValidationError("Album padre non trovato o non autorizzato", 403);
  }

  if (currentAlbumId) {
    let cursorParentId = parent.parentId;
    while (cursorParentId) {
      if (cursorParentId === currentAlbumId) {
        throw new TreeValidationError(
          "Operazione non valida: ciclo nella gerarchia album",
          400,
        );
      }
      const ancestor = await prisma.album.findFirst({
        where: { id: cursorParentId, ownerId },
        select: { parentId: true },
      });
      cursorParentId = ancestor?.parentId ?? null;
    }
  }

  return { parentId: parent.id, parentVisibility: parent.finalVisibility };
}

export async function syncAlbumDescendantsVisibility(
  ownerId: string,
  parentAlbumId: string,
  parentFinalVisibility: string,
): Promise<void> {
  const children = await prisma.album.findMany({
    where: { ownerId, parentId: parentAlbumId },
    select: { id: true, visibility: true, finalVisibility: true, parentVisibility: true },
  });

  for (const child of children) {
    const nextFinal = computeFinalVisibility(child.visibility, parentFinalVisibility);

    if (child.parentVisibility !== parentFinalVisibility || child.finalVisibility !== nextFinal) {
      await prisma.album.update({
        where: { id: child.id },
        data: {
          parentVisibility: parentFinalVisibility,
          finalVisibility: nextFinal,
          updatedAt: new Date(),
        },
      });
    }

    // Propagate to photos inside this child album
    await prisma.photo.updateMany({
      where: { albumId: child.id },
      data: { parentVisibility: nextFinal, finalVisibility: nextFinal },
    });

    await syncAlbumDescendantsVisibility(ownerId, child.id, nextFinal);
  }
}

export async function getAlbumAncestors(
  ownerId: string,
  parentId: string | null,
): Promise<{ id: string; title: string }[]> {
  const chain: { id: string; title: string }[] = [];
  let cursor = parentId;

  while (cursor) {
    const node = await prisma.album.findFirst({
      where: { id: cursor, ownerId },
      select: { id: true, title: true, parentId: true },
    });
    if (!node) break;
    chain.unshift({ id: node.id, title: node.title });
    cursor = node.parentId;
  }

  return chain;
}

