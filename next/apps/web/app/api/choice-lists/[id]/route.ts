import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const choiceListSchema = z.object({
  name: z.string().trim().min(1, "Il nome è obbligatorio").max(255),
  choices: z.array(z.string().trim().min(1)).default([]),
});

function normalizeBody(body: unknown) {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const rawChoices = record.choices;

  let choices: string[] = [];
  if (Array.isArray(rawChoices)) {
    choices = rawChoices.filter((choice): choice is string => typeof choice === "string").map((choice) => choice.trim()).filter(Boolean);
  } else if (typeof rawChoices === "string") {
    choices = rawChoices.split(/\r?\n|,/).map((choice) => choice.trim()).filter(Boolean);
  }

  return {
    name: typeof record.name === "string" ? record.name : "",
    choices,
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const choiceList = await prisma.choiceList.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: { _count: { select: { fields: true, data: true } } },
  });

  if (!choiceList) return jsonError("Choice list non trovata", 404);
  return NextResponse.json(choiceList);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.choiceList.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Choice list non trovata", 404);

  const parsed = choiceListSchema.safeParse(normalizeBody(await req.json()));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const choiceList = await prisma.choiceList.update({
    where: { id },
    data: {
      name: parsed.data.name,
      choices: parsed.data.choices,
      updatedAt: new Date(),
    },
    include: { _count: { select: { fields: true, data: true } } },
  });

  await logApiAction(result.session.user.id, "update", choiceList.id, choiceList.name, "ChoiceList");
  return NextResponse.json(choiceList);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.choiceList.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Choice list non trovata", 404);

  await prisma.choiceList.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.name, "ChoiceList", true);
  return new NextResponse(null, { status: 204 });
}
