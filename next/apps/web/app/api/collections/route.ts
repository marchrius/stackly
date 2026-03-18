import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "30");
  const parentId = searchParams.get("parentId") ?? undefined;

  const [data, total] = await Promise.all([
    prisma.collection.findMany({
      where: { ownerId: session.user.id, parentId: parentId ?? null },
      orderBy: { title: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { children: true, items: true } } },
    }),
    prisma.collection.count({ where: { ownerId: session.user.id, parentId: parentId ?? null } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const body = await req.json();
  const { title, color, visibility = "public", parentId, itemsDefaultTemplateId } = body;

  if (!title) return NextResponse.json({ error: "Il titolo è obbligatorio" }, { status: 400 });

  const collection = await prisma.collection.create({
    data: {
      title,
      color: color ?? null,
      visibility,
      parentVisibility: "public",
      finalVisibility: visibility,
      parentId: parentId ?? null,
      itemsDefaultTemplateId: itemsDefaultTemplateId ?? null,
      ownerId: session.user.id,
    },
  });

  await prisma.log.create({
    data: { type: "create", loggedAt: new Date(), objectId: collection.id, objectLabel: collection.title, objectClass: "Collection", ownerId: session.user.id },
  });

  return NextResponse.json(collection, { status: 201 });
}

