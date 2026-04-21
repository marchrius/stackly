import { prisma } from "@stackly/db";
import type { Account, Profile } from "next-auth";
import { cookies } from "next/headers";
import {
  LEGACY_OIDC_LINK_COOKIE_NAME,
  OIDC_LINK_COOKIE_NAME,
  readOidcLinkCookieValue,
} from "@/lib/auth/oidc-link-cookie";

function normalizeRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value as string[];
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed as string[];
    } catch {
      return ["ROLE_USER"];
    }
  }

  return ["ROLE_USER"];
}

function generateUsername(seed: string): string {
  const normalized = seed
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return (normalized || "user").slice(0, 32);
}

async function generateUniqueUsername(seed: string): Promise<string> {
  const base = generateUsername(seed);
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;

    const suffix = `_${counter}`;
    candidate = `${base.slice(0, Math.max(1, 32 - suffix.length))}${suffix}`;
    counter += 1;
  }
}

export async function resolveUserForOidcSignIn(input: {
  account: Account | null;
  profile?: Profile;
  user?: { email?: string | null; name?: string | null; image?: string | null };
}) {
  const { account, profile, user } = input;
  if (!account || account.type !== "oidc") return null;

  const subject = profile?.sub;
  const issuer = (account.issuer ?? (profile as Record<string, unknown> | undefined)?.["iss"]) as
    | string
    | undefined;

  if (!subject || !issuer) return null;

  const linkedProvider = await prisma.oAuthProvider.findUnique({
    where: {
      issuer_subject: {
        issuer,
        subject,
      },
    },
    include: {
      user: true,
    },
  });

  const cookieStore = await cookies();
  const linkCookieValue = cookieStore.get(OIDC_LINK_COOKIE_NAME)?.value
    ?? cookieStore.get(LEGACY_OIDC_LINK_COOKIE_NAME)?.value;
  const secret = process.env.NEXTAUTH_SECRET;
  const linkContext =
    linkCookieValue && secret ? await readOidcLinkCookieValue(linkCookieValue, secret) : null;
  const isLinkRequest = Boolean(linkContext);

  if (linkedProvider) {
    const linkedUser = linkedProvider.user;
    if (!linkedUser.enabled) return null;

    await prisma.oAuthProvider.update({
      where: { id: linkedProvider.id },
      data: {
        email: user?.email ?? linkedProvider.email,
        displayName: user?.name ?? linkedProvider.displayName,
        picture: user?.image ?? linkedProvider.picture,
        accessTokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
        refreshToken: account.refresh_token ?? linkedProvider.refreshToken,
      },
    });

    if (isLinkRequest) {
      cookieStore.delete(OIDC_LINK_COOKIE_NAME);
    }

    return {
      status: "ok" as const,
      id: linkedUser.id,
      name: linkedUser.username,
      email: linkedUser.email,
      image: linkedUser.avatar ?? null,
      roles: normalizeRoles(linkedUser.roles),
      currency: linkedUser.currency,
      locale: linkedUser.locale,
      theme: linkedUser.theme,
      dateFormat: linkedUser.dateFormat,
    };
  }

  const email = user?.email ?? null;
  if (!email) return null;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (!existingUser.enabled) return null;

    if (existingUser.primaryAuthMethod === "credentials" && !isLinkRequest) {
      return { status: "link_required" as const };
    }

    if (isLinkRequest && linkContext!.userId !== existingUser.id) {
      cookieStore.delete(OIDC_LINK_COOKIE_NAME);
      cookieStore.delete(LEGACY_OIDC_LINK_COOKIE_NAME);
      return { status: "link_forbidden" as const };
    }

    await prisma.oAuthProvider.create({
      data: {
        userId: existingUser.id,
        issuer,
        providerName: account.provider,
        subject,
        email,
        displayName: user?.name ?? existingUser.username,
        picture: user?.image ?? null,
        accessTokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
        refreshToken: account.refresh_token ?? null,
      },
    });

    if (existingUser.primaryAuthMethod !== "oidc") {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { primaryAuthMethod: "oidc" },
      });
    }

    if (isLinkRequest) {
      cookieStore.delete(OIDC_LINK_COOKIE_NAME);
      cookieStore.delete(LEGACY_OIDC_LINK_COOKIE_NAME);
    }

    return {
      status: "ok" as const,
      id: existingUser.id,
      name: existingUser.username,
      email: existingUser.email,
      image: existingUser.avatar ?? null,
      roles: normalizeRoles(existingUser.roles),
      currency: existingUser.currency,
      locale: existingUser.locale,
      theme: existingUser.theme,
      dateFormat: existingUser.dateFormat,
    };
  }

  if (isLinkRequest) {
    cookieStore.delete(OIDC_LINK_COOKIE_NAME);
    cookieStore.delete(LEGACY_OIDC_LINK_COOKIE_NAME);
    return { status: "link_forbidden" as const };
  }

  const usernameSeed = user?.name ?? email.split("@")[0] ?? "user";
  const username = await generateUniqueUsername(usernameSeed);

  const createdUser = await prisma.user.create({
    data: {
      username,
      email,
      password: "",
      enabled: true,
      roles: ["ROLE_USER"],
      primaryAuthMethod: "oidc",
      oauthProviders: {
        create: {
          issuer,
          providerName: account.provider,
          subject,
          email,
          displayName: user?.name ?? username,
          picture: user?.image ?? null,
          accessTokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
          refreshToken: account.refresh_token ?? null,
        },
      },
    },
  });

  if (isLinkRequest) {
    cookieStore.delete(OIDC_LINK_COOKIE_NAME);
    cookieStore.delete(LEGACY_OIDC_LINK_COOKIE_NAME);
  }

  return {
    status: "ok" as const,
    id: createdUser.id,
    name: createdUser.username,
    email: createdUser.email,
    image: createdUser.avatar ?? null,
    roles: normalizeRoles(createdUser.roles),
    currency: createdUser.currency,
    locale: createdUser.locale,
    theme: createdUser.theme,
    dateFormat: createdUser.dateFormat,
  };
}
