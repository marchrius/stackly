import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

const fieldSchema = z.object({
  name: z.string().trim().min(1, "Il nome del campo è obbligatorio").max(255),
  type: z.string().trim().min(1).max(15),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
  choiceListId: z.string().nullable().optional(),
});

const templateSchema = z.object({
  name: z.string().trim().min(1, "Il nome del template è obbligatorio").max(255),
  fields: z.array(fieldSchema).default([]),
});

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);

  const [data, total] = await Promise.all([
    prisma.template.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { name: "asc" },
      skip,
      take: perPage,
      include: {
        fields: { orderBy: { position: "asc" } },
        _count: { select: { collections: true } },
      },
    }),
    prisma.template.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = templateSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const choiceListIds = [...new Set(parsed.data.fields.map((field) => field.choiceListId).filter(Boolean))] as string[];
  if (choiceListIds.length > 0) {
    const count = await prisma.choiceList.count({
      where: { ownerId: result.session.user.id, id: { in: choiceListIds } },
    });
    if (count !== choiceListIds.length) return jsonError("Choice list non trovata", 400);
  }

  const template = await prisma.template.create({
    data: {
      name: parsed.data.name,
      ownerId: result.session.user.id,
      fields: {
        create: parsed.data.fields.map((field, index) => ({
          name: field.name,
          type: field.type,
          visibility: field.visibility,
          choiceListId: field.choiceListId || null,
          ownerId: result.session.user.id,
          position: index + 1,
        })),
      },
    },
    include: {
      fields: { orderBy: { position: "asc" } },
      _count: { select: { collections: true } },
    },
  });

  await logApiAction(result.session.user.id, "create", template.id, template.name, "Template");
  return NextResponse.json(template, { status: 201 });
}
