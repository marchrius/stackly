import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  getAlbumAncestors,
  resolveAlbumParent,
  syncAlbumDescendantsVisibility,
  TreeValidationError,
} from "@/lib/albums-tree";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const album = await prisma.album.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: {
        include: { _count: { select: { children: true, photos: true } } },
        orderBy: { title: "asc" },
      },
      photos: { orderBy: { createdAt: "desc" }, take: 60 },
      _count: { select: { children: true, photos: true } },
    },
  });

  if (!album) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const ancestors = await getAlbumAncestors(session.user.id, album.parentId);
  return NextResponse.json({ ...album, ancestors });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  try {
    const body = await req.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : existing.title;
    const color =
      typeof body.color === "string" ? body.color.replace(/^#/, "") : existing.color;
    const visibility =
      ["public", "internal", "private"].includes(body.visibility)
        ? (body.visibility as string)
        : existing.visibility;
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

    if (!title) return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });

    const parent = await resolveAlbumParent({
      ownerId: session.user.id,
      parentId,
      currentAlbumId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const album = await prisma.album.update({
      where: { id },
      data: {
        title,
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

    await syncAlbumDescendantsVisibility(session.user.id, album.id, finalVisibility);

    // Propagate to direct photos
    await prisma.photo.updateMany({
      where: { albumId: id },
      data: { parentVisibility: finalVisibility, finalVisibility },
    });

    await prisma.log.create({
      data: { type: "update", loggedAt: new Date(), objectId: album.id, objectLabel: album.title, objectClass: "Album", ownerId: session.user.id },
    });

    return NextResponse.json(album);
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

  const album = await prisma.album.findFirst({ where: { id, ownerId: session.user.id } });
  if (!album) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (album.image) await deleteUploadImageVariants(album.image);

  await prisma.album.delete({ where: { id } });

  await prisma.log.create({
    data: { type: "delete", loggedAt: new Date(), objectId: id, objectLabel: album.title, objectClass: "Album", ownerId: session.user.id },
  });

  return new NextResponse(null, { status: 204 });
}

