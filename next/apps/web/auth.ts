import NextAuth from "next-auth";
import type { Session, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@koillection/db";
import bcrypt from "bcryptjs";
import { normalizeSymfonyPassword } from "@koillection/lib";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

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
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }: { token: JWT; user?: unknown }) {
      if (user) {
        const u = user as Record<string, unknown>;
        token["id"] = u["id"] as string;
        token["roles"] = u["roles"] as string[];
        token["currency"] = u["currency"] as string;
        token["locale"] = u["locale"] as string;
        token["theme"] = u["theme"] as string;
        token["dateFormat"] = u["dateFormat"] as string;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }) {
      const u = session.user as unknown as Record<string, unknown>;
      u["id"] = token["id"] as string;
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
