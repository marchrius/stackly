import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockResolvePreview, mockImageResponse } = vi.hoisted(() => ({
  mockResolvePreview: vi.fn(),
  mockImageResponse: vi.fn(function ImageResponseMock(_element: unknown, options: unknown) {
    return new Response("png", {
      headers: {
        "Content-Type": "image/png",
        ...((options as { headers?: HeadersInit }).headers ?? {}),
      },
    });
  }),
}));

vi.mock("@/lib/public/collection-social-preview", () => ({
  resolvePublicCollectionSocialPreview: mockResolvePreview,
}));

vi.mock("next/og", () => ({
  ImageResponse: mockImageResponse,
}));

import {
  GET,
  resolvePreviewAssetUrl,
} from "@/app/api/public/previews/collections/[id]/route";

describe("GET /api/public/previews/collections/[id]", () => {
  it("returns 404 when the collection is not public", async () => {
    mockResolvePreview.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("https://stackly.example/api/public/previews/collections/private"),
      { params: Promise.resolve({ id: "private" }) },
    );

    expect(response.status).toBe(404);
    expect(mockImageResponse).not.toHaveBeenCalled();
  });

  it("renders a versioned 1200x630 PNG with immutable caching", async () => {
    mockResolvePreview.mockResolvedValue({
      title: "Videogiochi",
      color: "#8b5cf6",
      initials: "VI",
      imageUrl: "/uploads/collections/cover.jpg",
      fingerprint: "preview-v2",
    });

    const response = await GET(
      new NextRequest("https://stackly.example/api/public/previews/collections/c1?v=preview-v2"),
      { params: Promise.resolve({ id: "c1" }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable");
    expect(mockResolvePreview).toHaveBeenCalledWith("c1");
    expect(mockImageResponse).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ width: 1200, height: 630 }),
    );
  });
});

describe("resolvePreviewAssetUrl", () => {
  const request = new NextRequest("https://stackly.example/api/public/previews/collections/c1");

  it("resolves uploaded paths from the public origin", () => {
    expect(resolvePreviewAssetUrl(request, "uploads/items/cover.jpg")).toBe(
      "https://stackly.example/uploads/items/cover.jpg",
    );
  });

  it("allows same-origin HTTP URLs and rejects external or unsupported protocols", () => {
    expect(resolvePreviewAssetUrl(request, "https://stackly.example/uploads/cover.jpg")).toBe(
      "https://stackly.example/uploads/cover.jpg",
    );
    expect(resolvePreviewAssetUrl(request, "https://cdn.example/cover.jpg")).toBeUndefined();
    expect(resolvePreviewAssetUrl(request, "file:///etc/passwd")).toBeUndefined();
  });
});
