"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { computeFinalVisibility, resolveItemContext, syncDatumEntries, type ManagedDatumPayload } from "@/lib/item-persistence";
import { downloadRemoteAsset, saveUploadedAsset } from "@/lib/server/uploads";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Item name is required").max(255),
  quantity: z.coerce.number().int().min(1).default(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  collectionId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  scrapedFromUrl: z.preprocess((value) => (value === "" ? null : value), z.string().url().optional().nullable()),
  remoteImageUrl: z.preprocess((value) => (value === "" ? null : value), z.string().url().optional().nullable()),
});

const datumPayloadSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string(),
  type: z.string().min(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
  position: z.number().int().optional(),
  value: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  imageSmallThumbnail: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  uploadKey: z.string().nullable().optional(),
  remoteUrl: z.string().nullable().optional(),
});

const datumPayloadListSchema = z.array(datumPayloadSchema);

export async function createItem(formData: FormData) {
  const session = await requireAuth();

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const tagIds = getIds(formData, "tagIds[]");
  const relatedItemIds = getIds(formData, "relatedItemIds[]");
  const dataPayloadResult = parseDataPayload(formData);
  if (!dataPayloadResult.success) return { error: { dataPayload: ["Invalid custom data payload"] } };

  let hydratedPayload: ManagedDatumPayload[];
  try {
    hydratedPayload = await hydrateDatumUploads(formData, dataPayloadResult.data, session.user.id);
  } catch (error) {
    return { error: { dataPayload: [error instanceof Error ? error.message : "Upload failed"] } };
  }

  const { name, quantity, visibility, collectionId, scrapedFromUrl, remoteImageUrl } = parsed.data;
  const imageState = await resolveMainImageState(formData, session.user.id, undefined, remoteImageUrl ?? null);
  if ("error" in imageState) return { error: { image: [imageState.error] } };
  const context = await resolveItemContext(session.user.id, collectionId, tagIds);
  if ("error" in context) return { error: { collectionId: [context.error] } };

  const validatedRelatedItemIds = await validateRelatedItemIds(session.user.id, relatedItemIds);
  if (!validatedRelatedItemIds.success) return { error: { relatedItemIds: [validatedRelatedItemIds.error] } };

  const item = await prisma.$transaction(async (tx) => {
    const createdItem = await tx.item.create({
      data: {
        name,
        quantity,
        visibility,
        parentVisibility: context.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, context.parentVisibility),
        collectionId: collectionId || null,
        ownerId: session.user.id,
        scrapedFromUrl: scrapedFromUrl || null,
        image: imageState.image,
        imageSmallThumbnail: imageState.imageSmallThumbnail,
        imageLargeThumbnail: imageState.imageLargeThumbnail,
        tags: tagIds.length > 0 ? { connect: [...new Set(tagIds)].map((tagId) => ({ id: tagId })) } : undefined,
        relatedItems:
          validatedRelatedItemIds.ids.length > 0
            ? { connect: validatedRelatedItemIds.ids.map((relatedId) => ({ id: relatedId })) }
            : undefined,
      },
    });

    await syncDatumEntries(tx, createdItem.id, createdItem.finalVisibility, hydratedPayload, []);
    return createdItem;
  });

  await logAction(session.user.id, "create", item.id, item.name, "Item");
  revalidateItemPaths(item.id, collectionId ?? null);

  if (formData.get("saveAndAddAnother") === "1") {
    redirect(`/items/new?collectionId=${item.collectionId ?? collectionId ?? ""}`);
  }

  redirect(`/items/${item.id}`);
}

export async function updateItem(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.item.findFirst({
    where: { id, ownerId: session.user.id },
    include: { data: true },
  });
  if (!existing) throw new Error("Item not found");

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const tagIds = getIds(formData, "tagIds[]");
  const relatedItemIds = getIds(formData, "relatedItemIds[]");
  const dataPayloadResult = parseDataPayload(formData);
  if (!dataPayloadResult.success) return { error: { dataPayload: ["Invalid custom data payload"] } };

  let hydratedPayload: ManagedDatumPayload[];
  try {
    hydratedPayload = await hydrateDatumUploads(formData, dataPayloadResult.data, session.user.id);
  } catch (error) {
    return { error: { dataPayload: [error instanceof Error ? error.message : "Upload failed"] } };
  }

  const { name, quantity, visibility, collectionId, scrapedFromUrl, remoteImageUrl } = parsed.data;
  const imageState = await resolveMainImageState(formData, session.user.id, existing, remoteImageUrl ?? null);
  if ("error" in imageState) return { error: { image: [imageState.error] } };
  const context = await resolveItemContext(session.user.id, collectionId, tagIds);
  if ("error" in context) return { error: { collectionId: [context.error] } };

  const validatedRelatedItemIds = await validateRelatedItemIds(session.user.id, relatedItemIds, id);
  if (!validatedRelatedItemIds.success) return { error: { relatedItemIds: [validatedRelatedItemIds.error] } };

  const item = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.item.update({
      where: { id },
      data: {
        name,
        quantity,
        visibility,
        collectionId: collectionId || null,
        parentVisibility: context.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, context.parentVisibility),
        updatedAt: new Date(),
        scrapedFromUrl: scrapedFromUrl || null,
        image: imageState.image,
        imageSmallThumbnail: imageState.imageSmallThumbnail,
        imageLargeThumbnail: imageState.imageLargeThumbnail,
        tags: { set: [...new Set(tagIds)].map((tagId) => ({ id: tagId })) },
        relatedItems: { set: validatedRelatedItemIds.ids.map((relatedId) => ({ id: relatedId })) },
      },
    });

    await syncDatumEntries(tx, updatedItem.id, updatedItem.finalVisibility, hydratedPayload, existing.data);
    return updatedItem;
  });

  await logAction(session.user.id, "update", item.id, item.name, "Item");
  revalidateItemPaths(id, item.collectionId ?? existing.collectionId ?? null, existing.collectionId ?? null);
  redirect(`/items/${id}`);
}

