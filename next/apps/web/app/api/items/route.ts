import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { computeFinalVisibility, resolveItemContext, syncDatumEntries, type ManagedDatumPayload } from "@/lib/item-persistence";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

const datumSchema = z.object({
  id: z.string().nullable().optional(),
  label: z.string(),
  type: z.string().min(1),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
  position: z.number().int().optional(),
  value: z.string().nullable().optional(),
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

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);
  const collectionId = req.nextUrl.searchParams.get("collectionId");
  const tagId = req.nextUrl.searchParams.get("tagId");
  const query = req.nextUrl.searchParams.get("q")?.trim();

  const where = {
    ownerId: result.session.user.id,
    ...(collectionId ? { collectionId } : {}),
    ...(tagId ? { tags: { some: { id: tagId } } } : {}),
    ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.item.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: perPage,
      include: {
        tags: true,
        data: { orderBy: { position: "asc" } },
        collection: { select: { id: true, title: true } },
        relatedItems: { select: { id: true, name: true } },
        relatedTo: { select: { id: true, name: true } },
        _count: { select: { loans: true } },
      },
    }),
    prisma.item.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = itemSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 400);

  const { name, quantity, visibility, collectionId, scrapedFromUrl, image, imageSmallThumbnail, imageLargeThumbnail, tagIds, relatedItemIds, dataPayload } = parsed.data;
  const context = await resolveItemContext(result.session.user.id, collectionId ?? null, tagIds);
  if ("error" in context) return jsonError(context.error ?? "Invalid item context", 400);

  const validatedRelatedItemIds = await validateRelatedItems(result.session.user.id, relatedItemIds);
  if ("error" in validatedRelatedItemIds) return jsonError(validatedRelatedItemIds.error ?? "Invalid related items", 400);

  const item = await prisma.$transaction(async (tx) => {
    const createdItem = await tx.item.create({
      data: {
        name,
        quantity,
        visibility,
        parentVisibility: context.parentVisibility,
        finalVisibility: computeFinalVisibility(visibility, context.parentVisibility),
        collectionId: collectionId || null,
        ownerId: result.session.user.id,
        scrapedFromUrl: scrapedFromUrl || null,
        image: image || null,
        imageSmallThumbnail: imageSmallThumbnail || null,
        imageLargeThumbnail: imageLargeThumbnail || null,
        tags: tagIds.length > 0 ? { connect: [...new Set(tagIds)].map((tagId) => ({ id: tagId })) } : undefined,
        relatedItems: validatedRelatedItemIds.ids.length > 0 ? { connect: validatedRelatedItemIds.ids.map((id) => ({ id })) } : undefined,
      },
      include: {
        tags: true,
        data: { orderBy: { position: "asc" } },
        collection: { select: { id: true, title: true } },
      },
    });

    await syncDatumEntries(tx, createdItem.id, createdItem.finalVisibility, dataPayload as ManagedDatumPayload[], []);

    return tx.item.findUniqueOrThrow({
      where: { id: createdItem.id },
      include: {
        tags: true,
        data: { orderBy: { position: "asc" } },
        collection: { select: { id: true, title: true } },
        relatedItems: { select: { id: true, name: true } },
        relatedTo: { select: { id: true, name: true } },
      },
    });
  });

  await logApiAction(result.session.user.id, "create", item.id, item.name, "Item");
  return NextResponse.json(item, { status: 201 });
}

async function validateRelatedItems(ownerId: string, relatedItemIds: string[]) {
  const ids = [...new Set(relatedItemIds)];
  if (ids.length === 0) return { ids };
  const count = await prisma.item.count({ where: { ownerId, id: { in: ids } } });
  if (count !== ids.length) return { error: "One or more related items are invalid" } as const;
  return { ids };
}
