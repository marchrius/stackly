import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  resolveAlbumParent,
  TreeValidationError,
} from "@/lib/albums-tree";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("perPage") ?? "30", 10);
  const parentParam = searchParams.get("parentId");
  const parentId = parentParam === null || parentParam === "" ? null : parentParam;

  const where = { ownerId: session.user.id, parentId };

  const [data, total] = await Promise.all([
    prisma.album.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { children: true, photos: true } } },
    }),
    prisma.album.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });

    const color =
      typeof body.color === "string" && body.color.length > 0
        ? body.color.replace(/^#/, "")
        : null;
    const visibility =
      ["public", "internal", "private"].includes(body.visibility) ? body.visibility : "public";
    const parentId =
      typeof body.parentId === "string" && body.parentId.length > 0 ? body.parentId : null;
    const image =
      typeof body.image === "string" && body.image.length > 0 ? body.image : null;

    const parent = await resolveAlbumParent({ ownerId: session.user.id, parentId });

    const album = await prisma.album.create({
      data: {
        title,
        color,
        visibility,
        parentVisibility: parent.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, parent.parentVisibility),
        parentId: parent.parentId,
        image,
        ownerId: session.user.id,
      },
    });

    await prisma.log.create({
      data: { type: "create", loggedAt: new Date(), objectId: album.id, objectLabel: album.title, objectClass: "Album", ownerId: session.user.id },
    });

    return NextResponse.json(album, { status: 201 });
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

