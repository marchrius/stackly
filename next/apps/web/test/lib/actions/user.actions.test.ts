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
      count: vi.fn(),
    },
    oAuthProvider: {
      findUnique: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
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

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

import { unlinkOidcProvider, updateSettings, startOidcLink } from "@/lib/actions/user.actions";

describe("updateSettings", () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.user.update.mockResolvedValue({});
    mockRevalidatePath.mockReset();
    mockCookieSet.mockReset();
    process.env.NEXTAUTH_SECRET = "test-secret";
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

describe("startOidcLink", () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCookieSet.mockReset();
    process.env.NEXTAUTH_SECRET = "test-secret";
  });

  it("creates a short-lived linking cookie", async () => {
    const result = await startOidcLink();

    expect(result).toEqual({ success: true });
    expect(mockCookieSet).toHaveBeenCalledWith(
      "koillection_oidc_link",
      expect.any(String),
      expect.objectContaining({
        path: "/",
        sameSite: "lax",
        httpOnly: true,
      }),
    );
  });
});

describe("unlinkOidcProvider", () => {
  beforeEach(() => {
    mockRequireAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.oAuthProvider.findUnique.mockReset();
    mockPrisma.oAuthProvider.count.mockReset();
    mockPrisma.oAuthProvider.delete.mockReset();
    mockPrisma.user.findUnique.mockReset();
    mockPrisma.user.update.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("blocks unlink when it is the last provider and no password exists", async () => {
    mockPrisma.oAuthProvider.findUnique.mockResolvedValue({ id: "p1", userId: "user-1" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", password: "" });
    mockPrisma.oAuthProvider.count.mockResolvedValue(1);

    const result = await unlinkOidcProvider("p1");

    expect(result).toEqual({ error: "connectedProviders.lastProviderError" });
    expect(mockPrisma.oAuthProvider.delete).not.toHaveBeenCalled();
  });

  it("deletes provider and revalidates settings when allowed", async () => {
    mockPrisma.oAuthProvider.findUnique.mockResolvedValue({ id: "p1", userId: "user-1" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1", password: "hash" });
    mockPrisma.oAuthProvider.count.mockResolvedValue(2);
    mockPrisma.oAuthProvider.delete.mockResolvedValue({});

    const result = await unlinkOidcProvider("p1");

    expect(result).toEqual({ success: true });
    expect(mockPrisma.oAuthProvider.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings");
  });
});
