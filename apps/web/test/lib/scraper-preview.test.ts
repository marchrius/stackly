import { describe, expect, it } from "vitest";

import { previewScrape } from "@/lib/server/scraper-preview";

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
});
