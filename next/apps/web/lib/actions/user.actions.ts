"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isValidLocale } from "@/i18n/locales";
import { THEME_COOKIE_NAME, THEME_IDS, normalizeTheme } from "@/lib/theme/themes";
import { getTranslations } from "next-intl/server";

const settingsSchema = z.object({
  currency: z.string().length(3).default("EUR"),
  locale: z.string().max(5).default("en"),
  timezone: z.string().optional().nullable(),
  dateFormat: z.string().default("Y-m-d"),
  theme: z.enum(THEME_IDS).default("auto"),
  visibility: z.enum(["public", "internal", "private"]).default("public"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function updateSettings(formData: FormData) {
  const session = await requireAuth();

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...parsed.data, updatedAt: new Date() },
  });

  const cookieStore = await cookies();

  // Imposta il cookie locale affinché next-intl lo legga subito
  if (isValidLocale(parsed.data.locale)) {
    cookieStore.set("koillection_locale", parsed.data.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  cookieStore.set(THEME_COOKIE_NAME, normalizeTheme(parsed.data.theme), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await requireAuth();
  const t = await getTranslations("settings");

  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error(t("userNotFound"));

  const hash = user.password.startsWith("$2y$")
    ? "$2b$" + user.password.slice(4)
    : user.password;

  const valid = await bcrypt.compare(parsed.data.currentPassword, hash);
  if (!valid) return { error: { currentPassword: [t("currentPasswordInvalid")] } };

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: newHash } });

  return { success: true };
}

export async function registerUser(formData: FormData) {
  const t = await getTranslations("auth.register");
  const schema = z.object({
    username: z.string().min(3).max(32),
    email: z.string().email(),
    password: z.string().min(8),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { username, email, password } = parsed.data;

  const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (exists) return { error: { username: [t("usernameOrEmailTaken")] } };

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { username, email, password: hash, roles: ["ROLE_USER"] },
  });

  redirect("/login");
}
