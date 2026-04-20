import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  oAuthProvider: {
    findUnique: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@koillection/db", () => ({
  prisma: prismaMock,
}));

import { resolveUserForOidcSignIn } from "@/lib/auth/oidc-signin";

describe("resolveUserForOidcSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns link_required when existing credentials user has same email", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      username: "local-user",
      email: "local@example.com",
      enabled: true,
      primaryAuthMethod: "credentials",
    });

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-1",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-1", iss: "https://issuer.example" } as any,
      user: { email: "local@example.com", name: "Local User", image: null },
    });

    expect(result).toEqual({ status: "link_required" });
    expect(prismaMock.oAuthProvider.create).not.toHaveBeenCalled();
  });

  it("creates new oidc user when email not found", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValue({
      id: "u2",
      username: "new_user",
      email: "new@example.com",
      avatar: null,
      roles: ["ROLE_USER"],
      currency: "EUR",
      locale: "en",
      theme: "auto",
      dateFormat: "Y-m-d",
    });

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-2",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-2", iss: "https://issuer.example" } as any,
      user: { email: "new@example.com", name: "New User", image: null },
    });

    expect((result as any)?.status).toBe("ok");
    expect(prismaMock.user.create).toHaveBeenCalled();
  });
});
