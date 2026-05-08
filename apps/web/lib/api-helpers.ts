import { auth } from "@/auth";
import { ROLES } from "@stackly/lib";
import { prisma } from "@stackly/db";
import { NextResponse } from "next/server";

export type ApiSession = {
  user: {
    id: string;
    roles?: string[];
  };
};

export async function requireApiSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      response: NextResponse.json({ error: "Non autenticato" }, { status: 401 }),
    } as const;
  }

  return { session: session as ApiSession } as const;
}

export async function requireApiAdminSession() {
  const result = await requireApiSession();
  if ("response" in result) {
    return result;
  }

  if (!(result.session.user.roles ?? []).includes(ROLES.ADMIN)) {
    return {
      response: NextResponse.json({ error: "Non autorizzato" }, { status: 403 }),
    } as const;
  }

  return result;
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const perPage = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("perPage") ?? "30", 10) || 30));

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
  };
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function logApiAction(
  ownerId: string,
  type: "create" | "update" | "delete",
  objectId: string,
  objectLabel: string,
  objectClass: string,
  objectDeleted = false,
) {
  await prisma.log.create({
    data: {
      type,
      loggedAt: new Date(),
      objectId,
      objectLabel,
      objectClass,
      objectDeleted,
      ownerId,
    },
  });
}
