"use server";

import { requireAuth } from "@/lib/auth-utils";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  resolveAlbumParent,
  syncAlbumDescendantsVisibility,
  TreeValidationError,
} from "@/lib/albums-tree";
import {
  computeFinalVisibility as computeWishlistFinalVisibility,
  deleteUploadImageVariants as deleteWishlistUploadImageVariants,
  resolveWishlistParent,
  syncWishlistDescendantsVisibility,
  TreeValidationError as WishlistTreeValidationError,
} from "@/lib/wishlists-tree";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const albumSchema = z.object({
  title: z.string().min(1, "Il titolo è obbligatorio").max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.preprocess((v) => (v === "" ? null : v), z.string().optional().nullable()),
  image: z.preprocess((v) => (v === "" ? null : v), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((v) => v === true || v === "true" || v === "on", z.boolean())
    .default(false),
});

const wishlistSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  image: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
});

// ─── Album ───────────────────────────────────────────────────────────────────

export async function createAlbum(formData: FormData) {
  const session = await requireAuth();

  const parsed = albumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, image } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveAlbumParent({ ownerId: session.user.id, parentId });

    const album = await prisma.album.create({
      data: {
        title,
        color: normalizedColor,
        visibility,
        parentVisibility: parent.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, parent.parentVisibility),
        parentId: parent.parentId,
        image: image || null,
        ownerId: session.user.id,
      },
    });

    await logAction(session.user.id, "create", album.id, album.title, "Album");
    revalidatePath("/albums");
    if (parent.parentId) revalidatePath(`/albums/${parent.parentId}`);
    redirect(`/albums/${album.id}`);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function updateAlbum(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Album non trovato");

  const parsed = albumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId, image, deleteImage } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveAlbumParent({
      ownerId: session.user.id,
      parentId,
      currentAlbumId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);
    const nextImage = deleteImage ? null : image ?? existing.image;

    const album = await prisma.album.update({
      where: { id },
      data: {
        title,
        color: normalizedColor,
        visibility,
        parentId: parent.parentId,
        parentVisibility: parent.parentVisibility,
        finalVisibility,
        image: nextImage,
        updatedAt: new Date(),
      },
    });

    if (deleteImage && existing.image) await deleteUploadImageVariants(existing.image);
    if (!deleteImage && image && existing.image && existing.image !== image) {
      await deleteUploadImageVariants(existing.image);
    }

    await syncAlbumDescendantsVisibility(session.user.id, album.id, finalVisibility);

    // Propagate visibility to direct photos
    await prisma.photo.updateMany({
      where: { albumId: id },
      data: { parentVisibility: finalVisibility, finalVisibility },
    });

    await logAction(session.user.id, "update", album.id, album.title, "Album");
    revalidatePath(`/albums/${id}`);
    revalidatePath("/albums");
    if (album.parentId) revalidatePath(`/albums/${album.parentId}`);
    if (existing.parentId && existing.parentId !== album.parentId) {
      revalidatePath(`/albums/${existing.parentId}`);
    }
    redirect(`/albums/${id}`);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function deleteAlbum(id: string) {
  const session = await requireAuth();

  const album = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!album) throw new Error("Album non trovato");

  if (album.image) await deleteUploadImageVariants(album.image);

  await prisma.album.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, album.title, "Album");
  revalidatePath("/albums");
  if (album.parentId) revalidatePath(`/albums/${album.parentId}`);
  redirect(album.parentId ? `/albums/${album.parentId}` : "/albums");
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function createWishlist(formData: FormData) {
  const session = await requireAuth();

  const parsed = wishlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, color, visibility, parentId, image } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveWishlistParent({ ownerId: session.user.id, parentId });

    const wishlist = await prisma.wishlist.create({
      data: {
        name,
        color: normalizedColor,
        visibility,
        parentVisibility: parent.parentVisibility,
        finalVisibility: computeWishlistFinalVisibility(visibility, parent.parentVisibility),
        parentId: parent.parentId,
        image: image || null,
        ownerId: session.user.id,
      },
    });

    await logAction(session.user.id, "create", wishlist.id, wishlist.name, "Wishlist");
    revalidatePath("/wishlists");
    if (parent.parentId) revalidatePath(`/wishlists/${parent.parentId}`);
    redirect(`/wishlists/${wishlist.id}`);
  } catch (error) {
    if (error instanceof WishlistTreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function updateWishlist(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Wishlist non trovata");

  const parsed = wishlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, color, visibility, parentId, image, deleteImage } = parsed.data;
  const normalizedColor = color ? color.replace(/^#/, "") : null;

  try {
    const parent = await resolveWishlistParent({
      ownerId: session.user.id,
      parentId,
      currentWishlistId: id,
    });

    const finalVisibility = computeWishlistFinalVisibility(visibility, parent.parentVisibility);
    const nextImage = deleteImage ? null : image ?? existing.image;

    const wishlist = await prisma.wishlist.update({
      where: { id },
      data: {
        name,
        color: normalizedColor,
        visibility,
        parentId: parent.parentId,
        parentVisibility: parent.parentVisibility,
        finalVisibility,
        image: nextImage,
        updatedAt: new Date(),
      },
    });

    if (deleteImage && existing.image) await deleteWishlistUploadImageVariants(existing.image);
    if (!deleteImage && image && existing.image && existing.image !== image) {
      await deleteWishlistUploadImageVariants(existing.image);
    }

    await syncWishlistDescendantsVisibility(session.user.id, wishlist.id, finalVisibility);
    await prisma.wish.updateMany({
      where: { wishlistId: id },
      data: { parentVisibility: finalVisibility, finalVisibility },
    });

    await logAction(session.user.id, "update", wishlist.id, wishlist.name, "Wishlist");
    revalidatePath(`/wishlists/${id}`);
    revalidatePath("/wishlists");
    if (wishlist.parentId) revalidatePath(`/wishlists/${wishlist.parentId}`);
    if (existing.parentId && existing.parentId !== wishlist.parentId) {
      revalidatePath(`/wishlists/${existing.parentId}`);
    }
    redirect(`/wishlists/${id}`);
  } catch (error) {
    if (error instanceof WishlistTreeValidationError) {
      return { error: { parentId: [error.message] } };
    }
    throw error;
  }
}

export async function deleteWishlist(id: string) {
  const session = await requireAuth();

  const wishlist = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wishlist) throw new Error("Wishlist non trovata");

  if (wishlist.image) await deleteWishlistUploadImageVariants(wishlist.image);

  await prisma.wishlist.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, wishlist.name, "Wishlist");
  revalidatePath("/wishlists");
  if (wishlist.parentId) revalidatePath(`/wishlists/${wishlist.parentId}`);
  redirect(wishlist.parentId ? `/wishlists/${wishlist.parentId}` : "/wishlists");
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({ data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId } });
}

