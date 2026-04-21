import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

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

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(new URL(req.url).searchParams);

  const [data, total] = await Promise.all([
    prisma.choiceList.findMany({
      where: { ownerId: result.session.user.id },
      orderBy: { name: "asc" },
      skip,
      take: perPage,
      include: { _count: { select: { fields: true, data: true } } },
    }),
    prisma.choiceList.count({ where: { ownerId: result.session.user.id } }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = choiceListSchema.safeParse(normalizeBody(await req.json()));
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const choiceList = await prisma.choiceList.create({
    data: {
      name: parsed.data.name,
      choices: parsed.data.choices,
      ownerId: result.session.user.id,
    },
    include: { _count: { select: { fields: true, data: true } } },
  });

  await logApiAction(result.session.user.id, "create", choiceList.id, choiceList.name, "ChoiceList");
  return NextResponse.json(choiceList, { status: 201 });
}
