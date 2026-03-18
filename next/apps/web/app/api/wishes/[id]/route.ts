import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { computeFinalVisibility, deleteUploadImageVariants, getWishlistAncestors } from "@/lib/wishlists-tree";

interface Params {
  params: Promise<{ id: string }>;
}

function deriveSmall(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? `${path}_small` : `${path.slice(0, dot)}_small${path.slice(dot)}`;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const wish = await prisma.wish.findFirst({
    where: { id, ownerId: session.user.id },
    include: { wishlist: { select: { id: true, name: true, parentId: true } } },
  });

  if (!wish) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const wishlistAncestors = wish.wishlist
    ? await getWishlistAncestors(session.user.id, wish.wishlist.parentId)
    : [];

  return NextResponse.json({ ...wish, wishlistAncestors });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.wish.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const body = await req.json();

  const name = typeof body.name === "string" ? body.name.trim() : existing.name;
  if (!name) return NextResponse.json({ error: "Il nome è obbligatorio" }, { status: 400 });

  const wishlistId =
    typeof body.wishlistId === "string" && body.wishlistId.length > 0
      ? body.wishlistId
      : existing.wishlistId;
  if (!wishlistId) return NextResponse.json({ error: "La wishlist è obbligatoria" }, { status: 400 });

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wishlistId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!wishlist) return NextResponse.json({ error: "Wishlist non trovata o non autorizzata" }, { status: 403 });

  const url = typeof body.url === "string" ? body.url : existing.url;
  const price = typeof body.price === "string" ? body.price : existing.price;
  const currency = typeof body.currency === "string" ? body.currency : existing.currency;
  const comment = typeof body.comment === "string" ? body.comment : existing.comment;
  const visibility = ["public", "internal", "private"].includes(body.visibility)
    ? (body.visibility as string)
    : existing.visibility;
  const image =
    body.image === "" || body.image === null
      ? null
      : typeof body.image === "string"
        ? body.image
        : existing.image;
  const deleteImage = body.deleteImage === true || body.deleteImage === "true";
  const nextImage = deleteImage ? null : image;

  const finalVisibility = computeFinalVisibility(visibility, wishlist.finalVisibility);

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
      imageSmallThumbnail: nextImage ? deriveSmall(nextImage) : null,
      updatedAt: new Date(),
    },
  });

  if (deleteImage && existing.image) await deleteUploadImageVariants(existing.image);
  if (!deleteImage && image && existing.image && existing.image !== image) {
    await deleteUploadImageVariants(existing.image);
  }

  await prisma.log.create({
    data: {
      type: "update",
      loggedAt: new Date(),
      objectId: wish.id,
      objectLabel: wish.name,
      objectClass: "Wish",
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(wish);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const wish = await prisma.wish.findFirst({ where: { id, ownerId: session.user.id } });
  if (!wish) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (wish.image) await deleteUploadImageVariants(wish.image);

  await prisma.wish.delete({ where: { id } });

  await prisma.log.create({
    data: {
      type: "delete",
      loggedAt: new Date(),
      objectId: id,
      objectLabel: wish.name,
      objectClass: "Wish",
      ownerId: session.user.id,
    },
  });

  return new NextResponse(null, { status: 204 });
}

