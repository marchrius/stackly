"use server";

import { requireAdmin } from "@/lib/auth-utils";
import {
  CONFIGURATION_LABELS,
  THUMBNAIL_FORMAT_VALUES,
  type ThumbnailFormatValue,
} from "@/lib/configuration";
import { prisma } from "@stackly/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const adminConfigurationSchema = z.object({
  thumbnailsFormat: z.enum(THUMBNAIL_FORMAT_VALUES).default("keep-original"),
  customLightThemeCss: z.string().default(""),
  customDarkThemeCss: z.string().default(""),
  enableMetrics: z.enum(["true", "false"]).default("false"),
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

function normalizeTextConfiguration(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeThumbnailFormat(value: ThumbnailFormatValue): string | null {
  return value === "keep-original" ? null : value;
}
