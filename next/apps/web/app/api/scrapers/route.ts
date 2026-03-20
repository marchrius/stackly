import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@koillection/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

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

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);

  const [data, total] = await Promise.all([
    prisma.scraper.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { name: "asc" },
      skip,
      take: perPage,
      include: { _count: { select: { dataPaths: true } } },
    }),
    prisma.scraper.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = scraperSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const scraper = await prisma.scraper.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type || null,
      urlPattern: parsed.data.urlPattern || null,
      namePath: parsed.data.namePath || null,
      imagePath: parsed.data.imagePath || null,
      pricePath: parsed.data.pricePath || null,
      headers: toNullableJsonValue(parsed.data.headers),
      ownerId: result.session.user.id,
      dataPaths: {
        create: parsed.data.dataPaths.map((path, index) => ({
          name: path.name,
          type: path.type,
          path: path.path,
          position: path.position ?? index + 1,
          ownerId: result.session.user.id,
        })),
      },
    },
    include: { dataPaths: { orderBy: { position: "asc" } }, _count: { select: { dataPaths: true } } },
  });

  await logApiAction(result.session.user.id, "create", scraper.id, scraper.name, "Scraper");
  return NextResponse.json(scraper, { status: 201 });
}
