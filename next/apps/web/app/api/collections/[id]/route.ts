import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: { include: { _count: { select: { children: true, items: true } } } },
      items: { take: 50 },
      data: { orderBy: { position: "asc" } },
      _count: { select: { children: true, items: true } },
    },
  });

  if (!collection) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(collection);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const body = await req.json();
  const collection = await prisma.collection.update({
    where: { id },
    data: { ...body, updatedAt: new Date() },
  });

  await prisma.log.create({
    data: { type: "update", loggedAt: new Date(), objectId: collection.id, objectLabel: collection.title, objectClass: "Collection", ownerId: session.user.id },
  });

  return NextResponse.json(collection);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const collection = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!collection) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  await prisma.collection.delete({ where: { id } });
  await prisma.log.create({
    data: { type: "delete", loggedAt: new Date(), objectId: id, objectLabel: collection.title, objectClass: "Collection", objectDeleted: true, ownerId: session.user.id },
  });

  return new NextResponse(null, { status: 204 });
}

