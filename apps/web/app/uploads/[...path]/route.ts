import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { resolveUploadPath } from "@/lib/server/upload-paths";

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { path: pathSegments } = await params;

  if (!pathSegments || pathSegments.length === 0) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Previeni directory traversal (sicurezza)
  const isTraversal = pathSegments.some(
    (segment) =>
      segment === ".." ||
      segment === "." ||
      segment.includes("/") ||
      segment.includes("\\")
  );
  if (isTraversal) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let filePath: string;
  try {
    filePath = resolveUploadPath(...pathSegments);
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!existsSync(filePath)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const fileBuffer = await readFile(filePath);

    // Determina il Content-Type corretto
    const ext = filePath.split(".").pop()?.toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === "jpg" || ext === "jpeg") {
      contentType = "image/jpeg";
    } else if (ext === "png") {
      contentType = "image/png";
    } else if (ext === "webp") {
      contentType = "image/webp";
    } else if (ext === "gif") {
      contentType = "image/gif";
    } else if (ext === "avif") {
      contentType = "image/avif";
    } else if (ext === "mp4") {
      contentType = "video/mp4";
    } else if (ext === "webm") {
      contentType = "video/webm";
    }

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving upload:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
