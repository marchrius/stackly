import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  const logs = await prisma.log.findMany({
    where: { ownerId: session.user.id },
    orderBy: { loggedAt: "desc" },
    take: 100,
  });
  return NextResponse.json(logs);
}

