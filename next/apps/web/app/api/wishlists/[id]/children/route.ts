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

  const parent = await prisma.wishlist.findFirst({ where: { id, ownerId: session.user.id }, select: { id: true } });
  if (!parent) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const children = await prisma.wishlist.findMany({
    where: { parentId: id, ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true, wishes: true } } },
  });

  return NextResponse.json({ data: children, total: children.length });
}

