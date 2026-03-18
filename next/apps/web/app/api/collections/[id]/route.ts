import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import {
  computeFinalVisibility,
  deleteUploadImageVariants,
  getCollectionAncestors,
  resolveCollectionParent,
  syncCollectionDescendantsVisibility,
  TreeValidationError,
} from "@/lib/collections-tree";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const collection = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      children: {
        include: { _count: { select: { children: true, items: true } } },
        orderBy: { title: "asc" },
      },
      items: { take: 50, orderBy: { name: "asc" } },
      data: { orderBy: { position: "asc" } },
      _count: { select: { children: true, items: true } },
    },
  });

  if (!collection) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const ancestors = await getCollectionAncestors(session.user.id, collection.parentId);

  return NextResponse.json({ ...collection, ancestors });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const existing = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  try {
    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : existing.title;
    const color = typeof body.color === "string" ? body.color.replace(/^#/, "") : existing.color;
    const visibility =
      body.visibility === "public" || body.visibility === "internal" || body.visibility === "private"
        ? body.visibility
        : existing.visibility;
    const parentId =
      body.parentId === "" || body.parentId === null
        ? null
        : typeof body.parentId === "string"
          ? body.parentId
          : existing.parentId;
    const itemsDefaultTemplateId =
      body.itemsDefaultTemplateId === ""
        ? null
        : typeof body.itemsDefaultTemplateId === "string"
          ? body.itemsDefaultTemplateId
          : existing.itemsDefaultTemplateId;
    const image =
      body.image === "" || body.image === null
        ? null
        : typeof body.image === "string"
          ? body.image
          : existing.image;
    const deleteImage = body.deleteImage === true || body.deleteImage === "true" || body.deleteImage === "on";

    const nextImage = deleteImage ? null : image;

    if (!title) {
      return NextResponse.json({ error: "Il titolo e obbligatorio" }, { status: 400 });
    }

    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
      currentCollectionId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const collection = await prisma.collection.update({
      where: { id },
      data: {
        title,
        color,
        visibility,
        parentId: parent.parentId,
        parentVisibility: parent.parentVisibility,
        finalVisibility,
        itemsDefaultTemplateId,
        image: nextImage,
        updatedAt: new Date(),
      },
    });

    if (deleteImage && existing.image) {
      await deleteUploadImageVariants(existing.image);
    }

    if (!deleteImage && image && existing.image && existing.image !== image) {
      await deleteUploadImageVariants(existing.image);
    }

    await syncCollectionDescendantsVisibility(session.user.id, collection.id, finalVisibility);

    await prisma.log.create({
      data: {
        type: "update",
        loggedAt: new Date(),
        objectId: collection.id,
        objectLabel: collection.title,
        objectClass: "Collection",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(collection);
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const collection = await prisma.collection.findFirst({ where: { id, ownerId: session.user.id } });
  if (!collection) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  if (collection.image) {
    await deleteUploadImageVariants(collection.image);
  }

  await prisma.collection.delete({ where: { id } });
  await prisma.log.create({
    data: {
      type: "delete",
      loggedAt: new Date(),
      objectId: id,
      objectLabel: collection.title,
      objectClass: "Collection",
      objectDeleted: true,
      ownerId: session.user.id,
    },
  });

  return new NextResponse(null, { status: 204 });
}
