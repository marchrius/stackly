import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, prisma } from "@koillection/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const inventory = await prisma.inventory.findFirst({
    where: { id, ownerId: result.session.user.id },
  });

  if (!inventory) return jsonError("Inventario non trovato", 404);
  return NextResponse.json(inventory);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.inventory.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Inventario non trovato", 404);

  const parsed = inventorySchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const inventory = await prisma.inventory.update({
    where: { id },
    data: {
      name: parsed.data.name,
      content: toInputJsonValue(parsed.data.content),
      updatedAt: new Date(),
    },
  });

  await logApiAction(result.session.user.id, "update", inventory.id, inventory.name, "Inventory");
  return NextResponse.json(inventory);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.inventory.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Inventario non trovato", 404);

  await prisma.inventory.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.name, "Inventory", true);
  return new NextResponse(null, { status: 204 });
}
