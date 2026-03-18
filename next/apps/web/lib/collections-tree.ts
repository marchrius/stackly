import { rm } from "fs/promises";
import path from "path";
import { prisma } from "@koillection/db";

const VISIBILITY_ORDER = ["public", "internal", "private"] as const;
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const UPLOAD_BASE_DIR = path.resolve(process.cwd(), UPLOAD_DIR);

type Visibility = (typeof VISIBILITY_ORDER)[number];

export class TreeValidationError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "TreeValidationError";
  }
}

export function computeFinalVisibility(ownVisibility: string, parentVisibility: string): Visibility {
  const ownIndex = VISIBILITY_ORDER.indexOf((ownVisibility as Visibility) ?? "private");
  const parentIndex = VISIBILITY_ORDER.indexOf((parentVisibility as Visibility) ?? "private");
  const effectiveIndex = Math.max(ownIndex === -1 ? 2 : ownIndex, parentIndex === -1 ? 2 : parentIndex);
  return VISIBILITY_ORDER[effectiveIndex] ?? "private";
}

interface ResolveParentInput {
  ownerId: string;
  parentId?: string | null;
  currentCollectionId?: string;
}

interface ResolveParentOutput {
  parentId: string | null;
  parentVisibility: string;
}

export async function resolveCollectionParent({
  ownerId,
  parentId,
  currentCollectionId,
}: ResolveParentInput): Promise<ResolveParentOutput> {
  if (!parentId) {
    return { parentId: null, parentVisibility: "public" };
  }

  if (currentCollectionId && parentId === currentCollectionId) {
    throw new TreeValidationError("Una collezione non puo essere padre di se stessa", 400);
  }

  const parent = await prisma.collection.findFirst({
    where: { id: parentId, ownerId },
    select: { id: true, finalVisibility: true, parentId: true },
  });

  if (!parent) {
    throw new TreeValidationError("Collezione padre non trovata o non autorizzata", 403);
  }

  if (currentCollectionId) {
    let cursorParentId = parent.parentId;
    while (cursorParentId) {
      if (cursorParentId === currentCollectionId) {
        throw new TreeValidationError("Operazione non valida: ciclo nella gerarchia collezioni", 400);
      }

      const ancestor = await prisma.collection.findFirst({
        where: { id: cursorParentId, ownerId },
        select: { parentId: true },
      });

      cursorParentId = ancestor?.parentId ?? null;
    }
  }

  return {
    parentId: parent.id,
    parentVisibility: parent.finalVisibility,
  };
}

export interface Ancestor {
  id: string;
  title: string;
}

export async function getCollectionAncestors(ownerId: string, parentId: string | null): Promise<Ancestor[]> {
  const chain: Ancestor[] = [];
  let cursor = parentId;

  while (cursor) {
    const node = await prisma.collection.findFirst({
      where: { id: cursor, ownerId },
      select: { id: true, title: true, parentId: true },
    });

    if (!node) break;

    chain.unshift({ id: node.id, title: node.title });
    cursor = node.parentId;
  }

  return chain;
}

export async function syncCollectionDescendantsVisibility(
  ownerId: string,
  parentId: string,
  parentFinalVisibility: string,
): Promise<void> {
  const children = await prisma.collection.findMany({
    where: { ownerId, parentId },
    select: { id: true, visibility: true, finalVisibility: true, parentVisibility: true },
  });

  for (const child of children) {
    const nextFinalVisibility = computeFinalVisibility(child.visibility, parentFinalVisibility);

    if (child.parentVisibility !== parentFinalVisibility || child.finalVisibility !== nextFinalVisibility) {
      await prisma.collection.update({
        where: { id: child.id },
        data: {
          parentVisibility: parentFinalVisibility,
          finalVisibility: nextFinalVisibility,
          updatedAt: new Date(),
        },
      });
    }

    await syncCollectionDescendantsVisibility(ownerId, child.id, nextFinalVisibility);
  }
}

function resolveUploadPath(relativePath: string): string {
  const normalized = relativePath.replace(/^\/+/, "");
  const absolute = path.resolve(UPLOAD_BASE_DIR, normalized);

  if (!absolute.startsWith(UPLOAD_BASE_DIR)) {
    throw new Error("Percorso upload non valido");
  }

  return absolute;
}

function getImageVariantPaths(relativePath: string): string[] {
  const ext = path.extname(relativePath);
  const withoutExt = relativePath.slice(0, relativePath.length - ext.length);

  if (withoutExt.endsWith("_small")) {
    const base = withoutExt.slice(0, -"_small".length);
    return [relativePath, `${base}_large${ext}`, `${base}${ext}`];
  }

  if (withoutExt.endsWith("_large")) {
    const base = withoutExt.slice(0, -"_large".length);
    return [relativePath, `${base}_small${ext}`, `${base}${ext}`];
  }

  return [relativePath, `${withoutExt}_small${ext}`, `${withoutExt}_large${ext}`];
}

export async function deleteUploadImageVariants(relativePath?: string | null): Promise<void> {
  if (!relativePath) return;

  const targets = getImageVariantPaths(relativePath);

  await Promise.all(
    targets.map(async (target) => {
      try {
        await rm(resolveUploadPath(target), { force: true });
      } catch {
        // Ignore cleanup errors to avoid blocking domain updates.
      }
    }),
  );
}

