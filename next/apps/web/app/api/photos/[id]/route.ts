import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { computeFinalVisibility, deleteUploadImageVariants } from "@/lib/albums-tree";
import { getAlbumAncestors } from "@/lib/albums-tree";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const photo = await prisma.photo.findFirst({
    where: { id, ownerId: session.user.id },
    include: { album: { select: { id: true, title: true, parentId: true } } },
  });

  if (!photo) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const albumAncestors = photo.album
    ? await getAlbumAncestors(session.user.id, photo.album.parentId)
    : [];

  return NextResponse.json({ ...photo, albumAncestors });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.photo.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : existing.title;
  if (!title) return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });

  const albumId =
    typeof body.albumId === "string" && body.albumId.length > 0
      ? body.albumId
      : existing.albumId;

  if (!albumId) return NextResponse.json({ error: "L'album è obbligatorio" }, { status: 400 });

  const album = await prisma.album.findFirst({
    where: { id: albumId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!album) return NextResponse.json({ error: "Album non trovato o non autorizzato" }, { status: 403 });

  const comment = typeof body.comment === "string" ? body.comment : existing.comment;
  const place = typeof body.place === "string" ? body.place : existing.place;
  const takenAt = body.takenAt ? new Date(body.takenAt as string) : existing.takenAt;
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

  const finalVisibility = computeFinalVisibility(visibility, album.finalVisibility);

  const photo = await prisma.photo.update({
    where: { id },
    data: {
      title,
      comment,
      place,
      takenAt,
      visibility,
      parentVisibility: album.finalVisibility,
      finalVisibility,
      albumId,
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
    data: { type: "update", loggedAt: new Date(), objectId: photo.id, objectLabel: photo.title, objectClass: "Photo", ownerId: session.user.id },
  });

  return NextResponse.json(photo);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const photo = await prisma.photo.findFirst({ where: { id, ownerId: session.user.id } });
  if (!photo) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (photo.image) await deleteUploadImageVariants(photo.image);

  await prisma.photo.delete({ where: { id } });

  await prisma.log.create({
    data: { type: "delete", loggedAt: new Date(), objectId: id, objectLabel: photo.title, objectClass: "Photo", ownerId: session.user.id },
  });

  return new NextResponse(null, { status: 204 });
}

function deriveSmall(p: string): string {
  const dot = p.lastIndexOf(".");
  return dot === -1 ? `${p}_small` : `${p.slice(0, dot)}_small${p.slice(dot)}`;
}

