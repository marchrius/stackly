import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@stackly/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const pathSchema = z.object({
  name: z.string().trim().min(1, "Il nome del path è obbligatorio").max(255),
  type: z.string().trim().min(1).max(15),
  path: z.string().trim().min(1, "Il path è obbligatorio"),
  position: z.number().int().positive().optional(),
});

const scraperSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(255),
  type: z.string().trim().nullable().optional(),
  urlPattern: z.string().trim().nullable().optional(),
  namePath: z.string().trim().nullable().optional(),
  imagePath: z.string().trim().nullable().optional(),
  pricePath: z.string().trim().nullable().optional(),
  headers: z.unknown().default([]),
  dataPaths: z.array(pathSchema).default([]),
});

function toNullableJsonValue(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  if (value === null) return Prisma.JsonNull;
  if (Array.isArray(value)) return value as Prisma.InputJsonArray;
  if (value && typeof value === "object") return value as Prisma.InputJsonObject;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return [];
}

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const scraper = await prisma.scraper.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: { dataPaths: { orderBy: { position: "asc" } }, _count: { select: { dataPaths: true } } },
  });

  if (!scraper) return jsonError("Scraper non trovato", 404);
  return NextResponse.json(scraper);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.scraper.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Scraper non trovato", 404);

  const parsed = scraperSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const scraper = await prisma.$transaction(async (tx) => {
    await tx.scraper.update({
      where: { id },
      data: {
        name: parsed.data.name,
        type: parsed.data.type || null,
        urlPattern: parsed.data.urlPattern || null,
        namePath: parsed.data.namePath || null,
        imagePath: parsed.data.imagePath || null,
        pricePath: parsed.data.pricePath || null,
        headers: toNullableJsonValue(parsed.data.headers),
        updatedAt: new Date(),
      },
    });

    await tx.path.deleteMany({ where: { scraperId: id } });

    if (parsed.data.dataPaths.length > 0) {
      await tx.path.createMany({
        data: parsed.data.dataPaths.map((path, index) => ({
          name: path.name,
          type: path.type,
          path: path.path,
          position: path.position ?? index + 1,
          ownerId: result.session.user.id,
          scraperId: id,
        })),
      });
    }

    return tx.scraper.findUniqueOrThrow({
      where: { id },
      include: { dataPaths: { orderBy: { position: "asc" } }, _count: { select: { dataPaths: true } } },
    });
  });

  await logApiAction(result.session.user.id, "update", scraper.id, scraper.name, "Scraper");
  return NextResponse.json(scraper);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.scraper.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Scraper non trovato", 404);

  await prisma.scraper.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.name, "Scraper", true);
  return new NextResponse(null, { status: 204 });
}
