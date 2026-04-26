import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES_DIR = path.join(ROOT, "apps", "web", "messages");
const LOCALES_TS = path.join(ROOT, "apps", "web", "i18n", "locales.ts");
const BASE_LOCALE = "en";
const PLACEHOLDER_RE = /\{[^{}]+\}/g;

async function main() {
  const locales = await parseSupportedLocales();
  const messageFiles = await readdir(MESSAGES_DIR);
  const jsonLocales = messageFiles
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"))
    .sort();

  const missingFiles = locales.filter((locale) => !jsonLocales.includes(locale));
  if (missingFiles.length > 0) {
    fail(`Missing locale file(s): ${missingFiles.join(", ")}`);
  }

  const extraFiles = jsonLocales.filter((locale) => !locales.includes(locale));
  if (extraFiles.length > 0) {
    fail(`Locale file(s) not declared in SUPPORTED_LOCALES: ${extraFiles.join(", ")}`);
  }

  const basePath = path.join(MESSAGES_DIR, `${BASE_LOCALE}.json`);
  const baseObject = await readJson(basePath, BASE_LOCALE);
  const baseFlat = flatten(baseObject);
  const baseKeys = new Set(Object.keys(baseFlat));
  const errors = [];

  for (const locale of locales) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
    const messages = await readJson(filePath, locale, errors);
    if (!messages) continue;

    const flat = flatten(messages, "", errors);
    const keys = new Set(Object.keys(flat));
    const missing = [...baseKeys].filter((key) => !keys.has(key)).sort();
    const extra = [...keys].filter((key) => !baseKeys.has(key)).sort();

    if (missing.length > 0) {
      errors.push(`${locale}: missing key(s) (${missing.length}), example: ${missing.slice(0, 5).join(", ")}`);
    }
    if (extra.length > 0) {
      errors.push(`${locale}: extra key(s) (${extra.length}), example: ${extra.slice(0, 5).join(", ")}`);
    }

    for (const key of [...baseKeys].filter((entry) => keys.has(entry)).sort()) {
      const basePlaceholders = placeholders(baseFlat[key]);
      const localePlaceholders = placeholders(flat[key]);
      if (!sameArray(basePlaceholders, localePlaceholders)) {
        errors.push(
          `${locale}: placeholder mismatch in '${key}' (base=${formatArray(basePlaceholders)}, locale=${formatArray(localePlaceholders)})`,
        );
      }
    }
  }

  if (errors.length > 0) {
    console.error("[i18n:validate] Errors found:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`[i18n:validate] OK: validated ${locales.length} locale(s); schema and placeholders match ${BASE_LOCALE}.json`);
}

async function parseSupportedLocales() {
  const content = await readFile(LOCALES_TS, "utf8");
  const match = content.match(/SUPPORTED_LOCALES\s*=\s*\[(.*?)\]\s*as\s*const/s);
  if (!match) {
    fail("Unable to find SUPPORTED_LOCALES in i18n/locales.ts");
  }

  return [...match[1].matchAll(/"([A-Za-z_]+)"/g)].map((entry) => entry[1]);
}

async function readJson(filePath, locale, errors = null) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (errors) {
      errors.push(`${locale}: invalid JSON (${message})`);
      return null;
    }
    fail(`${locale}: invalid JSON (${message})`);
  }
}

function flatten(node, prefix = "", errors = null) {
  const result = {};

  if (node && typeof node === "object" && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      const childPrefix = prefix ? `${prefix}.${key}` : key;
      Object.assign(result, flatten(value, childPrefix, errors));
    }
    return result;
  }

  if (typeof node === "string") {
    result[prefix] = node;
    return result;
  }

  const message = `Non-string value found at key '${prefix}': ${Array.isArray(node) ? "array" : typeof node}`;
  if (errors) {
    errors.push(message);
    return result;
  }
  fail(message);
}

function placeholders(text) {
  return [...text.matchAll(PLACEHOLDER_RE)].map((match) => match[0]).sort();
}

function sameArray(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function formatArray(values) {
  return `[${values.join(", ")}]`;
}

function fail(message) {
  console.error(`[i18n:validate] ERROR: ${message}`);
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
