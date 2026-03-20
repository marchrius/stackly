import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

const { mockRequireApiSession, mockParsePagination, mockPrisma } = vi.hoisted(() => ({
  mockRequireApiSession: vi.fn(),
  mockParsePagination: vi.fn(),
  mockPrisma: {
    log: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-helpers", () => ({
  requireApiSession: mockRequireApiSession,
  parsePagination: mockParsePagination,
}));

vi.mock("@koillection/db", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/logs/route";

describe("GET /api/logs", () => {
  it("returns the auth response when the session is missing", async () => {
    mockRequireApiSession.mockResolvedValue({
      response: NextResponse.json({ error: "Non autenticato" }, { status: 401 }),
    });

    const response = await GET(new NextRequest("http://localhost/api/logs"));
    expect(response).toBeDefined();
    if (!response) throw new Error("Expected a response");

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Non autenticato" });
  });

  it("applies filters and pagination to the log query", async () => {
    mockRequireApiSession.mockResolvedValue({ session: { user: { id: "user-1" } } });
    mockParsePagination.mockReturnValue({ page: 2, perPage: 10, skip: 10 });
    mockPrisma.log.findMany.mockResolvedValue([{ id: "log-1" }]);
    mockPrisma.log.count.mockResolvedValue(23);

    const response = await GET(
      new NextRequest("http://localhost/api/logs?page=2&perPage=10&type=create&objectClass=Item&objectId=item-1&q=rare"),
    );
    expect(response).toBeDefined();
    if (!response) throw new Error("Expected a response");

    expect(mockPrisma.log.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        ownerId: "user-1",
        type: "create",
        objectClass: "Item",
        objectId: "item-1",
        OR: [
          { objectLabel: { contains: "rare", mode: "insensitive" } },
          { objectClass: { contains: "rare", mode: "insensitive" } },
        ],
      },
      skip: 10,
      take: 10,
    }));

    await expect(response.json()).resolves.toEqual({
      data: [{ id: "log-1" }],
      total: 23,
      page: 2,
      perPage: 10,
      totalPages: 3,
      filters: {
        type: "create",
        objectClass: "Item",
        objectId: "item-1",
        q: "rare",
      },
    });
  });
});
