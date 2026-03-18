import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const item = await prisma.item.findFirst({
    where: { id, ownerId: session.user.id },
    include: { data: { orderBy: { position: "asc" } }, tags: true, loans: true, collection: { select: { id: true, title: true } } },
  });

  if (!item) return NextResponse.json({ error: "Non trovato" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.item.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const body = await req.json();
  const item = await prisma.item.update({ where: { id }, data: { ...body, updatedAt: new Date() } });

  await prisma.log.create({
    data: { type: "update", loggedAt: new Date(), objectId: item.id, objectLabel: item.name, objectClass: "Item", ownerId: session.user.id },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const item = await prisma.item.findFirst({ where: { id, ownerId: session.user.id } });
  if (!item) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  await prisma.item.delete({ where: { id } });
  await prisma.log.create({
    data: { type: "delete", loggedAt: new Date(), objectId: id, objectLabel: item.name, objectClass: "Item", objectDeleted: true, ownerId: session.user.id },
  });

  return new NextResponse(null, { status: 204 });
}

