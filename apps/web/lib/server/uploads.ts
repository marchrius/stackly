import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import { prisma } from "@stackly/db";
import { CONFIGURATION_LABELS } from "../configuration";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif"
];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];

export type UploadKind = "image" | "file" | "video";

export type StoredUpload = {
  path: string;
  smallThumbnail?: string | null;
  largeThumbnail?: string | null;
  originalFilename?: string | null;
};

export async function saveUploadedAsset({
  file,
  userId,
  entity,
  kind,
}: {
  file: File;
  userId: string;
  entity: string;
  kind: UploadKind;
}): Promise<StoredUpload> {
  if (!file || file.size === 0) {
    throw new Error("No file provided");
  }

  if (kind === "image") {
    validateImage(file);
  } else {
    validateBinary(file, kind);
  }

  const dir = join(UPLOAD_DIR, userId, entity);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const uuid = randomUUID();
  const base = `${userId}/${entity}`;

  if (kind !== "image") {
    const ext = getExtension(file, kind);
    const filename = `${uuid}${ext}`;
    const filepath = join(dir, filename);
    await writeFile(filepath, buffer);

    return {
      path: `${base}/${filename}`,
      originalFilename: file.name || null,
    };
  }

  // Leggi configurazione formato immagini/thumbnail
  const config = await prisma.configuration.findUnique({
    where: { label: CONFIGURATION_LABELS.thumbnailsFormat },
  });
  const formatSetting = config?.value ?? "keep-original";

  // Determina formato e estensione di destinazione
  const { format, ext } = getTargetFormatAndExtension(file.type, file.name, formatSetting);

  const filename = `${uuid}${ext}`;
  const filepath = join(dir, filename);

  // Converti e salva immagine originale
  let sharpOriginal = sharp(buffer);
  if (format) {
    sharpOriginal = sharpOriginal.toFormat(format);
  }
  await sharpOriginal.toFile(filepath);

  // Converti e salva miniature
  const smallPath = join(dir, `${uuid}_small${ext}`);
  const largePath = join(dir, `${uuid}_large${ext}`);

  let sharpSmall = sharp(buffer).resize(200, 200, { fit: "cover" });
  let sharpLarge = sharp(buffer).resize(600, 600, { fit: "inside", withoutEnlargement: true });

  if (format) {
    sharpSmall = sharpSmall.toFormat(format);
    sharpLarge = sharpLarge.toFormat(format);
  }

  await sharpSmall.toFile(smallPath);
  await sharpLarge.toFile(largePath);

  return {
    path: `${base}/${filename}`,
    smallThumbnail: `${base}/${uuid}_small${ext}`,
    largeThumbnail: `${base}/${uuid}_large${ext}`,
    originalFilename: file.name || null,
  };
}

function getTargetFormatAndExtension(
  fileType: string,
  fileName: string,
  formatSetting: string
): { format: keyof sharp.FormatEnum | null; ext: string } {
  const originalExt = extname(fileName).toLowerCase() || getExtensionFromMime(fileType);

  if (formatSetting !== "keep-original") {
    if (formatSetting === "jpeg") {
      return { format: "jpeg", ext: ".jpg" };
    }
    return { format: formatSetting as keyof sharp.FormatEnum, ext: `.${formatSetting}` };
  }

  // Converti HEIC/HEIF in WebP se keep-original è attivo
  if (
    fileType === "image/heic" ||
    fileType === "image/heif" ||
    originalExt === ".heic" ||
    originalExt === ".heif"
  ) {
    return { format: "webp", ext: ".webp" };
  }

  return { format: null, ext: originalExt };
}

function getExtensionFromMime(mime: string): string {
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/gif") return ".gif";
  if (mime === "image/avif") return ".avif";
  if (mime === "image/heic") return ".heic";
  if (mime === "image/heif") return ".heif";
  return ".jpg";
}

function validateImage(file: File) {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("File too large (max 10MB)");
  }

  const ext = extname(file.name).toLowerCase();
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif", ".heic", ".heif"];
  const isAllowedMime = IMAGE_TYPES.includes(file.type);
  const isAllowedExt = allowedExts.includes(ext);

  if (!isAllowedMime && !isAllowedExt) {
    throw new Error("Unsupported image type");
  }
}

function validateBinary(file: File, kind: Extract<UploadKind, "file" | "video">) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large (max 50MB)");
  }

  if (kind === "video" && file.type && !VIDEO_TYPES.includes(file.type)) {
    throw new Error("Unsupported video type");
  }
}

function getExtension(file: File, kind: UploadKind) {
  const ext = extname(file.name);
  if (ext) return ext.toLowerCase();

  if (kind === "image") {
    if (file.type === "image/png") return ".png";
    if (file.type === "image/webp") return ".webp";
    if (file.type === "image/gif") return ".gif";
    if (file.type === "image/avif") return ".avif";
    return ".jpg";
  }

  if (kind === "video") {
    if (file.type === "video/webm") return ".webm";
    if (file.type === "video/ogg") return ".ogv";
    if (file.type === "video/quicktime") return ".mov";
    return ".mp4";
  }

  return ".bin";
}

export async function downloadRemoteAsset({
  url,
  userId,
  entity,
  kind,
}: {
  url: string;
  userId: string;
  entity: string;
  kind: UploadKind;
}) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Unable to download ${url}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const name = getRemoteFilename(url, kind);
  const file = new File([await response.arrayBuffer()], name, { type: contentType });
  return saveUploadedAsset({ file, userId, entity, kind });
}

function getRemoteFilename(url: string, kind: UploadKind) {
  try {
    const pathname = new URL(url).pathname;
    const candidate = pathname.split("/").filter(Boolean).pop();
    if (candidate) return candidate;
  } catch {}

  if (kind === "image") return "remote-image.jpg";
  if (kind === "video") return "remote-video.mp4";
  return "remote-file.bin";
}
