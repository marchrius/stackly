import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { computeFinalVisibility } from "@/lib/wishlists-tree";

function deriveSmall(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? `${path}_small` : `${path.slice(0, dot)}_small${path.slice(dot)}`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("perPage") ?? "30", 10);
  const wishlistId = searchParams.get("wishlistId") ?? undefined;

  const where = {
    ownerId: session.user.id,
    ...(wishlistId ? { wishlistId } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.wish.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.wish.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "Il nome è obbligatorio" }, { status: 400 });

  const wishlistId = typeof body.wishlistId === "string" ? body.wishlistId : null;
  if (!wishlistId) return NextResponse.json({ error: "La wishlist è obbligatoria" }, { status: 400 });

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wishlistId, ownerId: session.user.id },
    select: { id: true, finalVisibility: true },
  });
  if (!wishlist) return NextResponse.json({ error: "Wishlist non trovata o non autorizzata" }, { status: 403 });

  const url = typeof body.url === "string" && body.url.length > 0 ? body.url : null;
  const price = typeof body.price === "string" && body.price.length > 0 ? body.price : null;
  const currency = typeof body.currency === "string" && body.currency.length > 0 ? body.currency : null;
  const comment = typeof body.comment === "string" && body.comment.length > 0 ? body.comment : null;
  const visibility = ["public", "internal", "private"].includes(body.visibility)
    ? (body.visibility as string)
    : "public";
  const image = typeof body.image === "string" && body.image.length > 0 ? body.image : null;

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
      image,
      imageSmallThumbnail: image ? deriveSmall(image) : null,
      ownerId: session.user.id,
    },
  });

  await prisma.log.create({
    data: {
      type: "create",
      loggedAt: new Date(),
      objectId: wish.id,
      objectLabel: wish.name,
      objectClass: "Wish",
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(wish, { status: 201 });
}

