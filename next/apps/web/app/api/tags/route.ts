import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

const tagSchema = z.object({
  label: z.string().trim().min(1, "Il nome del tag è obbligatorio").max(255),
  description: z.string().trim().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
});

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);

  const [data, total] = await Promise.all([
    prisma.tag.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { label: "asc" },
      skip,
      take: perPage,
      include: { category: true, _count: { select: { items: true } } },
    }),
    prisma.tag.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

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

  const tag = await prisma.tag.create({
    data: {
      label,
      description: description || null,
      categoryId: categoryId || null,
      visibility,
      ownerId: result.session.user.id,
    },
    include: { category: true, _count: { select: { items: true } } },
  });

  await logApiAction(result.session.user.id, "create", tag.id, tag.label, "Tag");
  return NextResponse.json(tag, { status: 201 });
}
