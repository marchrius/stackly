"use server";

import { prisma, type Prisma } from "@stackly/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { computeFinalVisibility, syncCollectionDescendantsVisibility } from "@/lib/collections-tree";
import { datumColumnKey, normalizeQuickEditValue, QUICK_EDIT_UNSUPPORTED_TYPES } from "@/lib/quick-edit";

const cellSchema = z.object({ key: z.string().min(1), value: z.string().max(10000) });
const rowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  color: z.union([z.string().regex(/^#?[0-9a-fA-F]{6}$/), z.literal("")]).nullable().optional(),
  quantity: z.coerce.number().int().min(0).max(999999).optional(),
  visibility: z.enum(["public", "internal", "private"]),
  cells: z.array(cellSchema).max(250),
});

export type QuickEditResult = { success: true } | { success: false; error: string };

async function parseRows(payload: string) {
  const parsed = z.array(rowSchema).max(1000).safeParse(JSON.parse(payload));
  if (!parsed.success) throw new Error("invalidPayload");
  return parsed.data;
}

export async function saveQuickEditCollections(parentId: string | null, payload: string): Promise<QuickEditResult> {
  try {
    const session = await requireAuth();
    const rows = await parseRows(payload);
    const existing = await prisma.collection.findMany({
      where: { ownerId: session.user.id, parentId },
      include: { data: { orderBy: { position: "asc" } } },
    });
    if (rows.length !== existing.length || rows.some((row) => !existing.some((entry) => entry.id === row.id))) throw new Error("invalidContext");
    const parentVisibility = parentId
      ? (await prisma.collection.findFirst({ where: { id: parentId, ownerId: session.user.id }, select: { finalVisibility: true } }))?.finalVisibility
      : "public";
    if (!parentVisibility) throw new Error("invalidContext");

    const prototypes = new Map(existing.flatMap((entry) => entry.data).filter((datum) => datum.label).map((datum) => [datumColumnKey(datum.label!), datum]));
    const visibilityChanges: Array<{ id: string; finalVisibility: string }> = [];

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const entity = existing.find((entry) => entry.id === row.id)!;
        const finalVisibility = computeFinalVisibility(row.visibility, parentVisibility);
        await tx.collection.update({ where: { id: row.id }, data: { title: row.name, color: row.color?.replace(/^#/, "") || null, visibility: row.visibility, parentVisibility, finalVisibility, updatedAt: new Date() } });
        await syncCells(tx, entity.data, prototypes, row.cells, { collectionId: row.id, itemId: null }, finalVisibility);
        await tx.log.create({ data: { type: "update", loggedAt: new Date(), objectId: row.id, objectLabel: row.name, objectClass: "Collection", ownerId: session.user.id } });
        if (entity.finalVisibility !== finalVisibility) visibilityChanges.push({ id: row.id, finalVisibility });
      }
    });
    for (const change of visibilityChanges) await syncCollectionDescendantsVisibility(session.user.id, change.id, change.finalVisibility);
    revalidatePath("/collections");
    if (parentId) revalidatePath(`/collections/${parentId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "saveFailed" };
  }
}

export async function saveQuickEditItems(collectionId: string, payload: string): Promise<QuickEditResult> {
  try {
    const session = await requireAuth();
    const rows = await parseRows(payload);
    const collection = await prisma.collection.findFirst({ where: { id: collectionId, ownerId: session.user.id }, select: { finalVisibility: true } });
    if (!collection) throw new Error("invalidContext");
    const existing = await prisma.item.findMany({ where: { ownerId: session.user.id, collectionId }, include: { data: { orderBy: { position: "asc" } } } });
    if (rows.length !== existing.length || rows.some((row) => !existing.some((entry) => entry.id === row.id))) throw new Error("invalidContext");
    const prototypes = new Map(existing.flatMap((entry) => entry.data).filter((datum) => datum.label).map((datum) => [datumColumnKey(datum.label!), datum]));

    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const entity = existing.find((entry) => entry.id === row.id)!;
        const finalVisibility = computeFinalVisibility(row.visibility, collection.finalVisibility);
        await tx.item.update({ where: { id: row.id }, data: { name: row.name, quantity: row.quantity ?? entity.quantity, visibility: row.visibility, parentVisibility: collection.finalVisibility, finalVisibility, updatedAt: new Date() } });
        await syncCells(tx, entity.data, prototypes, row.cells, { itemId: row.id, collectionId: null }, finalVisibility);
        await tx.log.create({ data: { type: "update", loggedAt: new Date(), objectId: row.id, objectLabel: row.name, objectClass: "Item", ownerId: session.user.id } });
      }
    });
    revalidatePath(`/collections/${collectionId}`);
    revalidatePath(`/collections/${collectionId}/items`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "saveFailed" };
  }
}

type Transaction = Prisma.TransactionClient;
type DatumRow = Awaited<ReturnType<typeof prisma.datum.findFirst>> & {};

async function syncCells(
  tx: Transaction,
  existingData: NonNullable<DatumRow>[],
  prototypes: Map<string, NonNullable<DatumRow>>,
  cells: Array<{ key: string; value: string }>,
  relation: { itemId: string | null; collectionId: string | null },
  entityFinalVisibility: string,
) {
  const existingByKey = new Map(existingData.filter((datum) => datum.label).map((datum) => [datumColumnKey(datum.label!), datum]));
  for (const cell of cells) {
    const prototype = prototypes.get(cell.key);
    if (!prototype || QUICK_EDIT_UNSUPPORTED_TYPES.has(prototype.type)) continue;
    const existing = existingByKey.get(cell.key);
    const value = normalizeQuickEditValue(prototype.type, cell.value);
    if (!value) {
      if (existing) await tx.datum.delete({ where: { id: existing.id } });
      continue;
    }
    if (existing) {
      const finalVisibility = computeFinalVisibility(existing.visibility, entityFinalVisibility);
      await tx.datum.update({ where: { id: existing.id }, data: { value, parentVisibility: entityFinalVisibility, finalVisibility, updatedAt: new Date() } });
      continue;
    }
    const finalVisibility = computeFinalVisibility(prototype.visibility, entityFinalVisibility);
    await tx.datum.create({ data: { ...relation, type: prototype.type, label: prototype.label, value, displayMode: prototype.displayMode, position: prototype.position, currency: prototype.currency, visibility: prototype.visibility, parentVisibility: entityFinalVisibility, finalVisibility, choiceListId: prototype.choiceListId } });
  }
}
