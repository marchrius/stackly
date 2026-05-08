import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const tagSchema = z.object({
  label: z.string().trim().min(1, "Il nome del tag è obbligatorio").max(255),
  description: z.string().trim().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const tag = await prisma.tag.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: {
      category: true,
      items: { orderBy: { name: "asc" }, take: 50 },
      _count: { select: { items: true } },
    },
  });

  if (!tag) return jsonError("Tag non trovato", 404);
  return NextResponse.json(tag);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.tag.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Tag non trovato", 404);

  const parsed = tagSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const { label, description, categoryId, visibility } = parsed.data;

  if (categoryId) {
    const category = await prisma.tagCategory.findFirst({
      where: { id: categoryId, ownerId: result.session.user.id },
      select: { id: true },
    });
    if (!category) return jsonError("Categoria tag non trovata", 400);
  }

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      label,
      description: description || null,
      categoryId: categoryId || null,
      visibility,
      updatedAt: new Date(),
    },
    include: { category: true, _count: { select: { items: true } } },
  });

  await logApiAction(result.session.user.id, "update", tag.id, tag.label, "Tag");
  return NextResponse.json(tag);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.tag.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Tag non trovato", 404);

  await prisma.tag.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.label, "Tag", true);
  return new NextResponse(null, { status: 204 });
}
