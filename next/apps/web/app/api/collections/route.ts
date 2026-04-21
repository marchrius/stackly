import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@stackly/db";
import { computeFinalVisibility, resolveCollectionParent, TreeValidationError } from "@/lib/collections-tree";
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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("perPage") ?? "30", 10);
  const parentParam = searchParams.get("parentId");
  const parentId = parentParam === null || parentParam === "" ? null : parentParam;

  const where = { ownerId: session.user.id, parentId };

  const [data, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { _count: { select: { children: true, items: true } } },
    }),
    prisma.collection.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  try {
    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const color = typeof body.color === "string" && body.color.length > 0 ? body.color.replace(/^#/, "") : null;
    const visibility =
      body.visibility === "public" || body.visibility === "internal" || body.visibility === "private"
        ? body.visibility
        : "public";
    const parentId = typeof body.parentId === "string" && body.parentId.length > 0 ? body.parentId : null;
    const itemsDefaultTemplateId =
      typeof body.itemsDefaultTemplateId === "string" && body.itemsDefaultTemplateId.length > 0
        ? body.itemsDefaultTemplateId
        : null;
    const scrapedFromUrl = typeof body.scrapedFromUrl === "string" && body.scrapedFromUrl.length > 0 ? body.scrapedFromUrl : null;
    const image = typeof body.image === "string" && body.image.length > 0 ? body.image : null;
    const remoteImageUrl = typeof body.remoteImageUrl === "string" && body.remoteImageUrl.length > 0 ? body.remoteImageUrl : null;
    const dataPayload = Array.isArray(body.dataPayload) ? datumSchema.array().parse(body.dataPayload) : [];
    const childrenDisplayConfig = displayConfigSchema.parse(body.childrenDisplayConfigPayload ?? {});
    const itemsDisplayConfig = displayConfigSchema.parse(body.itemsDisplayConfigPayload ?? {});

    if (!title) {
      return NextResponse.json({ error: "Il titolo e obbligatorio" }, { status: 400 });
    }

    const resolvedImage = remoteImageUrl
      ? await downloadRemoteAsset({ url: remoteImageUrl, userId: session.user.id, entity: "collections", kind: "image" })
      : null;

    const parent = await resolveCollectionParent({
      ownerId: session.user.id,
      parentId,
    });

    const collection = await prisma.$transaction(async (tx) => {
      const displayOptions = await getCollectionDisplayConfigOptions(tx, session.user.id, null);
      const childrenDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        null,
        childrenDisplayConfig,
        displayOptions.childrenSortingOptions,
      );
      const itemsDisplayConfigId = await upsertDisplayConfiguration(
        tx,
        session.user.id,
        null,
        itemsDisplayConfig,
        displayOptions.itemsSortingOptions,
      );

      const createdCollection = await tx.collection.create({
        data: {
          title,
          color,
          visibility,
          parentVisibility: parent.parentVisibility,
          finalVisibility: computeFinalVisibility(visibility, parent.parentVisibility),
          parentId: parent.parentId,
          itemsDefaultTemplateId,
          childrenDisplayConfigId,
          itemsDisplayConfigId,
          scrapedFromUrl,
          image: resolvedImage?.smallThumbnail ?? resolvedImage?.path ?? image,
          ownerId: session.user.id,
        },
      });

      await syncCollectionDatumEntries(
        tx,
        createdCollection.id,
        createdCollection.finalVisibility,
        dataPayload as ManagedCollectionDatumPayload[],
        [],
      );

      return createdCollection;
    });

    await prisma.log.create({
      data: {
        type: "create",
        loggedAt: new Date(),
        objectId: collection.id,
        objectLabel: collection.title,
        objectClass: "Collection",
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    if (error instanceof TreeValidationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
