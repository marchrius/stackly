import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const collectionId = searchParams.get("collectionId") ?? undefined;
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "30");

  const [data, total] = await Promise.all([
    prisma.item.findMany({
      where: { ownerId: session.user.id, ...(collectionId ? { collectionId } : {}) },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.item.count({ where: { ownerId: session.user.id, ...(collectionId ? { collectionId } : {}) } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { name, quantity = 1, visibility = "public", collectionId } = body;
  if (!name) return NextResponse.json({ error: "Il nome è obbligatorio" }, { status: 400 });

  const item = await prisma.item.create({
    data: { name, quantity, visibility, parentVisibility: "public", finalVisibility: visibility, collectionId: collectionId ?? null, ownerId: session.user.id },
  });

  await prisma.log.create({
    data: { type: "create", loggedAt: new Date(), objectId: item.id, objectLabel: item.name, objectClass: "Item", ownerId: session.user.id },
  });

  return NextResponse.json(item, { status: 201 });
}

