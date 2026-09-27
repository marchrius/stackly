import { createElement } from "react";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { NextRequest } from "next/server";
import type { PublicCollectionSocialPreview } from "@/lib/public/collection-social-preview";
import { resolvePublicAppUrl } from "@/lib/public-app-url";

const WIDTH = 1200;
const HEIGHT = 630;
const DEFAULT_COLOR = "#334155";

export function resolvePreviewAssetUrl(
  request: NextRequest,
  assetUrl?: string | null,
  publicOrigin?: string,
) {
  const value = assetUrl?.trim();
  if (!value) return undefined;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.origin === request.nextUrl.origin ? parsed.toString() : undefined;
  } catch {
    const path = value.startsWith("/") ? value : `/${value}`;
    return new URL(path, publicOrigin ?? request.nextUrl.origin).toString();
  }
}

function normalizeColor(color?: string | null) {
  const value = color?.trim();
  return value && /^#[0-9a-f]{3,8}$/i.test(value) ? value : DEFAULT_COLOR;
}

export async function renderSocialImage(request: NextRequest, preview: PublicCollectionSocialPreview | null, label = "Public collection") {
  if (!preview) {
    return Response.json({ error: "Public collection not found" }, { status: 404 });
  }

  const coverUrl = resolvePreviewAssetUrl(request, preview.imageUrl, resolvePublicAppUrl()?.toString());
  const color = normalizeColor(preview.color);
  const versionMatches = request.nextUrl.searchParams.get("v") === preview.fingerprint;

  const background = coverUrl
    ? createElement("img", {
        src: coverUrl,
        alt: "",
        width: WIDTH,
        height: HEIGHT,
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        },
      })
    : createElement(
        "div",
        {
          style: {
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${color} 0%, #0f172a 100%)`,
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 260,
              height: 260,
              border: "4px solid rgba(255,255,255,0.45)",
              borderRadius: 56,
              background: "rgba(15,23,42,0.22)",
              color: "white",
              fontSize: 112,
              fontWeight: 800,
              letterSpacing: "-0.06em",
              textTransform: "uppercase",
            },
          },
          preview.initials,
        ),
      );

  const card = createElement(
    "div",
    {
      style: {
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: color,
        color: "white",
        fontFamily: "Arial, Helvetica, sans-serif",
      },
    },
    background,
    createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: coverUrl
          ? "linear-gradient(90deg, rgba(2,6,23,0.94) 0%, rgba(2,6,23,0.76) 48%, rgba(2,6,23,0.12) 100%)"
          : "linear-gradient(0deg, rgba(2,6,23,0.50) 0%, rgba(2,6,23,0.04) 70%)",
      },
    }),
    createElement(
      "div",
      {
        style: {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: coverUrl ? "68%" : "100%",
          height: "100%",
          padding: "64px 72px",
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.04em",
          },
        },
        createElement("div", {
          style: {
            width: 18,
            height: 18,
            borderRadius: 999,
            backgroundColor: color,
            border: "2px solid rgba(255,255,255,0.72)",
          },
        }),
        "STACKLY",
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            gap: 18,
            maxWidth: 900,
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              fontSize: preview.title.length > 48 ? 58 : 72,
              fontWeight: 800,
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              textShadow: "0 3px 18px rgba(0,0,0,0.35)",
            },
          },
          preview.title,
        ),
        createElement(
          "div",
          {
            style: {
              display: "flex",
              fontSize: 26,
              color: "rgba(255,255,255,0.82)",
            },
          },
          label,
        ),
      ),
    ),
  );

  const rendered = new ImageResponse(card, {
    width: WIDTH,
    height: HEIGHT,
  });
  const jpeg = await sharp(Buffer.from(await rendered.arrayBuffer()))
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": versionMatches
        ? "public, max-age=31536000, immutable"
        : "public, max-age=0, must-revalidate",
    },
  });
}
