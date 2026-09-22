import { describe, expect, it } from "vitest";

import { extractScraperUrls, previewScrape } from "@/lib/server/scraper-preview";

describe("previewScrape", () => {
  it("extracts collection preview data and resolves relative image urls", async () => {
    const result = await previewScrape({
      html: `
        <html>
          <body>
            <h1 class="title">Amazing Collection</h1>
            <img class="cover" src="/cover.jpg" />
            <span class="publisher">Marvel</span>
          </body>
        </html>
      `,
      config: {
        url: "https://example.test/collections/1",
        namePath: "#//h1[@class='title']#",
        imagePath: "#//img[@class='cover']/@src#",
        dataPaths: [{ id: "publisher", name: "Publisher", type: "text", path: "#//span[@class='publisher']#" }],
      },
      scrapName: true,
      scrapImage: true,
    });

    expect(result).toEqual({
      name: "Amazing Collection",
      imageUrl: "https://example.test/cover.jpg",
      data: [{ id: "publisher", label: "Publisher", type: "text", value: "Marvel" }],
    });
  });

  it("serializes list values as JSON arrays", async () => {
    const result = await previewScrape({
      html: `
        <html>
          <body>
            <ul>
              <li class="genre">Sci-fi</li>
              <li class="genre">Fantasy</li>
            </ul>
          </body>
        </html>
      `,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [{ id: "genres", name: "Genres", type: "list", path: "#//li[@class='genre']#" }],
      },
      scrapName: false,
      scrapImage: false,
    });

    expect(result.data).toEqual([{ id: "genres", label: "Genres", type: "list", value: JSON.stringify(["Sci-fi", "Fantasy"]) }]);
  });

  it("extracts preview data using CSS selectors and attributes", async () => {
    const result = await previewScrape({
      html: `
        <html>
          <body>
            <h1 class="title">CSS Collection</h1>
            <img class="cover" src="/cover-css.jpg" />
            <span class="publisher" data-location="us">Marvel CSS</span>
            <div data-email="test@example.com" data-id="1234">User Info</div>
          </body>
        </html>
      `,
      config: {
        url: "https://example.test/collections/2",
        namePath: "#css:h1.title#",
        imagePath: "#css:img.cover@src#",
        dataPaths: [
          { id: "publisher", name: "Publisher", type: "text", path: "#css:span.publisher#" },
          { id: "location", name: "Location", type: "text", path: "#css:span.publisher@data-location#" },
          { id: "userId", name: "User ID", type: "text", path: `#css:div[data-email="test@example.com"]@data-id#` }
        ],
      },
      scrapName: true,
      scrapImage: true,
    });

    expect(result).toEqual({
      name: "CSS Collection",
      imageUrl: "https://example.test/cover-css.jpg",
      data: [
        { id: "publisher", label: "Publisher", type: "text", value: "Marvel CSS" },
        { id: "location", label: "Location", type: "text", value: "us" },
        { id: "userId", label: "User ID", type: "text", value: "1234" }
      ],
    });
  });

  it("supports CSS ID selectors inside hash-delimited expressions", async () => {
    const result = await previewScrape({
      html: `<section id="pagehead_serie_lista"><h1 class="titleserie">Dragonero</h1></section>`,
      config: {
        url: null,
        namePath: "#css:#pagehead_serie_lista .titleserie#",
        imagePath: null,
        dataPaths: [],
      },
      scrapName: true,
      scrapImage: false,
    });

    expect(result.name).toBe("Dragonero");
  });

  it("converts malformed selectors to handled scraper errors", async () => {
    const preview = previewScrape({
      html: `<h1>Dragonero</h1>`,
      config: { url: null, namePath: "#css:div[#", imagePath: null, dataPaths: [] },
      scrapName: true,
      scrapImage: false,
    });

    await expect(preview).rejects.toEqual(
      expect.objectContaining({
        name: "ScraperExpressionError",
        message: expect.stringContaining("Invalid CSS selector"),
      }),
    );
  });

  it("normalizes dates using the configured source format", async () => {
    const result = await previewScrape({
      html: `<time class="published">22/09/2026</time>`,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [{ id: "published", name: "Published", type: "date", path: "#css:time.published#", inputFormat: "DD/MM/YYYY" }],
      },
      scrapName: false,
      scrapImage: false,
    });

    expect(result.data[0]?.value).toBe("2026-09-22");
  });

  it("normalizes localized month names and defaults a missing day to the first", async () => {
    const result = await previewScrape({
      html: `<time class="published">Agosto 2003</time><time class="short">set 2026</time>`,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [
          { id: "published", name: "Published", type: "date", path: "#css:time.published#", inputFormat: "MMMM YYYY" },
          { id: "short", name: "Short", type: "date", path: "#css:time.short#", inputFormat: "MMM YYYY" },
        ],
      },
      scrapName: false,
      scrapImage: false,
    });

    expect(result.data.map(({ value }) => value)).toEqual(["2003-08-01", "2026-09-01"]);
  });

  it("normalizes numeric month and year values without a day", async () => {
    const result = await previewScrape({
      html: `<time>08/2003</time>`,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [{ id: "date", name: "Date", type: "date", path: "#css:time#", inputFormat: "MM/YYYY" }],
      },
      scrapName: false,
      scrapImage: false,
    });

    expect(result.data[0]?.value).toBe("2003-08-01");
  });

  it("extracts and normalizes numbers from surrounding text", async () => {
    const result = await previewScrape({
      html: `<span class="issue">Issue N. 1.234,56 copies</span><span class="volume">Volume #42</span>`,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [
          { id: "copies", name: "Copies", type: "number", path: "#css:span.issue#" },
          { id: "volume", name: "Volume", type: "number", path: "#css:span.volume#", inputFormat: "#(\\d+)" },
        ],
      },
      scrapName: false,
      scrapImage: false,
    });

    expect(result.data).toEqual([
      { id: "copies", label: "Copies", type: "number", value: "1234.56" },
      { id: "volume", label: "Volume", type: "number", value: "42" },
    ]);
  });

  it("rejects dates that do not match their configured format", async () => {
    const preview = previewScrape({
      html: `<time>2026-09-22</time>`,
      config: {
        url: null,
        namePath: null,
        imagePath: null,
        dataPaths: [{ id: "date", name: "Date", type: "date", path: "#css:time#", inputFormat: "DD/MM/YYYY" }],
      },
      scrapName: false,
      scrapImage: false,
    });

    await expect(preview).rejects.toEqual(expect.objectContaining({ message: expect.stringContaining("does not match input format") }));
  });

  it("extracts, resolves and deduplicates item urls from a collection page", () => {
    const urls = extractScraperUrls(
      `<a class="item" href="/items/1#details">One</a>
       <a class="item" href="https://example.test/items/2">Two</a>
       <a class="item" href="/items/1#other">Duplicate</a>`,
      "#css:a.item@href#",
      "https://example.test/collections/1",
    );

    expect(urls).toEqual([
      "https://example.test/items/1",
      "https://example.test/items/2",
    ]);
  });
});
