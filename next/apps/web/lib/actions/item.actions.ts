"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  quantity: z.coerce.number().int().min(1).default(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  collectionId: z.string().optional().nullable(),
});

export async function createItem(formData: FormData) {
  const session = await requireAuth();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, quantity, visibility, collectionId } = parsed.data;

  let parentVisibility = "public";
  if (collectionId) {
    const col = await prisma.collection.findUnique({ where: { id: collectionId } });
    parentVisibility = col?.finalVisibility ?? "public";
  }

  const item = await prisma.item.create({
    data: {
      name,
      quantity,
      visibility,
      parentVisibility,
      finalVisibility: computeFinalVisibility(visibility, parentVisibility),
      collectionId: collectionId || null,
      ownerId: session.user.id,
    },
  });

  await logAction(session.user.id, "create", item.id, item.name, "Item");
  revalidatePath("/collections");
  redirect(`/items/${item.id}`);
}

export async function updateItem(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.item.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Oggetto non trovato");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, quantity, visibility, collectionId } = parsed.data;

  const item = await prisma.item.update({
    where: { id },
    data: { name, quantity, visibility, collectionId: collectionId || null, updatedAt: new Date() },
  });

  await logAction(session.user.id, "update", item.id, item.name, "Item");
  revalidatePath(`/items/${id}`);
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string) {
  const session = await requireAuth();

  const item = await prisma.item.findFirst({ where: { id, ownerId: session.user.id } });
  if (!item) throw new Error("Oggetto non trovato");

  const collectionId = item.collectionId;
  await prisma.item.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, item.name, "Item");

  revalidatePath("/collections");
  if (collectionId) redirect(`/collections/${collectionId}`);
  else redirect("/collections");
}

function computeFinalVisibility(own: string, parent: string): string {
  const order = ["public", "internal", "private"];
  return order[Math.max(order.indexOf(own), order.indexOf(parent))] ?? "private";
}

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}

