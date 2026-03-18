"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const collectionSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio").max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.string().optional().nullable(),
  itemsDefaultTemplateId: z.string().optional().nullable(),
});

export async function createCollection(formData: FormData) {
  const session = await requireAuth();

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, itemsDefaultTemplateId } = parsed.data;

  let parentVisibility = "public";
  if (parentId) {
    const parent = await prisma.collection.findUnique({ where: { id: parentId } });
    parentVisibility = parent?.finalVisibility ?? "public";
  }

  const collection = await prisma.collection.create({
    data: {
      title,
      color: color || null,
      visibility,
      parentVisibility,
      finalVisibility: computeFinalVisibility(visibility, parentVisibility),
      parentId: parentId || null,
      itemsDefaultTemplateId: itemsDefaultTemplateId || null,
      ownerId: session.user.id,
    },
  });

  await logAction(session.user.id, "create", collection.id, collection.title, "Collection");

  revalidatePath("/collections");
  redirect(`/collections/${collection.id}`);
}

export async function updateCollection(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Collezione non trovata");

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, itemsDefaultTemplateId } = parsed.data;

  const collection = await prisma.collection.update({
    where: { id },
    data: {
      title,
      color: color || null,
      visibility,
      parentId: parentId || null,
      itemsDefaultTemplateId: itemsDefaultTemplateId || null,
      updatedAt: new Date(),
    },
  });

  await logAction(session.user.id, "update", collection.id, collection.title, "Collection");

  revalidatePath(`/collections/${id}`);
  revalidatePath("/collections");
  redirect(`/collections/${id}`);
}

export async function deleteCollection(id: string) {
  const session = await requireAuth();

  const collection = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!collection) throw new Error("Collezione non trovata");

  await prisma.collection.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, collection.title, "Collection");

  revalidatePath("/collections");
  redirect("/collections");
}

// ─── Helper ──────────────────────────────────────────────────────────────────

function computeFinalVisibility(own: string, parent: string): string {
  const order = ["public", "internal", "private"];
  return order[Math.max(order.indexOf(own), order.indexOf(parent))] ?? "private";
}

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}

