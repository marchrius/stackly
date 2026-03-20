import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

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

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const template = await prisma.template.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: {
      fields: { orderBy: { position: "asc" }, include: { choiceList: true } },
      _count: { select: { collections: true } },
    },
  });

  if (!template) return jsonError("Template non trovato", 404);
  return NextResponse.json(template);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.template.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Template non trovato", 404);

  const parsed = templateSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const choiceListIds = [...new Set(parsed.data.fields.map((field) => field.choiceListId).filter(Boolean))] as string[];
  if (choiceListIds.length > 0) {
    const count = await prisma.choiceList.count({
      where: { ownerId: result.session.user.id, id: { in: choiceListIds } },
    });
    if (count !== choiceListIds.length) return jsonError("Choice list non trovata", 400);
  }

  const template = await prisma.$transaction(async (tx) => {
    await tx.template.update({
      where: { id },
      data: { name: parsed.data.name, updatedAt: new Date() },
    });

    await tx.field.deleteMany({ where: { templateId: id } });

    if (parsed.data.fields.length > 0) {
      await tx.field.createMany({
        data: parsed.data.fields.map((field, index) => ({
          name: field.name,
          type: field.type,
          visibility: field.visibility,
          choiceListId: field.choiceListId || null,
          ownerId: result.session.user.id,
          templateId: id,
          position: index + 1,
        })),
      });
    }

    return tx.template.findUniqueOrThrow({
      where: { id },
      include: {
        fields: { orderBy: { position: "asc" } },
        _count: { select: { collections: true } },
      },
    });
  });

  await logApiAction(result.session.user.id, "update", template.id, template.name, "Template");
  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.template.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Template non trovato", 404);

  await prisma.template.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.name, "Template", true);
  return new NextResponse(null, { status: 204 });
}
