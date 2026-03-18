"use server";

import { requireAuth } from "@/lib/auth-utils";
import { computeFinalVisibility, deleteUploadImageVariants } from "@/lib/albums-tree";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const photoSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio").max(255),
  comment: z.string().optional().nullable(),
  place: z.string().optional().nullable(),
  takenAt: z.preprocess(
    (v) => (v === "" || v == null ? null : new Date(v as string)),
    z.date().optional().nullable(),
  ),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  albumId: z.string().min(1, "L'album è obbligatorio"),
  image: z.preprocess((v) => (v === "" ? null : v), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((v) => v === true || v === "true" || v === "on", z.boolean())
    .default(false),
});

export async function createPhoto(formData: FormData) {
  const session = await requireAuth();

  const parsed = photoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, comment, place, takenAt, visibility, albumId, image } = parsed.data;

  // Verify album belongs to user
  const album = await prisma.album.findFirst({
    where: { id: albumId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!album) throw new Error("Album non trovato o non autorizzato");

  const finalVisibility = computeFinalVisibility(visibility, album.finalVisibility);

  const photo = await prisma.photo.create({
    data: {
      title,
      comment: comment || null,
      place: place || null,
      takenAt: takenAt ?? null,
      visibility,
      parentVisibility: album.finalVisibility,
      finalVisibility,
      albumId,
      image: image || null,
      imageSmallThumbnail: image ? deriveSmallThumbnail(image) : null,
      ownerId: session.user.id,
    },
  });

  await logAction(session.user.id, "create", photo.id, photo.title, "Photo");
  revalidatePath(`/albums/${albumId}`);
  redirect(`/photos/${photo.id}`);
}

export async function updatePhoto(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.photo.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Foto non trovata");

  const parsed = photoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, comment, place, takenAt, visibility, albumId, image, deleteImage } = parsed.data;

  // Verify target album belongs to user
  const album = await prisma.album.findFirst({
    where: { id: albumId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!album) throw new Error("Album non trovato o non autorizzato");

  const finalVisibility = computeFinalVisibility(visibility, album.finalVisibility);
  const nextImage = deleteImage ? null : image ?? existing.image;
  const nextSmall = nextImage ? deriveSmallThumbnail(nextImage) : null;

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      title,
      comment: comment || null,
      place: place || null,
      takenAt: takenAt ?? null,
      visibility,
      parentVisibility: album.finalVisibility,
      finalVisibility,
      albumId,
      image: nextImage,
      imageSmallThumbnail: nextSmall,
      updatedAt: new Date(),
    },
  });

  if (deleteImage && existing.image) await deleteUploadImageVariants(existing.image);
  if (!deleteImage && image && existing.image && existing.image !== image) {
    await deleteUploadImageVariants(existing.image);
  }

  await logAction(session.user.id, "update", photo.id, photo.title, "Photo");
  revalidatePath(`/photos/${id}`);
  revalidatePath(`/albums/${albumId}`);
  if (existing.albumId && existing.albumId !== albumId) revalidatePath(`/albums/${existing.albumId}`);
  redirect(`/photos/${id}`);
}

export async function deletePhoto(id: string) {
  const session = await requireAuth();

  const photo = await prisma.photo.findFirst({ where: { id, ownerId: session.user.id } });
  if (!photo) throw new Error("Foto non trovata");

  if (photo.image) await deleteUploadImageVariants(photo.image);

  await prisma.photo.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, photo.title, "Photo");

  revalidatePath(`/albums/${photo.albumId}`);
  redirect(photo.albumId ? `/albums/${photo.albumId}` : "/albums");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives the _small thumbnail path from the main image path.
 * e.g. "userId/photo/uuid.jpg" → "userId/photo/uuid_small.jpg"
 */
function deriveSmallThumbnail(imagePath: string): string {
  const lastDot = imagePath.lastIndexOf(".");
  if (lastDot === -1) return `${imagePath}_small`;
  return `${imagePath.slice(0, lastDot)}_small${imagePath.slice(lastDot)}`;
}

async function logAction(
  ownerId: string,
  type: string,
  objectId: string,
  objectLabel: string,
  objectClass: string,
) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}

