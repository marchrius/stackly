"use server";

import { requireAuth } from "@/lib/auth-utils";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  resolveCollectionParent,
  syncCollectionDescendantsVisibility,
  TreeValidationError,
} from "@/lib/collections-tree";
import { syncCollectionDatumEntries, type ManagedCollectionDatumPayload } from "@/lib/collection-persistence";
import { prisma } from "@stackly/db";
import { downloadRemoteAsset, saveUploadedAsset } from "@/lib/server/uploads";
import {
  type DisplayConfigPayload,
  getCollectionDisplayConfigOptions,
  getDefaultDisplayConfig,
  upsertDisplayConfiguration,
} from "@/lib/collection-display-config";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const collectionSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio").max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  itemsDefaultTemplateId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  scrapedFromUrl: z.preprocess((value) => (value === "" ? null : value), z.string().url().optional().nullable()),
  remoteImageUrl: z.preprocess((value) => (value === "" ? null : value), z.string().url().optional().nullable()),
  image: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
});

const datumPayloadSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string(),
  type: z.string().min(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
  displayMode: z.enum(["pill", "list"]).default("list"),
  position: z.number().int().optional(),
  value: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  uploadKey: z.string().nullable().optional(),
});

const datumPayloadListSchema = z.array(datumPayloadSchema);

const displayConfigPayloadSchema = z.object({
  label: z.preprocess((value) => (typeof value === "string" ? value : ""), z.string()),
  displayMode: z.enum(["grid", "list"]).default("grid"),
  sortingProperty: z.preprocess((value) => (value === "" || value == null ? null : value), z.string().nullable()),
  sortingDirection: z.enum(["ASC", "DESC"]).default("ASC"),
  showVisibility: z.boolean().default(true),
  showActions: z.boolean().default(true),
  showNumberOfChildren: z.boolean().default(true),
  showNumberOfItems: z.boolean().default(true),
  showItemQuantities: z.boolean().default(false),
  columns: z.array(z.string()).default([]),
});

