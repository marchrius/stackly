import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const categorySchema = z.object({
  label: z.string().trim().min(1, "Tag category label is required").max(255),
  description: z.string().trim().nullable().optional(),
  color: z
    .string()
    .trim()
    .regex(/^#?[0-9a-fA-F]{6}$/, "Invalid color")
    .nullable()
    .optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const category = await prisma.tagCategory.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: {
      tags: { orderBy: { label: "asc" }, include: { _count: { select: { items: true } } } },
      _count: { select: { tags: true } },
    },
  });

  if (!category) return jsonError("Tag category not found", 404);
  return NextResponse.json(category);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.tagCategory.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Tag category not found", 404);

  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 400);

  const category = await prisma.tagCategory.update({
    where: { id },
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
      color: parsed.data.color ? normalizeColor(parsed.data.color) : null,
      updatedAt: new Date(),
    },
    include: { _count: { select: { tags: true } } },
  });

  await logApiAction(result.session.user.id, "update", category.id, category.label, "TagCategory");
  return NextResponse.json(category);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.tagCategory.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Tag category not found", 404);

  await prisma.tagCategory.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.label, "TagCategory", true);
  return new NextResponse(null, { status: 204 });
}

function normalizeColor(value: string) {
  return value.startsWith("#") ? value : `#${value}`;
}
