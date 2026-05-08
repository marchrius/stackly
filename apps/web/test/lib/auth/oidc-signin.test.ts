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

const cookieState = vi.hoisted(() => ({
  value: undefined as string | undefined,
  delete: vi.fn(),
}));

vi.mock("@stackly/db", () => ({
  prisma: prismaMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => (
      (name === "stackly_oidc_link" || name === "koillection_oidc_link") && cookieState.value
        ? { value: cookieState.value }
        : undefined
    ),
    delete: cookieState.delete,
  })),
}));

import { resolveUserForOidcSignIn } from "@/lib/auth/oidc-signin";
import { createOidcLinkCookieValue } from "@/lib/auth/oidc-link-cookie";

describe("resolveUserForOidcSignIn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieState.value = undefined;
    cookieState.delete.mockReset();
    process.env.NEXTAUTH_SECRET = "test-secret";
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

  it("links an existing credentials user when the link cookie matches", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      username: "local-user",
      email: "local@example.com",
      enabled: true,
      primaryAuthMethod: "credentials",
    });
    cookieState.value = await createOidcLinkCookieValue("u1", "test-secret", 300);

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-3",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-3", iss: "https://issuer.example" } as any,
      user: { email: "local@example.com", name: "Local User", image: null },
    });

    expect((result as any)?.status).toBe("ok");
    expect(prismaMock.oAuthProvider.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          providerName: "oidc",
          subject: "sub-3",
          email: "local@example.com",
        }),
      }),
    );
    expect(cookieState.delete).toHaveBeenCalledWith("stackly_oidc_link");
  });

  it("links the signed-in user from settings even when the OIDC email is different", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        id: "u1",
        username: "local-user",
        email: "local@example.com",
        avatar: null,
        enabled: true,
        roles: ["ROLE_USER"],
        currency: "EUR",
        locale: "en",
        theme: "auto",
        dateFormat: "Y-m-d",
        primaryAuthMethod: "credentials",
      })
      .mockResolvedValueOnce(null);
    cookieState.value = await createOidcLinkCookieValue("u1", "test-secret", 300);

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-4",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-4", iss: "https://issuer.example" } as any,
      user: { email: "external@example.com", name: "External User", image: null },
    });

    expect((result as any)?.status).toBe("ok");
    expect(prismaMock.oAuthProvider.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "u1",
          subject: "sub-4",
          email: "external@example.com",
          displayName: "External User",
        }),
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { primaryAuthMethod: "oidc" },
    });
  });

  it("rejects a settings link when the OIDC email belongs to another user", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue(null);
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        id: "u1",
        username: "local-user",
        email: "local@example.com",
        enabled: true,
        primaryAuthMethod: "credentials",
      })
      .mockResolvedValueOnce({
        id: "u2",
        username: "other-user",
        email: "external@example.com",
        enabled: true,
      });
    cookieState.value = await createOidcLinkCookieValue("u1", "test-secret", 300);

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-5",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-5", iss: "https://issuer.example" } as any,
      user: { email: "external@example.com", name: "External User", image: null },
    });

    expect(result).toEqual({ status: "link_forbidden" });
    expect(prismaMock.oAuthProvider.create).not.toHaveBeenCalled();
    expect(cookieState.delete).toHaveBeenCalledWith("stackly_oidc_link");
    expect(cookieState.delete).toHaveBeenCalledWith("koillection_oidc_link");
  });

  it("rejects a settings link when the OIDC subject is already linked to another user", async () => {
    prismaMock.oAuthProvider.findUnique.mockResolvedValue({
      id: "provider-1",
      userId: "u2",
      email: "other@example.com",
      displayName: "Other User",
      picture: null,
      refreshToken: null,
      user: {
        id: "u2",
        username: "other-user",
        email: "other@example.com",
        enabled: true,
      },
    });
    cookieState.value = await createOidcLinkCookieValue("u1", "test-secret", 300);

    const result = await resolveUserForOidcSignIn({
      account: {
        type: "oidc",
        provider: "oidc",
        providerAccountId: "sub-6",
        issuer: "https://issuer.example",
      } as any,
      profile: { sub: "sub-6", iss: "https://issuer.example" } as any,
      user: { email: "other@example.com", name: "Other User", image: null },
    });

    expect(result).toEqual({ status: "link_forbidden" });
    expect(prismaMock.oAuthProvider.update).not.toHaveBeenCalled();
    expect(cookieState.delete).toHaveBeenCalledWith("stackly_oidc_link");
    expect(cookieState.delete).toHaveBeenCalledWith("koillection_oidc_link");
  });
});
