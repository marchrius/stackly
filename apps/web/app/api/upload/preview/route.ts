import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert HEIC/HEIF to a lightweight JPEG for instant client-side preview
    const convertedBuffer = await sharp(buffer)
      .resize(800, 800, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    const base64 = convertedBuffer.toString("base64");
    return NextResponse.json({ dataUrl: `data:image/jpeg;base64,${base64}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Errore durante la conversione" }, { status: 500 });
  }
}
