import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@koillection/db";
import { jsonError, logApiAction, requireApiSession } from "@/lib/api-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

const loanSchema = z.object({
  lentTo: z.string().trim().min(1, "Il destinatario è obbligatorio").max(255),
  lentAt: z.coerce.date(),
  returnedAt: z.coerce.date().nullable().optional(),
  itemId: z.string().trim().min(1, "L'oggetto è obbligatorio"),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const loan = await prisma.loan.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: { item: { select: { id: true, name: true } } },
  });

  if (!loan) return jsonError("Prestito non trovato", 404);
  return NextResponse.json(loan);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.loan.findFirst({ where: { id, ownerId: result.session.user.id } });
  if (!existing) return jsonError("Prestito non trovato", 404);

  const parsed = loanSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Payload non valido", 400);

  const item = await prisma.item.findFirst({
    where: { id: parsed.data.itemId, ownerId: result.session.user.id },
    select: { id: true, name: true },
  });
  if (!item) return jsonError("Oggetto non trovato", 400);

  const loan = await prisma.loan.update({
    where: { id },
    data: {
      lentTo: parsed.data.lentTo,
      lentAt: parsed.data.lentAt,
      returnedAt: parsed.data.returnedAt ?? null,
      itemId: item.id,
    },
    include: { item: { select: { id: true, name: true } } },
  });

  await logApiAction(result.session.user.id, "update", loan.id, item.name, "Loan");
  return NextResponse.json(loan);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { id } = await params;
  const existing = await prisma.loan.findFirst({
    where: { id, ownerId: result.session.user.id },
    include: { item: { select: { name: true } } },
  });
  if (!existing) return jsonError("Prestito non trovato", 404);

  await prisma.loan.delete({ where: { id } });
  await logApiAction(result.session.user.id, "delete", id, existing.item?.name ?? existing.lentTo, "Loan", true);
  return new NextResponse(null, { status: 204 });
}
