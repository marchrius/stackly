import { JSDOM } from "jsdom";

export type ScraperPreviewPath = { id: string; name: string; type: string; path: string };

export type ScraperPreviewConfig = {
  url: string | null;
  namePath: string | null;
  imagePath: string | null;
  dataPaths: ScraperPreviewPath[];
};

export class ScraperExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScraperExpressionError";
  }
}

export function extractScraperValue(template: string | null, type: string, document: Document, sourceUrl: string | null) {
  return extract(template, type, document, sourceUrl);
}

export function extractScraperUrls(html: string, template: string | null, sourceUrl: string | null, limit = 100): string[] {
  if (!template || !sourceUrl) return [];
  const sanitizedHtml = html.replace(/<(script|template|noscript)[^>]*>[\s\S]*?<\/\1>/gi, "");
  const document = new JSDOM(sanitizedHtml).window.document;
  const raw = extract(template, "list", document, sourceUrl);
  if (!raw) return [];
  try {
    const values = JSON.parse(raw) as unknown;
    if (!Array.isArray(values)) return [];
    return [...new Set(values.flatMap((value) => {
      if (typeof value !== "string" || !value.trim()) return [];
      try {
        const url = new URL(value, sourceUrl);
        url.hash = "";
        return url.protocol === "http:" || url.protocol === "https:" ? [url.toString()] : [];
      } catch {
        return [];
      }
    }))].slice(0, limit);
  } catch {
    return [];
  }
}

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

  const expressions = parseExpressions(template);
  if (expressions.length === 0) {
    return formatValues([template], type, sourceUrl);
  }

  let values: string[] = [];

  for (const { expression, token } of expressions) {
    let results: string[] = [];
    if (expression.startsWith("css:")) {
      results = evaluateCSS(document, expression.slice(4));
    } else {
      results = evaluateXPath(document, expression);
    }

    if (results.length === 0) {
      values = values.length === 0 ? [template.replace(token, "")] : values.map((value) => value.replace(token, ""));
      continue;
    }

    values = results.map((result, index) => {
      const current = values[index] ?? template;
      return current.replace(token, result);
    });
  }

  return formatValues(values, type, sourceUrl);
}

function parseExpressions(template: string) {
  // A CSS expression commonly contains `#` as its ID selector. When the
  // expression occupies the whole template, the first and last `#` are the
  // delimiters and every `#` in between belongs to the selector.
  if (template.startsWith("#css:") && template.endsWith("#") && template.indexOf("#css:", 1) === -1) {
    return [{ token: template, expression: template.slice(1, -1) }];
  }

  return [...template.matchAll(/#(.*?)#/g)].map((match) => ({
    token: match[0],
    expression: match[1],
  }));
}

function evaluateCSS(document: Document, cssExpression: string) {
  let selector = cssExpression;
  let attribute: string | null = null;

  let bracketDepth = 0;
  let lastAtSignIndex = -1;
  for (let i = 0; i < cssExpression.length; i++) {
    const char = cssExpression[i];
    if (char === "[") bracketDepth++;
    else if (char === "]") bracketDepth--;
    else if (char === "@" && bracketDepth === 0) {
      lastAtSignIndex = i;
    }
  }

  if (lastAtSignIndex !== -1) {
    selector = cssExpression.slice(0, lastAtSignIndex);
    attribute = cssExpression.slice(lastAtSignIndex + 1);
  }

  let elements: NodeListOf<Element>;
  try {
    elements = document.querySelectorAll(selector);
  } catch {
    throw new ScraperExpressionError(`Invalid CSS selector: ${selector || "(empty)"}`);
  }
  const values: string[] = [];
  elements.forEach((el) => {
    if (attribute) {
      const attrVal = el.getAttribute(attribute);
      if (attrVal !== null) {
        values.push(attrVal);
      }
    } else {
      values.push(el.textContent ?? "");
    }
  });

  return values.map((value) => value.trim()).filter(Boolean);
}

function evaluateXPath(document: Document, xpath: string) {
  let result: XPathResult;
  try {
    result = document.evaluate(xpath, document, null, document.defaultView?.XPathResult.ANY_TYPE ?? 0, null);
  } catch {
    throw new ScraperExpressionError(`Invalid XPath expression: ${xpath || "(empty)"}`);
  }
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
