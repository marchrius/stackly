"use server";

import { requireAuth } from "@/lib/auth-utils";
import { computeFinalVisibility, deleteUploadImageVariants } from "@/lib/wishlists-tree";
import { prisma } from "@stackly/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const wishSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio").max(255),
  url: z.preprocess((value) => (value === "" ? null : value), z.string().url().optional().nullable()),
  price: z.preprocess((value) => (value === "" ? null : value), z.string().max(255).optional().nullable()),
  currency: z.preprocess((value) => (value === "" ? null : value), z.string().max(6).optional().nullable()),
  comment: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  wishlistId: z.string().min(1, "La wishlist è obbligatoria"),
  image: z.preprocess((value) => (value === "" ? null : value), z.string().optional().nullable()),
  deleteImage: z
    .preprocess((value) => value === true || value === "true" || value === "on", z.boolean())
    .default(false),
});

export async function createWish(formData: FormData) {
  const session = await requireAuth();

  const parsed = wishSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, url, price, currency, comment, visibility, wishlistId, image } = parsed.data;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wishlistId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });

  if (!wishlist) throw new Error("Wishlist non trovata o non autorizzata");

  const finalVisibility = computeFinalVisibility(visibility, wishlist.finalVisibility);

  const wish = await prisma.wish.create({
    data: {
      name,
      url,
      price,
      currency,
      comment,
      visibility,
      parentVisibility: wishlist.finalVisibility,
      finalVisibility,
      wishlistId,
      image: image || null,
      imageSmallThumbnail: image ? deriveSmallThumbnail(image) : null,
      ownerId: session.user.id,
    },
  });

  await logAction(session.user.id, "create", wish.id, wish.name, "Wish");
  revalidatePath(`/wishlists/${wishlistId}`);
  redirect(`/wishes/${wish.id}`);
}

export async function updateWish(id: string, formData: FormData) {
  const session = await requireAuth();

  const existing = await prisma.wish.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) throw new Error("Desiderio non trovato");

  const parsed = wishSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, url, price, currency, comment, visibility, wishlistId, image, deleteImage } = parsed.data;

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wishlistId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });

  if (!wishlist) throw new Error("Wishlist non trovata o non autorizzata");

  const finalVisibility = computeFinalVisibility(visibility, wishlist.finalVisibility);
  const nextImage = deleteImage ? null : image ?? existing.image;

  const wish = await prisma.wish.update({
    where: { id },
    data: {
      name,
      url,
      price,
      currency,
      comment,
      visibility,
      parentVisibility: wishlist.finalVisibility,
      finalVisibility,
      wishlistId,
      image: nextImage,
      imageSmallThumbnail: nextImage ? deriveSmallThumbnail(nextImage) : null,
      updatedAt: new Date(),
    },
  });

  if (deleteImage && existing.image) await deleteUploadImageVariants(existing.image);
  if (!deleteImage && image && existing.image && existing.image !== image) {
    await deleteUploadImageVariants(existing.image);
  }

  await logAction(session.user.id, "update", wish.id, wish.name, "Wish");
  revalidatePath(`/wishes/${id}`);
  revalidatePath(`/wishlists/${wishlistId}`);
  if (existing.wishlistId && existing.wishlistId !== wishlistId) {
    revalidatePath(`/wishlists/${existing.wishlistId}`);
  }
  redirect(`/wishes/${id}`);
}

export async function deleteWish(id: string) {
  const session = await requireAuth();

  const wish = await prisma.wish.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wish) throw new Error("Desiderio non trovato");

  if (wish.image) await deleteUploadImageVariants(wish.image);

  await prisma.wish.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, wish.name, "Wish");

  if (wish.wishlistId) revalidatePath(`/wishlists/${wish.wishlistId}`);
  redirect(wish.wishlistId ? `/wishlists/${wish.wishlistId}` : "/wishlists");
}

function deriveSmallThumbnail(imagePath: string): string {
  const lastDot = imagePath.lastIndexOf(".");
  if (lastDot === -1) return `${imagePath}_small`;
  return `${imagePath.slice(0, lastDot)}_small${imagePath.slice(lastDot)}`;
}

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({
    data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId },
  });
}

