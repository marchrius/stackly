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

  const wishlist = await prisma.wishlist.findFirst({
    where: { id, ownerId: session.user.id },
    select: { parentId: true },
  });

  if (!wishlist) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  if (!wishlist.parentId) return NextResponse.json({ error: "Parent non trovato" }, { status: 404 });

  const parent = await prisma.wishlist.findFirst({
    where: { id: wishlist.parentId, ownerId: session.user.id },
  });

  if (!parent) return NextResponse.json({ error: "Parent non trovato" }, { status: 404 });

  return NextResponse.json(parent);
}

