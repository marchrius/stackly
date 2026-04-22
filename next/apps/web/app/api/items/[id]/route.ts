import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { computeFinalVisibility, resolveItemContext, syncDatumEntries, type ManagedDatumPayload } from "@/lib/item-persistence";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const datumSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string(),
  type: z.string().min(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
  displayMode: z.enum(["pill", "list"]).default("list"),
  position: z.number().int().optional(),
  value: z.string().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  image: z.string().nullable().optional(),
  imageSmallThumbnail: z.string().nullable().optional(),
  file: z.string().nullable().optional(),
  video: z.string().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  remoteUrl: z.string().nullable().optional(),
});

const itemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(255),
  quantity: z.coerce.number().int().min(1).default(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  collectionId: z.string().nullable().optional(),
  scrapedFromUrl: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  imageSmallThumbnail: z.string().nullable().optional(),
  imageLargeThumbnail: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional().default([]),
  relatedItemIds: z.array(z.string()).optional().default([]),
  dataPayload: z.array(datumSchema).optional().default([]),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const item = await prisma.item.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: {
      data: { orderBy: { position: "asc" } },
      tags: true,
      loans: { orderBy: { lentAt: "desc" } },
      collection: { select: { id: true, title: true } },
      relatedItems: { select: { id: true, name: true } },
      relatedTo: { select: { id: true, name: true } },
    },
  });

  if (!item) return jsonError("Item not found", 404);
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.item.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: { data: true },
  });
  if (!existing) return jsonError("Item not found", 404);

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 400);

  const { name, quantity, visibility, collectionId, scrapedFromUrl, image, imageSmallThumbnail, imageLargeThumbnail, tagIds, relatedItemIds, dataPayload } = parsed.data;
  const context = await resolveItemContext(result.session.user.id, collectionId ?? null, tagIds);
  if ("error" in context) return jsonError(context.error ?? "Invalid item context", 400);

  const validatedRelatedItemIds = await validateRelatedItems(result.session.user.id, relatedItemIds, id);
  if ("error" in validatedRelatedItemIds) return jsonError(validatedRelatedItemIds.error ?? "Invalid related items", 400);

  const item = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.item.update({
      where: { id },
      data: {
        name,
        quantity,
        visibility,
        collectionId: collectionId || null,
        parentVisibility: context.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, context.parentVisibility),
        scrapedFromUrl: scrapedFromUrl || null,
        image: image || null,
        imageSmallThumbnail: imageSmallThumbnail || null,
        imageLargeThumbnail: imageLargeThumbnail || null,
        updatedAt: new Date(),
        tags: { set: [...new Set(tagIds)].map((tagId) => ({ id: tagId })) },
        relatedItems: { set: validatedRelatedItemIds.ids.map((id) => ({ id })) },
      },
    });

    await syncDatumEntries(tx, updatedItem.id, updatedItem.finalVisibility, dataPayload as ManagedDatumPayload[], existing.data);

    return tx.item.findUniqueOrThrow({
      where: { id: updatedItem.id },
      include: {
        tags: true,
        data: { orderBy: { position: "asc" } },
        loans: { orderBy: { lentAt: "desc" } },
        collection: { select: { id: true, title: true } },
        relatedItems: { select: { id: true, name: true } },
        relatedTo: { select: { id: true, name: true } },
      },
    });
  });

  await logApiAction(result.session.user.id, "update", item.id, item.name, "Item");
  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const item = await prisma.item.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!item) return jsonError("Item not found", 404);

  await prisma.item.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, item.name, "Item", true);

  return new NextResponse(null, { status: 204 });
}

async function validateRelatedItems(ownerId: string, relatedItemIds: string[], currentItemId?: string) {
  const ids = [...new Set(relatedItemIds)].filter((id) => id !== currentItemId);
  if (ids.length === 0) return { ids };
  const count = await prisma.item.count({ where: { ownerId, id: { in: ids } } });
  if (count !== ids.length) return { error: "One or more related items are invalid" } as const;
  return { ids };
}
