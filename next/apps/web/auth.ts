import NextAuth from "next-auth";
import type { Session, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@stackly/db";
import bcrypt from "bcryptjs";
import { normalizeSymfonyPassword } from "@stackly/lib";
import { z } from "zod";
import { getOidcProviderConfig } from "@/lib/oidc-config";
import { resolveUserForOidcSignIn } from "@/lib/auth/oidc-signin";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const oidcProvider = getOidcProviderConfig();

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        const user = await prisma.user.findFirst({
          where: {
            OR: [{ username }, { email: username }],
            enabled: true,
          },
        });

        if (!user) return null;

        if (!user.password) return null;

        const normalizedHash = normalizeSymfonyPassword(user.password);
        const isValid = await bcrypt.compare(password, normalizedHash);
        if (!isValid) return null;

        const roles = Array.isArray(user.roles)
          ? (user.roles as string[])
          : (JSON.parse(user.roles as unknown as string) as string[]);

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          image: user.avatar ?? null,
          roles,
          currency: user.currency,
          locale: user.locale,
          theme: user.theme,
          dateFormat: user.dateFormat,
        };
      },
    }),
    ...(oidcProvider
      ? [
          {
            id: oidcProvider.id,
            name: oidcProvider.name,
            type: oidcProvider.type,
            issuer: oidcProvider.issuer,
            clientId: oidcProvider.clientId,
            clientSecret: oidcProvider.clientSecret,
            authorization: oidcProvider.authorization,
            profile(profile: Record<string, unknown>) {
              return {
                id: (profile["sub"] as string | undefined) ?? "",
                name: (profile["name"] as string | undefined) ?? null,
                email: (profile["email"] as string | undefined) ?? null,
                image: (profile["picture"] as string | undefined) ?? null,
              };
            },
          } as any,
        ]
      : []),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token["id"] = u["id"] as string;
        token["image"] = (u["image"] as string | null | undefined) ?? null;
        token["roles"] = u["roles"] as string[];
        token["currency"] = u["currency"] as string;
        token["locale"] = u["locale"] as string;
        token["theme"] = u["theme"] as string;
        token["dateFormat"] = u["dateFormat"] as string;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.type !== "oidc") {
        return true;
      }

      const resolved = await resolveUserForOidcSignIn({
        account,
        profile,
        user,
      });

      if (!resolved) {
        return false;
      }

      if (resolved.status === "link_required") {
        return "/login?error=oidc_link_required";
      }

      if (resolved.status === "link_forbidden") {
        return "/login?error=oidc_link_forbidden";
      }

      Object.assign(user, resolved);
      return true;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      const u = session.user as unknown as Record<string, unknown>;
      u["id"] = token["id"] as string;
      u["image"] = token["image"] ?? null;
      u["roles"] = token["roles"];
      u["currency"] = token["currency"];
      u["locale"] = token["locale"];
      u["theme"] = token["theme"];
      u["dateFormat"] = token["dateFormat"];
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
} satisfies NextAuthConfig;

const authConfig = NextAuth(config);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: string[];
      currency: string;
      locale: string;
      theme: string;
      dateFormat: string;
    } & DefaultSession["user"];
  }
}

export const handlers = authConfig.handlers;
// @ts-ignore TS2742: next-auth v5 — auth type not nominable without internal module reference
// Tracked: https://github.com/nextauthjs/next-auth/issues/9504
export const auth = authConfig.auth as any;
