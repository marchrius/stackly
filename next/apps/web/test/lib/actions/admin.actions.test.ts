import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequireAdmin, mockRevalidatePath, mockPrisma } = vi.hoisted(() => ({
  mockRequireAdmin: vi.fn(),
  mockRevalidatePath: vi.fn(),
  mockPrisma: {
    configuration: {
      upsert: vi.fn(),
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

import { updateAdminConfiguration } from "@/lib/actions/admin.actions";

describe("updateAdminConfiguration", () => {
  beforeEach(() => {
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
