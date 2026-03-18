"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const albumSchema = z.object({
  title: z.string().min(1).max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.string().optional().nullable(),
});

const wishlistSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().optional().nullable(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  parentId: z.string().optional().nullable(),
});

// ─── Album ───────────────────────────────────────────────────────────────────

export async function createAlbum(formData: FormData) {
  const session = await requireAuth();

  const parsed = albumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { title, color, visibility, parentId } = parsed.data;
  const album = await prisma.album.create({
    data: { title, color: color || null, visibility, parentVisibility: "public", finalVisibility: visibility, parentId: parentId || null, ownerId: session.user.id },
  });

  await logAction(session.user.id, "create", album.id, album.title, "Album");
  revalidatePath("/albums");
  redirect(`/albums/${album.id}`);
}

export async function updateAlbum(id: string, formData: FormData) {
  const session = await requireAuth();

  const album = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!album) throw new Error("Album non trovato");

  const parsed = albumSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const updated = await prisma.album.update({ where: { id }, data: { ...parsed.data, color: parsed.data.color || null, parentId: parsed.data.parentId || null, updatedAt: new Date() } });
  await logAction(session.user.id, "update", updated.id, updated.title, "Album");
  revalidatePath(`/albums/${id}`);
  redirect(`/albums/${id}`);
}

export async function deleteAlbum(id: string) {
  const session = await requireAuth();

  const album = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!album) throw new Error("Album non trovato");

  await prisma.album.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, album.title, "Album");
  revalidatePath("/albums");
  redirect("/albums");
}

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export async function createWishlist(formData: FormData) {
  const session = await requireAuth();

  const parsed = wishlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, color, visibility, parentId } = parsed.data;
  const wishlist = await prisma.wishlist.create({
    data: { name, color: color || null, visibility, parentVisibility: "public", finalVisibility: visibility, parentId: parentId || null, ownerId: session.user.id },
  });

  await logAction(session.user.id, "create", wishlist.id, wishlist.name, "Wishlist");
  revalidatePath("/wishlists");
  redirect(`/wishlists/${wishlist.id}`);
}

export async function updateWishlist(id: string, formData: FormData) {
  const session = await requireAuth();

  const wishlist = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wishlist) throw new Error("Wishlist non trovata");

  const parsed = wishlistSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const updated = await prisma.wishlist.update({ where: { id }, data: { ...parsed.data, color: parsed.data.color || null, parentId: parsed.data.parentId || null, updatedAt: new Date() } });
  await logAction(session.user.id, "update", updated.id, updated.name, "Wishlist");
  revalidatePath(`/wishlists/${id}`);
  redirect(`/wishlists/${id}`);
}

export async function deleteWishlist(id: string) {
  const session = await requireAuth();

  const wishlist = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wishlist) throw new Error("Wishlist non trovata");

  await prisma.wishlist.delete({ where: { id } });
  await logAction(session.user.id, "delete", id, wishlist.name, "Wishlist");
  revalidatePath("/wishlists");
  redirect("/wishlists");
}

// ─── Helper ──────────────────────────────────────────────────────────────────

async function logAction(ownerId: string, type: string, objectId: string, objectLabel: string, objectClass: string) {
  await prisma.log.create({ data: { type, loggedAt: new Date(), objectId, objectLabel, objectClass, ownerId } });
}

