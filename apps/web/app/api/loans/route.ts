import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@stackly/db";
import { jsonError, logApiAction, parsePagination, requireApiSession } from "@/lib/api-helpers";

const loanSchema = z.object({
  lentTo: z.string().trim().min(1, "Il destinatario è obbligatorio").max(255),
  lentAt: z.coerce.date(),
  returnedAt: z.coerce.date().nullable().optional(),
  itemId: z.string().trim().min(1, "L'oggetto è obbligatorio"),
});

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const searchParams = new URL(req.url).searchParams;
  const { page, perPage, skip } = parsePagination(searchParams);
  const itemId = searchParams.get("itemId");
  const status = searchParams.get("status");

  const where = {
    ownerId: result.session.user.id,
    ...(itemId ? { itemId } : {}),
    ...(status === "active" ? { returnedAt: null } : {}),
    ...(status === "returned" ? { NOT: { returnedAt: null } } : {}),
  };

  const [data, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      orderBy: { lentAt: "desc" },
      skip,
      take: perPage,
      include: { item: { select: { id: true, name: true } } },
    }),
    prisma.loan.count({ where }),
  ]);

  return NextResponse.json({ data, total, page, perPage, totalPages: Math.ceil(total / perPage) });
}

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const parsed = loanSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const item = await prisma.item.findFirst({
    where: { id: parsed.data.itemId, ownerId: result.session.user.id },
    select: { id: true, name: true },
  });
  if (!item) return jsonError("Oggetto non trovato", 400);

  const loan = await prisma.loan.create({
    data: {
      lentTo: parsed.data.lentTo,
      lentAt: parsed.data.lentAt,
      returnedAt: parsed.data.returnedAt ?? null,
      itemId: item.id,
      ownerId: result.session.user.id,
    },
    include: { item: { select: { id: true, name: true } } },
  });

  await logApiAction(result.session.user.id, "create", loan.id, item.name, "Loan");
  return NextResponse.json(loan, { status: 201 });
}
