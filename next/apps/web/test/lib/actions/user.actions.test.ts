import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAuth, mockRevalidatePath, mockCookieSet, mockPrisma } = vi.hoisted(() => ({
  mockRequireAuth: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockCookieSet: vi.fn(),
  mockPrisma: {
    user: {
      update: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAuth: mockRequireAuth,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: mockCookieSet,
  })),
}));

vi.mock("@koillection/db", () => ({
  prisma: mockPrisma,
}));

import { updateSettings } from "@/lib/actions/user.actions";

describe("updateSettings", () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.user.update.mockResolvedValue({});
  });

  it("persists theme settings and revalidates layout", async () => {
    const formData = new FormData();
    formData.set("currency", "EUR");
    formData.set("locale", "it");
    formData.set("timezone", "Europe/Rome");
    formData.set("dateFormat", "Y-m-d");
    formData.set("theme", "d_ink");
    formData.set("visibility", "internal");

    const result = await updateSettings(formData);

    expect(result).toEqual({ success: true });
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: expect.objectContaining({
        currency: "EUR",
        locale: "it",
        timezone: "Europe/Rome",
        dateFormat: "Y-m-d",
        theme: "d_ink",
        visibility: "internal",
        updatedAt: expect.any(Date),
      }),
    });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "koillection_locale",
      "it",
      expect.objectContaining({
        path: "/",
        sameSite: "lax",
      }),
    );
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, "/", "layout");
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(2, "/settings");
  });

  it("returns validation error for invalid theme", async () => {
    const formData = new FormData();
    formData.set("currency", "EUR");
    formData.set("locale", "it");
    formData.set("dateFormat", "Y-m-d");
    formData.set("theme", "broken-theme");
    formData.set("visibility", "public");

    const result = await updateSettings(formData);

    expect(result).toHaveProperty("error");
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(mockCookieSet).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
