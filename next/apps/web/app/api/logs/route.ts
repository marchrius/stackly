import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@koillection/db";
import { parsePagination, requireApiSession } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const { page, perPage, skip } = parsePagination(req.nextUrl.searchParams);
  const type = req.nextUrl.searchParams.get("type")?.trim();
  const objectClass = req.nextUrl.searchParams.get("objectClass")?.trim();
  const objectId = req.nextUrl.searchParams.get("objectId")?.trim();
  const query = req.nextUrl.searchParams.get("q")?.trim();

  const where = {
    ownerId: result.session.user.id,
    ...(type ? { type } : {}),
    ...(objectClass ? { objectClass } : {}),
    ...(objectId ? { objectId } : {}),
    ...(query
      ? {
          OR: [
            { objectLabel: { contains: query, mode: "insensitive" as const } },
            { objectClass: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.log.findMany({
      where,
      orderBy: { loggedAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({
    data,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    filters: {
      type: type ?? null,
      objectClass: objectClass ?? null,
      objectId: objectId ?? null,
      q: query ?? null,
    },
  });
}
