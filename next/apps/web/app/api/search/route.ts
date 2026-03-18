import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [], collections: [], tags: [] });

  const [items, collections, tags] = await Promise.all([
    prisma.item.findMany({ where: { ownerId: session.user.id, name: { contains: q, mode: "insensitive" } }, take: 20 }),
    prisma.collection.findMany({ where: { ownerId: session.user.id, title: { contains: q, mode: "insensitive" } }, take: 10 }),
    prisma.tag.findMany({ where: { ownerId: session.user.id, label: { contains: q, mode: "insensitive" } }, take: 10 }),
  ]);

  return NextResponse.json({ items, collections, tags });
}

