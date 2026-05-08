import { auth } from "@/auth";
import { ROLES } from "@stackly/lib";
import { redirect } from "next/navigation";

export type AuthSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles: string[];
    currency: string;
    locale: string;
    theme: string;
    dateFormat: string;
  };
};

/**
 * Recupera la sessione autenticata.
 * Se non autenticato, redireziona a /login.
 * Garantisce un tipo non-nullable su session.user.
 */
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session as AuthSession;
}

export async function requireAdmin(): Promise<AuthSession> {
  const session = await requireAuth();
  if (!session.user.roles.includes(ROLES.ADMIN)) {
    redirect("/");
  }
  return session;
}
