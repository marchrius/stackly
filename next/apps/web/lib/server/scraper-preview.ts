import { JSDOM } from "jsdom";

export type ScraperPreviewPath = { id: string; name: string; type: string; path: string };

export type ScraperPreviewConfig = {
  url: string | null;
  namePath: string | null;
  imagePath: string | null;
  dataPaths: ScraperPreviewPath[];
};

export async function previewScrape({
  html,
  config,
  scrapName,
  scrapImage,
}: {
  html: string;
  config: ScraperPreviewConfig;
  scrapName: boolean;
  scrapImage: boolean;
}) {
  const sanitizedHtml = html.replace(/<(script|template|noscript)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const dom = new JSDOM(sanitizedHtml);
  const document = dom.window.document;

  return {
    name: scrapName ? extract(config.namePath, "text", document, config.url) : null,
    imageUrl: scrapImage ? extract(config.imagePath, "image", document, config.url) : null,
    data: config.dataPaths.map((path) => ({
      id: path.id,
      label: path.name,
      type: path.type,
      value: extract(path.path, path.type, document, config.url),
    })),
  };
}

function extract(template: string | null, type: string, document: Document, sourceUrl: string | null) {
  if (!template) return null;

  const xpaths = [...template.matchAll(/#(.*?)#/g)].map((match) => match[1]);
  if (xpaths.length === 0) {
    return formatValues([template], type, sourceUrl);
  }

  let values: string[] = [];

  for (const xpath of xpaths) {
    const results = evaluateXPath(document, xpath);
    if (results.length === 0) {
      values = values.length === 0 ? [template.replace(`#${xpath}#`, "")] : values.map((value) => value.replace(`#${xpath}#`, ""));
      continue;
    }

    values = results.map((result, index) => {
      const current = values[index] ?? template;
      return current.replace(`#${xpath}#`, result);
    });
  }

  return formatValues(values, type, sourceUrl);
}

function evaluateXPath(document: Document, xpath: string) {
  const result = document.evaluate(xpath, document, null, document.defaultView?.XPathResult.ANY_TYPE ?? 0, null);
  const values: string[] = [];
  let current = result.iterateNext();
  while (current) {
    if (current.nodeType === 2) {
      values.push(current.nodeValue ?? "");
    } else {
      values.push(current.textContent ?? "");
    }
    current = result.iterateNext();
  }
  return values.map((value) => value.trim()).filter(Boolean);
}

function formatValues(values: string[], type: string, sourceUrl: string | null) {
  if (values.length === 0) return null;

  if (type === "text") return unique(values).join(", ");
  if (type === "list" || type === "choice-list") return JSON.stringify(unique(values));
  if (type === "textarea") return values[0];
  if (type === "country") {
    const value = values[0]?.trim();
    if (!value) return null;
    return value.length <= 3 ? value.toUpperCase() : value;
  }
  if (type === "image" || type === "link") return guessHost(values[0], sourceUrl);

  return values[0] ?? null;
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function guessHost(url: string | null | undefined, sourceUrl: string | null) {
  if (!url) return null;
  if (!sourceUrl) return url;

  try {
    return new URL(url, sourceUrl).toString();
  } catch {
    return url;
  }
}
