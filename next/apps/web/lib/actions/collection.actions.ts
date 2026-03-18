"use server";

import { requireAuth } from "@/lib/auth-utils";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  resolveCollectionParent,
  syncCollectionDescendantsVisibility,
  TreeValidationError,
} from "@/lib/collections-tree";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const collectionSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio").max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  itemsDefaultTemplateId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  image: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
});

export async function createCollection(formData: FormData) {
  const session = await requireAuth();

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, itemsDefaultTemplateId, image } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
    });

    const collection = await prisma.collection.create({
      data: {
        title,
        color: normalizedColor,
        visibility,
        parentVisibility: parent.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, parent.parentVisibility),
        parentId: parent.parentId,
        itemsDefaultTemplateId: itemsDefaultTemplateId || null,
        image: image || null,
        ownerId: session.user.id,
      },
    });

    await logAction(session.user.id, "create", collection.id, collection.title, "Collection");

    revalidatePath("/collections");
    if (parent.parentId) revalidatePath(`/collections/${parent.parentId}`);
    redirect(`/collections/${collection.id}`);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function updateCollection(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Collezione non trovata");

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, itemsDefaultTemplateId, image, deleteImage } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
      currentCollectionId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const nextImage = deleteImage ? null : image ?? existing.image;

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        title,
        color: normalizedColor,
        visibility,
        parentId: parent.parentId,
        parentVisibility: parent.parentVisibility,
        finalVisibility,
        itemsDefaultTemplateId: itemsDefaultTemplateId || null,
        image: nextImage,
        updatedAt: new Date(),
      },
    });

    if (deleteImage && existing.image) {
      await deleteUploadImageVariants(existing.image);
    }

    if (!deleteImage && image && existing.image && existing.image !== image) {
      await deleteUploadImageVariants(existing.image);
    }

    await syncCollectionDescendantsVisibility(session.user.id, collection.id, finalVisibility);
    await logAction(session.user.id, "update", collection.id, collection.title, "Collection");

    revalidatePath(`/collections/${id}`);
    revalidatePath("/collections");
    if (collection.parentId) revalidatePath(`/collections/${collection.parentId}`);
    if (existing.parentId && existing.parentId !== collection.parentId) {
      revalidatePath(`/collections/${existing.parentId}`);
    }
    redirect(`/collections/${id}`);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function deleteCollection(id: string) {
  const session = await requireAuth();

  const collection = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!collection) throw new Error("Collezione non trovata");

  if (collection.image) {
    await deleteUploadImageVariants(collection.image);
  }

  await prisma.collection.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, collection.title, "Collection");

  revalidatePath("/collections");
  if (collection.parentId) revalidatePath(`/collections/${collection.parentId}`);
  redirect("/collections");
}


async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}

