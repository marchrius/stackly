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
import { syncCollectionDatumEntries, type ManagedCollectionDatumPayload } from "@/lib/collection-persistence";
import { getCollectionDisplayConfigOptions, upsertDisplayConfiguration } from "@/lib/collection-display-config";
import { downloadRemoteAsset } from "@/lib/server/uploads";
import { z } from "zod";

const datumSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string(),
  type: z.string().min(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
  position: z.number().int().optional(),
  value: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
});

const displayConfigSchema = z.object({
  label: z.preprocess((value) => (typeof value === "string" ? value : ""), z.string()),
  displayMode: z.enum(["grid", "list"]).default("grid"),
  sortingProperty: z.preprocess((value) => (value === "" || value == null ? null : value), z.string().nullable()),
  sortingDirection: z.enum(["ASC", "DESC"]).default("ASC"),
  showVisibility: z.boolean().default(true),
  showActions: z.boolean().default(true),
  showNumberOfChildren: z.boolean().default(true),
  showNumberOfItems: z.boolean().default(true),
  showItemQuantities: z.boolean().default(false),
  columns: z.array(z.string()).default([]),
});

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

  const existing = await prisma.collection.findFirst({
    where: { id, ownerId: session.user.id },
    include: { data: true, childrenDisplayConfig: true, itemsDisplayConfig: true },
  });
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
    const scrapedFromUrl =
      body.scrapedFromUrl === "" || body.scrapedFromUrl === null
        ? null
        : typeof body.scrapedFromUrl === "string"
          ? body.scrapedFromUrl
          : existing.scrapedFromUrl;
    const image =
      body.image === "" || body.image === null
        ? null
        : typeof body.image === "string"
          ? body.image
          : existing.image;
    const remoteImageUrl =
      typeof body.remoteImageUrl === "string" && body.remoteImageUrl.length > 0 ? body.remoteImageUrl : null;
    const deleteImage = body.deleteImage === true || body.deleteImage === "true" || body.deleteImage === "on";
    const dataPayload = Array.isArray(body.dataPayload) ? datumSchema.array().parse(body.dataPayload) : [];
    const childrenDisplayConfig = displayConfigSchema.parse(body.childrenDisplayConfigPayload ?? {});
    const itemsDisplayConfig = displayConfigSchema.parse(body.itemsDisplayConfigPayload ?? {});

    const resolvedImage = remoteImageUrl
      ? await downloadRemoteAsset({ url: remoteImageUrl, userId: session.user.id, entity: "collections", kind: "image" })
      : null;
    const nextImage = deleteImage ? null : (resolvedImage?.smallThumbnail ?? resolvedImage?.path ?? image);

    if (!title) {
      return NextResponse.json({ error: "Il titolo e obbligatorio" }, { status: 400 });
    }

    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
      currentCollectionId: id,
    });

    const finalVisibility = computeFinalVisibility(visibility, parent.parentVisibility);

    const collection = await prisma.$transaction(async (tx) => {
      const displayOptions = await getCollectionDisplayConfigOptions(tx, session.user.id, id);
      const childrenDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        existing.childrenDisplayConfigId,
        childrenDisplayConfig,
        displayOptions.childrenSortingOptions,
      );
      const itemsDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        existing.itemsDisplayConfigId,
        itemsDisplayConfig,
        displayOptions.itemsSortingOptions,
      );

      const updatedCollection = await tx.collection.update({
        where: { id },
        data: {
          title,
          color,
          visibility,
          parentId: parent.parentId,
          parentVisibility: parent.parentVisibility,
          finalVisibility,
          itemsDefaultTemplateId,
          childrenDisplayConfigId,
          itemsDisplayConfigId,
          scrapedFromUrl,
          image: nextImage,
          updatedAt: new Date(),
        },
      });

      await syncCollectionDatumEntries(
        tx,
        updatedCollection.id,
        updatedCollection.finalVisibility,
        dataPayload as ManagedCollectionDatumPayload[],
        existing.data,
      );

      return updatedCollection;
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
