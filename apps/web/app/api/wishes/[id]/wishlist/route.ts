import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@stackly/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { id } = await params;

  const wish = await prisma.wish.findFirst({
    where: { id, ownerId: session.user.id },
    select: { wishlistId: true },
  });

  if (!wish) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (!wish.wishlistId) return NextResponse.json({ error: "Wishlist non trovata" }, { status: 404 });

  const wishlist = await prisma.wishlist.findFirst({
    where: { id: wish.wishlistId, ownerId: session.user.id },
  });

  if (!wishlist) return NextResponse.json({ error: "Wishlist non trovata" }, { status: 404 });

  return NextResponse.json(wishlist);
}

