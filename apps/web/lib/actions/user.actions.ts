"use server";

import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@stackly/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isValidLocale } from "@/i18n/locales";
import { THEME_IDS } from "@/lib/theme/themes";
import { getTranslations } from "next-intl/server";
import { getCollectionDisplayConfigOptions, upsertDisplayConfiguration } from "@/lib/collection-display-config";
import { OIDC_LINK_COOKIE_NAME, createOidcLinkCookieValue } from "@/lib/auth/oidc-link-cookie";
import { STACKLY_LOCALE_COOKIE_NAME } from "@/lib/cookies";
import { deleteUploadImageVariants } from "@/lib/collections-tree";
import { saveUploadedAsset } from "@/lib/server/uploads";

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
  const t = await getTranslations("settings");

  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const avatarFile = formData.get("avatarFile");
  const removeAvatar = formData.get("removeAvatar") === "1";
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatar: true },
  });

  if (!currentUser) {
    return { error: { user: [t("userNotFound")] } };
  }

  let avatar = currentUser.avatar;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    const stored = await saveUploadedAsset({
      file: avatarFile,
      userId: session.user.id,
      entity: "avatars",
      kind: "image",
    });
    avatar = stored.path;
    if (currentUser.avatar) {
      await deleteUploadImageVariants(currentUser.avatar);
    }
  } else if (removeAvatar && currentUser.avatar) {
    await deleteUploadImageVariants(currentUser.avatar);
    avatar = null;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...parsed.data, avatar, updatedAt: new Date() },
  });

  const cookieStore = await cookies();

  // Imposta il cookie locale affinché next-intl lo legga subito
  if (isValidLocale(parsed.data.locale)) {
    cookieStore.set(STACKLY_LOCALE_COOKIE_NAME, parsed.data.locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { success: true };
}

export async function unlinkOidcProvider(providerId: string) {
  const session = await requireAuth();
  const t = await getTranslations("settings");

  const provider = await prisma.oAuthProvider.findUnique({
    where: { id: providerId },
    select: { id: true, userId: true },
  });

  if (!provider || provider.userId !== session.user.id) {
    return { error: t("connectedProviders.notFound") };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, password: true },
  });

  if (!user) {
    return { error: t("userNotFound") };
  }

  const providersCount = await prisma.oAuthProvider.count({
    where: { userId: session.user.id },
  });

  const hasPassword = user.password.trim().length > 0;
  if (!hasPassword && providersCount <= 1) {
    return { error: t("connectedProviders.lastProviderError") };
  }

  await prisma.oAuthProvider.delete({
    where: { id: providerId },
  });

  if (providersCount - 1 <= 0 && hasPassword) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { primaryAuthMethod: "credentials", updatedAt: new Date() },
    });
  }

  revalidatePath("/settings");
  return { success: true };
}

export async function startOidcLink() {
  const session = await requireAuth();
  const cookieStore = await cookies();
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }

  cookieStore.set(
    OIDC_LINK_COOKIE_NAME,
    await createOidcLinkCookieValue(session.user.id, secret),
    {
      path: "/",
      maxAge: 60 * 5,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  );

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
