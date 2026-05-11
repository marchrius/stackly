"use server";

import { requireAdmin } from "@/lib/auth-utils";
import {
  CONFIGURATION_LABELS,
  THUMBNAIL_FORMAT_VALUES,
  type ThumbnailFormatValue,
} from "@/lib/configuration";
import { prisma } from "@stackly/db";
import { ROLES } from "@stackly/lib";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const adminConfigurationSchema = z.object({
  thumbnailsFormat: z.enum(THUMBNAIL_FORMAT_VALUES).default("keep-original"),
  customLightThemeCss: z.string().default(""),
  customDarkThemeCss: z.string().default(""),
  enableMetrics: z.enum(["true", "false"]).default("false"),
});

const adminUserSchema = z.object({
  username: z.string().trim().min(1, "Username is required.").max(32),
  email: z.string().trim().email("A valid email is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  isAdmin: z.enum(["on"]).optional(),
  enabled: z.enum(["on"]).optional(),
});

export async function updateAdminConfiguration(formData: FormData) {
  await requireAdmin();

  const parsed = adminConfigurationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const now = new Date();
  const values = [
    {
      label: CONFIGURATION_LABELS.thumbnailsFormat,
      value: normalizeThumbnailFormat(parsed.data.thumbnailsFormat),
    },
    {
      label: CONFIGURATION_LABELS.customLightThemeCss,
      value: normalizeTextConfiguration(parsed.data.customLightThemeCss),
    },
    {
      label: CONFIGURATION_LABELS.customDarkThemeCss,
      value: normalizeTextConfiguration(parsed.data.customDarkThemeCss),
    },
    {
      label: CONFIGURATION_LABELS.enableMetrics,
      value: parsed.data.enableMetrics === "true" ? "1" : "0",
    },
  ] as const;

  await prisma.$transaction(
    values.map((entry) =>
      prisma.configuration.upsert({
        where: { label: entry.label },
        update: {
          value: entry.value,
          updatedAt: now,
        },
        create: {
          label: entry.label,
          value: entry.value,
          createdAt: now,
          updatedAt: now,
        },
      }),
    ),
  );

  revalidatePath("/settings/admin");
  revalidatePath("/", "layout");

  return { success: true };
}

export async function createAdminUser(formData: FormData) {
  await requireAdmin();

  const parsed = adminUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid payload." };
  }

  const roles: string[] = [ROLES.USER];
  if (parsed.data.isAdmin === "on") roles.push(ROLES.ADMIN);

  try {
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        email: parsed.data.email,
        password: await bcrypt.hash(parsed.data.password, 12),
        enabled: parsed.data.enabled === "on",
        roles,
      },
      select: { id: true },
    });

    revalidatePath("/settings/admin");
    revalidatePath("/settings/admin/users");
    revalidatePath("/", "layout");

    return { success: true, id: user.id };
  } catch {
    return { error: "Unable to create the user. Check that username and email are unique." };
  }
}

export async function updateUserAdminRole(userId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return;
  }

  const isAdmin = formData.get("isAdmin") === "on";
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, roles: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const roles = Array.isArray(user.roles) ? user.roles.filter((role): role is string => typeof role === "string") : [];
  const nextRoles = new Set<string>(roles.filter((role) => role !== ROLES.ADMIN && role !== ROLES.USER));
  nextRoles.add(ROLES.USER);
  if (isAdmin) nextRoles.add(ROLES.ADMIN);

  await prisma.user.update({
    where: { id: userId },
    data: { roles: Array.from(nextRoles) },
  });

  revalidatePath("/settings/admin");
  revalidatePath("/settings/admin/users");
  revalidatePath("/", "layout");

}

export async function updateUserEnabled(userId: string, formData: FormData): Promise<void> {
  const session = await requireAdmin();

  if (userId === session.user.id) {
    return;
  }

  const enabled = formData.get("enabled") === "on";
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { enabled },
  });

  revalidatePath("/settings/admin");
  revalidatePath("/settings/admin/users");
  revalidatePath("/", "layout");
}

function normalizeTextConfiguration(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeThumbnailFormat(value: ThumbnailFormatValue): string | null {
  return value === "keep-original" ? null : value;
}
