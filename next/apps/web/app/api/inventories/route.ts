import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@koillection/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

const inventorySchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(255),
  content: z.unknown().default([]),
});

function toInputJsonValue(value: unknown): Prisma.InputJsonValue {
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
    prisma.inventory.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { updatedAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.inventory.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = inventorySchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const inventory = await prisma.inventory.create({
    data: {
      name: parsed.data.name,
      content: toInputJsonValue(parsed.data.content),
      ownerId: result.session.user.id,
    },
  });

  await logApiAction(result.session.user.id, "create", inventory.id, inventory.name, "Inventory");
  return NextResponse.json(inventory, { status: 201 });
}
