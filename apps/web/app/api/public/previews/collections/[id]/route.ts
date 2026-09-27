import { NextRequest } from "next/server";
import { resolvePublicCollectionSocialPreview } from "@/lib/public/collection-social-preview";
import { renderSocialImage } from "@/lib/public/social-image";
export const runtime = "nodejs";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return renderSocialImage(request, await resolvePublicCollectionSocialPreview((await params).id));
}
