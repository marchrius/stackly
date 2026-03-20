"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@koillection/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isValidLocale } from "@/i18n/locales";
import { THEME_IDS } from "@/lib/theme/themes";
import { getTranslations } from "next-intl/server";
import { getCollectionDisplayConfigOptions, upsertDisplayConfiguration } from "@/lib/collection-display-config";

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

const indexDisplayConfigSchema = z.object({
  label: z.string().default(""),
  displayMode: z.enum(["grid", "list"]).default("grid"),
  sortingProperty: z.string().nullable().optional(),
  sortingDirection: z.enum(["ASC", "DESC"]).default("ASC"),
  showVisibility: z.boolean().default(true),
  showActions: z.boolean().default(true),
  showNumberOfChildren: z.boolean().default(true),
  showNumberOfItems: z.boolean().default(true),
  showItemQuantities: z.boolean().default(false),
  columns: z.array(z.string()).default([]),
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

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}

export async function updateCollectionIndexDisplayConfiguration(formData: FormData) {
  const session = await requireAuth();

  const payload = formData.get("payload");
  if (typeof payload !== "string") return { error: "Missing display configuration payload." };

  const parsedJson = z.string().transform((value, ctx) => {
    try {
      return JSON.parse(value);
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid display configuration payload." });
      return z.NEVER;
    }
  }).pipe(indexDisplayConfigSchema).safeParse(payload);

  if (!parsedJson.success) {
    return { error: parsedJson.error.issues[0]?.message ?? "Unable to save display configuration." };
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: session.user.id },
      include: { collectionsDisplayConfiguration: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const options = await getCollectionDisplayConfigOptions(tx, session.user.id, null);
    const displayConfigurationId = await upsertDisplayConfiguration(
      tx,
      session.user.id,
      user.collectionsDisplayConfigurationId,
      { ...parsedJson.data, sortingProperty: parsedJson.data.sortingProperty ?? null },
      options.childrenSortingOptions,
    );

    await tx.user.update({
      where: { id: session.user.id },
      data: { collectionsDisplayConfigurationId: displayConfigurationId, updatedAt: new Date() },
    });
  });

  revalidatePath("/collections");
  revalidatePath("/collections/edit");
  redirect("/collections");
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
