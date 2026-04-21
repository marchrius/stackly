import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@stackly/db";
import { computeFinalVisibility } from "@/lib/albums-tree";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("perPage") ?? "30", 10);
  const albumId = searchParams.get("albumId") ?? undefined;

  const where = {
    ownerId: session.user.id,
    ...(albumId ? { albumId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.photo.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });

  const albumId = typeof body.albumId === "string" ? body.albumId : null;
  if (!albumId) return NextResponse.json({ error: "L'album è obbligatorio" }, { status: 400 });

  const album = await prisma.album.findFirst({
    where: { id: albumId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!album) return NextResponse.json({ error: "Album non trovato o non autorizzato" }, { status: 403 });

  const comment = typeof body.comment === "string" ? body.comment : null;
  const place = typeof body.place === "string" ? body.place : null;
  const takenAt = body.takenAt ? new Date(body.takenAt as string) : null;
  const visibility = ["public", "internal", "private"].includes(body.visibility)
    ? (body.visibility as string)
    : "public";
  const image = typeof body.image === "string" && body.image.length > 0 ? body.image : null;

  const finalVisibility = computeFinalVisibility(visibility, album.finalVisibility);

  const photo = await prisma.photo.create({
    data: {
      title,
      comment,
      place,
      takenAt,
      visibility,
      parentVisibility: album.finalVisibility,
      finalVisibility,
      albumId,
      image,
      imageSmallThumbnail: image ? deriveSmall(image) : null,
      ownerId: session.user.id,
    },
  });

  await prisma.log.create({
    data: { type: "create", loggedAt: new Date(), objectId: photo.id, objectLabel: photo.title, objectClass: "Photo", ownerId: session.user.id },
  });

  return NextResponse.json(photo, { status: 201 });
}

function deriveSmall(p: string): string {
  const dot = p.lastIndexOf(".");
  return dot === -1 ? `${p}_small` : `${p.slice(0, dot)}_small${p.slice(dot)}`;
}

