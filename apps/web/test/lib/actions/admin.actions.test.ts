import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockRevalidatePath, mockPrisma } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockPrisma: {
    configuration: {
      upsert: vi.fn(),
    },
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  requireAdmin: mockRequireAdmin,
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@stackly/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn(async () => "hashed-password"),
  },
}));

import { createAdminUser, updateAdminConfiguration, updateUserAdminRole, updateUserEnabled } from "@/lib/actions/admin.actions";

describe("updateAdminConfiguration", () => {
  beforeEach(() => {
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.configuration.upsert.mockImplementation((payload: unknown) => payload);
    mockPrisma.$transaction.mockImplementation(async (operations: unknown[]) => operations);
  });

  it("normalizes values and revalidates affected paths", async () => {
    const formData = new FormData();
    formData.set("thumbnailsFormat", "keep-original");
    formData.set("customLightThemeCss", "  body { color: black; }  ");
    formData.set("customDarkThemeCss", "");
    formData.set("enableMetrics", "true");

    const result = await updateAdminConfiguration(formData);

    expect(result).toEqual({ success: true });
    expect(mockRequireAdmin).toHaveBeenCalled();
    expect(mockPrisma.configuration.upsert).toHaveBeenCalledTimes(4);
    expect(mockPrisma.configuration.upsert).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { label: "thumbnails-format" },
      create: expect.objectContaining({ value: null }),
      update: expect.objectContaining({ value: null }),
    }));
    expect(mockPrisma.configuration.upsert).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { label: "custom-light-theme-css" },
      create: expect.objectContaining({ value: "body { color: black; }" }),
      update: expect.objectContaining({ value: "body { color: black; }" }),
    }));
    expect(mockPrisma.configuration.upsert).toHaveBeenNthCalledWith(3, expect.objectContaining({
      where: { label: "custom-dark-theme-css" },
      create: expect.objectContaining({ value: null }),
      update: expect.objectContaining({ value: null }),
    }));
    expect(mockPrisma.configuration.upsert).toHaveBeenNthCalledWith(4, expect.objectContaining({
      where: { label: "enable-metrics" },
      create: expect.objectContaining({ value: "1" }),
      update: expect.objectContaining({ value: "1" }),
    }));
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, "/settings/admin");
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(2, "/", "layout");
  });

  it("returns validation errors for invalid payloads", async () => {
    const formData = new FormData();
    formData.set("enableMetrics", "maybe");

    const result = await updateAdminConfiguration(formData);

    expect(result).toHaveProperty("error");
    expect(mockPrisma.configuration.upsert).not.toHaveBeenCalled();
  });
});

describe("admin user actions", () => {
  beforeEach(() => {
    mockRequireAdmin.mockResolvedValue({ user: { id: "admin-1" } });
    mockPrisma.user.create.mockResolvedValue({ id: "user-2" });
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-2", roles: ["ROLE_USER"] });
    mockPrisma.user.update.mockResolvedValue({});
  });

  it("creates an enabled admin user with a hashed password", async () => {
    const formData = new FormData();
    formData.set("username", "newuser");
    formData.set("email", "new@example.com");
    formData.set("password", "temporary-password");
    formData.set("enabled", "on");
    formData.set("isAdmin", "on");

    const result = await createAdminUser(formData);

    expect(result).toEqual({ success: true, id: "user-2" });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        username: "newuser",
        email: "new@example.com",
        password: "hashed-password",
        enabled: true,
        roles: ["ROLE_USER", "ROLE_ADMIN"],
      }),
      select: { id: true },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/settings/admin/users");
  });

  it("does not change the current user's own admin role", async () => {
    const formData = new FormData();
    formData.set("isAdmin", "");

    await updateUserAdminRole("admin-1", formData);

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("does not disable the current user", async () => {
    const formData = new FormData();

    await updateUserEnabled("admin-1", formData);

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("disables another user", async () => {
    const formData = new FormData();

    await updateUserEnabled("user-2", formData);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { enabled: false },
    });
  });
});