export async function createCollection(formData: FormData) {
  const session = await requireAuth();

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const dataPayloadResult = parseDataPayload(formData);
  if (!dataPayloadResult.success) return { error: { dataPayload: ["Invalid collection data payload"] } };

  let hydratedPayload: ManagedCollectionDatumPayload[];
  try {
    hydratedPayload = await hydrateCollectionDatumUploads(formData, dataPayloadResult.data, session.user.id);
  } catch (error) {
    return { error: { dataPayload: [error instanceof Error ? error.message : "Upload failed"] } };
  }
  const childrenDisplayConfig = parseDisplayConfigPayload(formData, "childrenDisplayConfigPayload", "children");
  const itemsDisplayConfig = parseDisplayConfigPayload(formData, "itemsDisplayConfigPayload", "items");
  if (!childrenDisplayConfig.success || !itemsDisplayConfig.success) {
    return { error: { displayConfiguration: ["Invalid display configuration payload"] } };
  }

  const { title, color, visibility, parentId, itemsDefaultTemplateId, scrapedFromUrl, remoteImageUrl, image } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;
  const imageState = await resolveCollectionImageState(formData, session.user.id, undefined, image ?? null, remoteImageUrl ?? null);
  if ("error" in imageState) return { error: { image: [imageState.error] } };

  try {
    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
    });

    const collection = await prisma.$transaction(async (tx) => {
      const displayOptions = await getCollectionDisplayConfigOptions(tx, session.user.id, null);
      const childrenDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        null,
        childrenDisplayConfig.data,
        displayOptions.childrenSortingOptions,
      );
      const itemsDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        null,
        itemsDisplayConfig.data,
        displayOptions.itemsSortingOptions,
      );

      const createdCollection = await tx.collection.create({
        data: {
          title,
          color: normalizedColor,
          visibility,
          parentVisibility: parent.parentVisibility,
          finalVisibility: computeFinalVisibility(visibility, parent.parentVisibility),
          parentId: parent.parentId,
          itemsDefaultTemplateId: itemsDefaultTemplateId || null,
          childrenDisplayConfigId,
          itemsDisplayConfigId,
          scrapedFromUrl: scrapedFromUrl || null,
          image: imageState.image,
          ownerId: session.user.id,
        },
      });

      await syncCollectionDatumEntries(tx, createdCollection.id, createdCollection.finalVisibility, hydratedPayload, []);
      return createdCollection;
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

  const existing = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    include: { data: true, childrenDisplayConfig: true, itemsDisplayConfig: true },
  });
  if (!existing) throw new Error("Collezione non trovata");

  const parsed = collectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const dataPayloadResult = parseDataPayload(formData);
  if (!dataPayloadResult.success) return { error: { dataPayload: ["Invalid collection data payload"] } };

  let hydratedPayload: ManagedCollectionDatumPayload[];
  try {
    hydratedPayload = await hydrateCollectionDatumUploads(formData, dataPayloadResult.data, session.user.id);
  } catch (error) {
    return { error: { dataPayload: [error instanceof Error ? error.message : "Upload failed"] } };
  }
  const childrenDisplayConfig = parseDisplayConfigPayload(formData, "childrenDisplayConfigPayload", "children");
  const itemsDisplayConfig = parseDisplayConfigPayload(formData, "itemsDisplayConfigPayload", "items");
  if (!childrenDisplayConfig.success || !itemsDisplayConfig.success) {
    return { error: { displayConfiguration: ["Invalid display configuration payload"] } };
  }

  const { title, color, visibility, parentId, itemsDefaultTemplateId, scrapedFromUrl, remoteImageUrl, image, deleteImage } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;
  const imageState = await resolveCollectionImageState(formData, session.user.id, existing, image ?? null, remoteImageUrl ?? null);
  if ("error" in imageState) return { error: { image: [imageState.error] } };

  try {
    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
      currentCollectionId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const collection = await prisma.$transaction(async (tx) => {
      const displayOptions = await getCollectionDisplayConfigOptions(tx, session.user.id, id);
      const childrenDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        existing.childrenDisplayConfigId,
        childrenDisplayConfig.data,
        displayOptions.childrenSortingOptions,
      );
      const itemsDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        existing.itemsDisplayConfigId,
        itemsDisplayConfig.data,
        displayOptions.itemsSortingOptions,
      );

      const updatedCollection = await tx.collection.update({
        where: { id },
        data: {
          title,
          color: normalizedColor,
          visibility,
          parentId: parent.parentId,
          parentVisibility: parent.parentVisibility,
          finalVisibility,
          itemsDefaultTemplateId: itemsDefaultTemplateId || null,
          childrenDisplayConfigId,
          itemsDisplayConfigId,
          scrapedFromUrl: scrapedFromUrl || null,
          image: imageState.image,
          updatedAt: new Date(),
        },
      });

      await syncCollectionDatumEntries(tx, updatedCollection.id, updatedCollection.finalVisibility, hydratedPayload, existing.data);
      return updatedCollection;
    });

    if (deleteImage && existing.image) {
      await deleteUploadImageVariants(existing.image);
    }

    if (!deleteImage && imageState.image && existing.image && existing.image !== imageState.image) {
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

function parseDataPayload(formData: FormData) {
  const raw = formData.get("dataPayload");
  if (typeof raw !== "string" || raw.length === 0) {
    return { success: true as const, data: [] as ManagedCollectionDatumPayload[] };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = datumPayloadListSchema.safeParse(parsed);
    if (!result.success) return { success: false as const };
    return { success: true as const, data: result.data };
  } catch {
    return { success: false as const };
  }
}

function parseDisplayConfigPayload(formData: FormData, key: string, kind: "children" | "items") {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.length === 0) {
    return { success: true as const, data: getDefaultDisplayConfig(kind) as DisplayConfigPayload };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = displayConfigPayloadSchema.safeParse(parsed);
    if (!result.success) return { success: false as const };
    return { success: true as const, data: result.data };
  } catch {
    return { success: false as const };
  }
}

async function hydrateCollectionDatumUploads(formData: FormData, payload: ManagedCollectionDatumPayload[], ownerId: string) {
  const hydrated: ManagedCollectionDatumPayload[] = [];

  for (const entry of payload) {
    if (entry.type !== "file") {
      hydrated.push(entry);
      continue;
    }

    const uploadKey = entry.uploadKey;
    const fileValue = uploadKey ? formData.get(uploadKey) : null;
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

    if (!file) {
      hydrated.push(entry);
      continue;
    }

    const stored = await saveUploadedAsset({ file, userId: ownerId, entity: "collections", kind: "file" });
    hydrated.push({
      ...entry,
      file: stored.path,
      originalFilename: stored.originalFilename ?? null,
    });
  }

  return hydrated;
}

async function resolveCollectionImageState(
  formData: FormData,
  ownerId: string,
  existing?: { image: string | null },
  currentImage?: string | null,
  remoteImageUrl?: string | null,
) {
  const deleteImage = formData.get("deleteImage") === "true";
  const fileValue = formData.get("imageFile");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (!file && !remoteImageUrl) {
    if (deleteImage) return { image: null };
    return { image: currentImage ?? existing?.image ?? null };
  }

  try {
    const stored = file
      ? await saveUploadedAsset({ file, userId: ownerId, entity: "collections", kind: "image" })
      : await downloadRemoteAsset({ url: remoteImageUrl!, userId: ownerId, entity: "collections", kind: "image" });
    return { image: stored.smallThumbnail ?? stored.path };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}
