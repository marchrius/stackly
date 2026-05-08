import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

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

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);

  const [data, total] = await Promise.all([
    prisma.tagCategory.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { label: "asc" },
      skip,
      take: perPage,
      include: { _count: { select: { tags: true } } },
    }),
    prisma.tagCategory.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = categorySchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid payload", 400);

  const category = await prisma.tagCategory.create({
    data: {
      label: parsed.data.label,
      description: parsed.data.description || null,
      color: parsed.data.color ? normalizeColor(parsed.data.color) : null,
      ownerId: result.session.user.id,
    },
    include: { _count: { select: { tags: true } } },
  });

  await logApiAction(result.session.user.id, "create", category.id, category.label, "TagCategory");
  return NextResponse.json(category, { status: 201 });
}

function normalizeColor(value: string) {
  return value.startsWith("#") ? value : `#${value}`;
}