export async function deleteItem(id: string) {
  const session = await requireAuth();

  const item = await prisma.item.findFirst({ where: { id, ownerId: session.user.id } });
  if (!item) throw new Error("Item not found");

  const collectionId = item.collectionId;
  await prisma.item.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, item.name, "Item");

  revalidatePath("/collections");
  if (collectionId) redirect(`/collections/${collectionId}`);
  redirect("/collections");
}

function getIds(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function parseDataPayload(formData: FormData) {
  const raw = formData.get("dataPayload");
  if (typeof raw !== "string" || raw.length === 0) {
    return { success: true as const, data: [] as ManagedDatumPayload[] };
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

async function hydrateDatumUploads(formData: FormData, payload: ManagedDatumPayload[], ownerId: string) {
  const hydrated: ManagedDatumPayload[] = [];

  for (const entry of payload) {
    const uploadKey = entry.uploadKey;
    const fileValue = uploadKey ? formData.get(uploadKey) : null;
    const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

    try {
      if (entry.type === "image" || entry.type === "sign") {
        const stored = file
          ? await saveUploadedAsset({ file, userId: ownerId, entity: "items", kind: "image" })
          : entry.remoteUrl
            ? await downloadRemoteAsset({ url: entry.remoteUrl, userId: ownerId, entity: "items", kind: "image" })
            : null;
        if (!stored) {
          hydrated.push(entry);
          continue;
        }
        hydrated.push({
          ...entry,
          image: stored.path,
          imageSmallThumbnail: stored.smallThumbnail ?? null,
          originalFilename: stored.originalFilename ?? null,
        });
        continue;
      }

      if (entry.type === "video") {
        const stored = file
          ? await saveUploadedAsset({ file, userId: ownerId, entity: "items", kind: "video" })
          : entry.remoteUrl
            ? await downloadRemoteAsset({ url: entry.remoteUrl, userId: ownerId, entity: "items", kind: "video" })
            : null;
        if (!stored) {
          hydrated.push(entry);
          continue;
        }
        hydrated.push({
          ...entry,
          video: stored.path,
          originalFilename: stored.originalFilename ?? null,
        });
        continue;
      }

      if (entry.type === "file") {
        const stored = file
          ? await saveUploadedAsset({ file, userId: ownerId, entity: "items", kind: "file" })
          : entry.remoteUrl
            ? await downloadRemoteAsset({ url: entry.remoteUrl, userId: ownerId, entity: "items", kind: "file" })
            : null;
        if (!stored) {
          hydrated.push(entry);
          continue;
        }
        hydrated.push({
          ...entry,
          file: stored.path,
          originalFilename: stored.originalFilename ?? null,
        });
        continue;
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Upload failed");
    }

    hydrated.push(entry);
  }

  return hydrated;
}

async function resolveMainImageState(
  formData: FormData,
  ownerId: string,
  existing?: { image: string | null; imageSmallThumbnail: string | null; imageLargeThumbnail: string | null },
  remoteImageUrl?: string | null,
) {
  const removeImage = formData.get("removeImage") === "1";
  const fileValue = formData.get("imageFile");
  const file = fileValue instanceof File && fileValue.size > 0 ? fileValue : null;

  if (!file) {
    if (removeImage) {
      return { image: null, imageSmallThumbnail: null, imageLargeThumbnail: null };
    }

    if (!remoteImageUrl) {
      return {
        image: existing?.image ?? null,
        imageSmallThumbnail: existing?.imageSmallThumbnail ?? null,
        imageLargeThumbnail: existing?.imageLargeThumbnail ?? null,
      };
    }
  }

  try {
    const stored = file
      ? await saveUploadedAsset({ file, userId: ownerId, entity: "items", kind: "image" })
      : await downloadRemoteAsset({ url: remoteImageUrl!, userId: ownerId, entity: "items", kind: "image" });
    return {
      image: stored.path,
      imageSmallThumbnail: stored.smallThumbnail ?? null,
      imageLargeThumbnail: stored.largeThumbnail ?? null,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed" };
  }
}

async function validateRelatedItemIds(ownerId: string, relatedItemIds: string[], currentItemId?: string) {
  const uniqueIds = [...new Set(relatedItemIds)].filter((id) => id !== currentItemId);
  if (uniqueIds.length === 0) return { success: true as const, ids: [] as string[] };

  const count = await prisma.item.count({ where: { id: { in: uniqueIds }, ownerId } });
  if (count !== uniqueIds.length) {
    return { success: false as const, error: "One or more related items are invalid" };
  }

  return { success: true as const, ids: uniqueIds };
}

function revalidateItemPaths(itemId: string, collectionId: string | null, previousCollectionId?: string | null) {
  revalidatePath("/collections");
  revalidatePath(`/items/${itemId}`);
  revalidatePath("/items/new");
  if (collectionId) revalidatePath(`/collections/${collectionId}`);
  if (previousCollectionId && previousCollectionId !== collectionId) revalidatePath(`/collections/${previousCollectionId}`);
}

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}
