import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { saveUploadedAsset } from "@/lib/server/uploads";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const entity = (formData.get("entity") as string) ?? "misc";

  if (!file) return NextResponse.json({ error: "Nessun file" }, { status: 400 });

  const userId = session.user.id;

  try {
    const upload = await saveUploadedAsset({
      file,
      userId,
      entity,
      kind: "image",
    });

    return NextResponse.json({
      path: upload.path,
      smallThumbnail: upload.smallThumbnail,
      largeThumbnail: upload.largeThumbnail,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Errore durante l'upload" }, { status: 400 });
  }
}

