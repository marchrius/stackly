import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();
export const PROJECT_ROOT = fileURLToPath(new URL("../../", import.meta.url));
export const UPLOAD_DIR = path.resolve(PROJECT_ROOT, process.env.UPLOAD_DIR ?? "./public/uploads");
export const VISIBILITIES = ["public", "internal", "private"];

export function hasFlag(flag) {
  return process.argv.includes(flag);
}

export function printHelp(lines) {
  console.log(lines.join("\n"));
}

export function toPosixPath(filePath) {
  return filePath.split(path.sep).join("/");
}

export function deriveThumbnailPath(imagePath, suffix, forcedFormat = null) {
  const extension = path.extname(imagePath);
  const base = extension ? imagePath.slice(0, -extension.length) : imagePath;
  const nextExtension = forcedFormat ? `.${forcedFormat === "jpeg" ? "jpg" : forcedFormat}` : extension || ".jpg";
  return `${base}${suffix}${nextExtension}`;
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureParentDir(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export function visibilityCountersShape(childLabel, leafLabel) {
  return {
    counters: {
      publicCounters: { [childLabel]: 0, [leafLabel]: 0 },
      internalCounters: { [childLabel]: 0, [leafLabel]: 0 },
      privateCounters: { [childLabel]: 0, [leafLabel]: 0 },
    },
  };
}

export function normalizeVisibility(visibility) {
  return VISIBILITIES.includes(visibility) ? visibility : "private";
}

export function mergePriceBuckets(target, source) {
  for (const [label, currencies] of Object.entries(source)) {
    const targetCurrencies = (target[label] ??= {});
    for (const [currency, value] of Object.entries(currencies)) {
      targetCurrencies[currency] = (targetCurrencies[currency] ?? 0) + value;
    }
  }
}

export async function closePrisma() {
  await prisma.$disconnect();
}
