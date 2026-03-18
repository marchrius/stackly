import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  resolveWishlistParent,
  TreeValidationError,
} from "@/lib/wishlists-tree";

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
    prisma.wishlist.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { children: true, wishes: true } } },
    }),
    prisma.wishlist.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  try {
    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Il nome è obbligatorio" }, { status: 400 });

    const color = typeof body.color === "string" && body.color.length > 0 ? body.color.replace(/^#/, "") : null;
    const visibility = ["public", "internal", "private"].includes(body.visibility) ? body.visibility : "public";
    const parentId = typeof body.parentId === "string" && body.parentId.length > 0 ? body.parentId : null;
    const image = typeof body.image === "string" && body.image.length > 0 ? body.image : null;

    const parent = await resolveWishlistParent({ ownerId: session.user.id, parentId });

    const wishlist = await prisma.wishlist.create({
      data: {
        name,
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
      data: {
        type: "create",
        loggedAt: new Date(),
        objectId: wishlist.id,
        objectLabel: wishlist.name,
        objectClass: "Wishlist",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

