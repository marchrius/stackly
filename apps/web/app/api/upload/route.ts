import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";
import sharp from "sharp";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./public/uploads";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const entity = (formData.get("entity") as string) ?? "misc";

  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File troppo grande (max 10MB)" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "Tipo file non supportato" }, { status: 400 });

  const userId = session.user.id;
  const uuid = randomUUID();
  const ext = extname(file.name) || ".jpg";
  const dir = join(UPLOAD_DIR, userId, entity);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${uuid}${ext}`;
  const filepath = join(dir, filename);
  await writeFile(filepath, buffer);

  // Genera thumbnails con sharp
  const smallPath = join(dir, `${uuid}_small${ext}`);
  const largePath = join(dir, `${uuid}_large${ext}`);

  await sharp(buffer).resize(200, 200, { fit: "cover" }).toFile(smallPath);
  await sharp(buffer).resize(600, 600, { fit: "inside", withoutEnlargement: true }).toFile(largePath);

  const base = `${userId}/${entity}`;
  return NextResponse.json({
    path: `${base}/${filename}`,
    smallThumbnail: `${base}/${uuid}_small${ext}`,
    largeThumbnail: `${base}/${uuid}_large${ext}`,
  });
}

