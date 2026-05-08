import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@stackly/db";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  getWishlistAncestors,
  resolveWishlistParent,
  syncWishlistDescendantsVisibility,
  TreeValidationError,
} from "@/lib/wishlists-tree";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: {
        include: { _count: { select: { children: true, wishes: true } } },
        orderBy: { name: "asc" },
      },
      wishes: { orderBy: { name: "asc" } },
      _count: { select: { children: true, wishes: true } },
    },
  });

  if (!wishlist) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const ancestors = await getWishlistAncestors(session.user.id, wishlist.parentId);
  return NextResponse.json({ ...wishlist, ancestors });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : existing.name;
    if (!name) return NextResponse.json({ error: "Il nome è obbligatorio" }, { status: 400 });

    const color = typeof body.color === "string" ? body.color.replace(/^#/, "") : existing.color;
    const visibility =
      ["public", "internal", "private"].includes(body.visibility) ? body.visibility : existing.visibility;
    const parentId =
      body.parentId === "" || body.parentId === null
        ? null
        : typeof body.parentId === "string"
          ? body.parentId
          : existing.parentId;
    const image =
      body.image === "" || body.image === null
        ? null
        : typeof body.image === "string"
          ? body.image
          : existing.image;
    const deleteImage = body.deleteImage === true || body.deleteImage === "true";
    const nextImage = deleteImage ? null : image;

    const parent = await resolveWishlistParent({
      ownerId: session.user.id,
      parentId,
      currentWishlistId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const wishlist = await prisma.wishlist.update({
      where: { id },
      data: {
        name,
        color,
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

    await syncWishlistDescendantsVisibility(session.user.id, wishlist.id, finalVisibility);
    await prisma.wish.updateMany({
      where: { wishlistId: id },
      data: { parentVisibility: finalVisibility, finalVisibility },
    });

    await prisma.log.create({
      data: {
        type: "update",
        loggedAt: new Date(),
        objectId: wishlist.id,
        objectLabel: wishlist.name,
        objectClass: "Wishlist",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const wishlist = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wishlist) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (wishlist.image) await deleteUploadImageVariants(wishlist.image);

  await prisma.wishlist.delete({ where: { id } });

  await prisma.log.create({
    data: {
      type: "delete",
      loggedAt: new Date(),
      objectId: id,
      objectLabel: wishlist.name,
      objectClass: "Wishlist",
      ownerId: session.user.id,
    },
  });

  return new NextResponse(null, { status: 204 });
}

