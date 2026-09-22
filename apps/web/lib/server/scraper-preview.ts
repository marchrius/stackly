import { JSDOM } from "jsdom";

export type ScraperPreviewPath = { id: string; name: string; type: string; path: string; inputFormat?: string | null };

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
      value: extract(path.path, path.type, document, config.url, path.inputFormat),
    })),
  };
}

function extract(template: string | null, type: string, document: Document, sourceUrl: string | null, inputFormat?: string | null) {
  if (!template) return null;

  const expressions = parseExpressions(template);
  if (expressions.length === 0) {
    return formatValues([template], type, sourceUrl, inputFormat);
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

  return formatValues(values, type, sourceUrl, inputFormat);
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

function formatValues(values: string[], type: string, sourceUrl: string | null, inputFormat?: string | null) {
  if (values.length === 0) return null;

  if (type === "text") return unique(values).join(", ");
  if (type === "list" || type === "choice-list") return JSON.stringify(unique(values));
  if (type === "textarea") return values[0];
  if (type === "country") {
    const value = values[0]?.trim();
    if (!value) return null;
    return value.length <= 3 ? value.toUpperCase() : value;
  }
  if (type === "date") return normalizeDate(values[0], inputFormat);
  if (type === "number") return normalizeNumber(values[0], inputFormat);
  if (type === "image" || type === "link") return guessHost(values[0], sourceUrl);

  return values[0] ?? null;
}

function normalizeDate(value: string | undefined, inputFormat?: string | null) {
  const source = value?.trim();
  if (!source) return null;

  if (!inputFormat?.trim()) {
    const isoMatch = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) return validIsoDate(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));
    const parsed = new Date(source);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
  }

  const tokens = inputFormat.trim().match(/YYYY|yyyy|MMMM|MMM|DD|dd|MM|Y|m|d|./g) ?? [];
  const captures: Array<"year" | "month" | "month-long" | "month-short" | "day"> = [];
  const pattern = tokens.map((token) => {
    if (token === "YYYY" || token === "yyyy" || token === "Y") {
      captures.push("year");
      return "(\\d{4})";
    }
    if (token === "MM" || token === "m") {
      captures.push("month");
      return token === "MM" ? "(\\d{2})" : "(\\d{1,2})";
    }
    if (token === "MMMM" || token === "MMM") {
      const style = token === "MMMM" ? "long" : "short";
      captures.push(token === "MMMM" ? "month-long" : "month-short");
      return `(${monthNamePattern(style)})`;
    }
    if (token === "DD" || token === "dd" || token === "d") {
      captures.push("day");
      return token === "DD" || token === "dd" ? "(\\d{2})" : "(\\d{1,2})";
    }
    return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }).join("");

  const hasMonth = captures.some((capture) => capture === "month" || capture === "month-long" || capture === "month-short");
  if (!captures.includes("year") || !hasMonth) {
    throw new ScraperExpressionError(`Invalid date input format: ${inputFormat}`);
  }

  const match = source.match(new RegExp(`^${pattern}$`, "iu"));
  if (!match) throw new ScraperExpressionError(`Date "${source}" does not match input format ${inputFormat}`);

  let year: number | undefined;
  let month: number | undefined;
  let day = 1;
  captures.forEach((part, index) => {
    const captured = match[index + 1];
    if (part === "year") year = Number(captured);
    else if (part === "day") day = Number(captured);
    else if (part === "month") month = Number(captured);
    else month = monthNameMap(part === "month-long" ? "long" : "short").get(normalizeMonthName(captured));
  });

  const normalized = year && month ? validIsoDate(year, month, day) : null;
  if (!normalized) throw new ScraperExpressionError(`Invalid date value: ${source}`);
  return normalized;
}

const DATE_MONTH_LOCALES = ["da", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "pt-BR", "ru", "tr", "uk", "zh"];
const monthNames = new Map<"long" | "short", Map<string, { display: string; month: number }>>();

function monthNameMap(style: "long" | "short") {
  let names = monthNames.get(style);
  if (names) return new Map([...names].map(([key, value]) => [key, value.month]));

  names = new Map();
  for (const locale of DATE_MONTH_LOCALES) {
    const formatter = new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" });
    for (let month = 1; month <= 12; month++) {
      const display = formatter.format(new Date(Date.UTC(2020, month - 1, 1)));
      names.set(normalizeMonthName(display), { display, month });
    }
  }
  monthNames.set(style, names);
  return new Map([...names].map(([key, value]) => [key, value.month]));
}

function monthNamePattern(style: "long" | "short") {
  const displays = new Set<string>();
  for (const locale of DATE_MONTH_LOCALES) {
    const formatter = new Intl.DateTimeFormat(locale, { month: style, timeZone: "UTC" });
    for (let month = 1; month <= 12; month++) {
      displays.add(formatter.format(new Date(Date.UTC(2020, month - 1, 1))));
    }
  }
  return [...displays]
    .map((display) => display.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|");
}

function normalizeMonthName(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").replace(/[.\s]/g, "").toLocaleLowerCase();
}

function validIsoDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function normalizeNumber(value: string | undefined, inputFormat?: string | null) {
  const source = value?.trim();
  if (!source) return null;

  let candidate: string | undefined;
  if (inputFormat?.trim()) {
    let pattern: RegExp;
    try {
      pattern = new RegExp(inputFormat.trim());
    } catch {
      throw new ScraperExpressionError(`Invalid number extraction pattern: ${inputFormat}`);
    }
    const match = source.match(pattern);
    if (!match) throw new ScraperExpressionError(`Number "${source}" does not match extraction pattern ${inputFormat}`);
    candidate = match[1] ?? match[0];
  } else {
    candidate = source.match(/[+-]?(?:\d[\d\s.,']*\d|\d)/)?.[0];
  }

  if (!candidate) return null;
  let normalized = candidate.replace(/[\s']/g, "");
  const comma = normalized.lastIndexOf(",");
  const dot = normalized.lastIndexOf(".");

  if (comma !== -1 && dot !== -1) {
    const decimalSeparator = comma > dot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.split(thousandsSeparator).join("").replace(decimalSeparator, ".");
  } else if (comma !== -1) {
    normalized = normalized.replace(/,/g, ".");
  }

  const number = Number(normalized);
  if (!Number.isFinite(number)) throw new ScraperExpressionError(`Invalid number value: ${candidate}`);
  return String(number);
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
