import { NextRequest } from "next/server";
import { isPublicObjectKind, objectLabels, resolveObjectSocialPreview } from "@/lib/public/object-social-preview";
import { renderSocialImage } from "@/lib/public/social-image";

export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!isPublicObjectKind(kind)) return Response.json({ error: "Not found" }, { status: 404 });
  return renderSocialImage(request, await resolveObjectSocialPreview(kind, id), objectLabels[kind]);
}
