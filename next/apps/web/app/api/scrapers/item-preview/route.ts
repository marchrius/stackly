import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@stackly/db";
import { requireApiSession } from "@/lib/api-helpers";
import { previewItemScrape } from "@/lib/server/item-scraper";

export async function POST(req: NextRequest) {
  const result = await requireApiSession();
  if ("response" in result) return result.response;

  const formData = await req.formData();
  const scraperId = formData.get("scraperId");
  const url = formData.get("url");
  const htmlFile = formData.get("htmlFile");
  const scrapName = formData.get("scrapName") !== "0";
  const scrapImage = formData.get("scrapImage") !== "0";
  const selectedPathIds = formData.getAll("dataPathIds[]").filter((value): value is string => typeof value === "string");

  if (typeof scraperId !== "string" || scraperId.length === 0) {
    return NextResponse.json({ error: "Missing scraper" }, { status: 400 });
  }

  const scraper = await prisma.scraper.findFirst({
    where: { id: scraperId, ownerId: result.session.user.id, type: "item" },
    include: { dataPaths: { orderBy: { position: "asc" } } },
  });

  if (!scraper) {
    return NextResponse.json({ error: "Scraper not found" }, { status: 404 });
  }

  let html = "";
  if (htmlFile instanceof File && htmlFile.size > 0) {
    html = await htmlFile.text();
  } else if (typeof url === "string" && url.length > 0) {
    const headers = Array.isArray(scraper.headers) ? Object.fromEntries(
      scraper.headers
        .filter((entry): entry is { name: string; value: string } => typeof entry === "object" && entry !== null && typeof (entry as { name?: unknown }).name === "string" && typeof (entry as { value?: unknown }).value === "string")
        .map((entry) => [entry.name, entry.value]),
    ) : {};

    const response = await fetch(url, { headers, cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: `Unable to fetch ${url}` }, { status: 400 });
    }
    html = await response.text();
  } else {
    return NextResponse.json({ error: "Missing source" }, { status: 400 });
  }

  const preview = await previewItemScrape({
    html,
    config: {
      url: typeof url === "string" ? url : null,
      namePath: scraper.namePath,
      imagePath: scraper.imagePath,
      dataPaths: scraper.dataPaths.filter((path) => selectedPathIds.length === 0 || selectedPathIds.includes(path.id)),
    },
    scrapName,
    scrapImage,
  });

  return NextResponse.json({
    ...preview,
    scrapedUrl: typeof url === "string" ? url : null,
  });
}
