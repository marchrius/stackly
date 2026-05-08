import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
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
  const ext = getExtension(file, kind);
  const uuid = randomUUID();
  const filename = `${uuid}${ext}`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  const base = `${userId}/${entity}`;

  if (kind !== "image") {
    return {
      path: `${base}/${filename}`,
      originalFilename: file.name || null,
    };
  }

  const smallPath = join(dir, `${uuid}_small${ext}`);
  const largePath = join(dir, `${uuid}_large${ext}`);

  await sharp(buffer).resize(200, 200, { fit: "cover" }).toFile(smallPath);
  await sharp(buffer).resize(600, 600, { fit: "inside", withoutEnlargement: true }).toFile(largePath);

  return {
    path: `${base}/${filename}`,
    smallThumbnail: `${base}/${uuid}_small${ext}`,
    largeThumbnail: `${base}/${uuid}_large${ext}`,
    originalFilename: file.name || null,
  };
}

function validateImage(file: File) {
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("File too large (max 10MB)");
  }

  if (!IMAGE_TYPES.includes(file.type)) {
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
