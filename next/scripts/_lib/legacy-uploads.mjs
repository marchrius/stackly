import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const { Client } = pg;

export const UPLOAD_COLUMNS = [
  ["stk_user", "avatar"],
  ["stk_collection", "image"],
  ["stk_item", "image"],
  ["stk_item", "image_small_thumbnail"],
  ["stk_item", "image_large_thumbnail"],
  ["stk_datum", "image"],
  ["stk_datum", "image_small_thumbnail"],
  ["stk_datum", "file"],
  ["stk_datum", "video"],
  ["stk_album", "image"],
  ["stk_photo", "image"],
  ["stk_photo", "image_small_thumbnail"],
  ["stk_wishlist", "image"],
  ["stk_wish", "image"],
  ["stk_wish", "image_small_thumbnail"],
  ["stk_tag", "image"],
  ["stk_tag", "image_small_thumbnail"],
];

export async function collectUploadPaths(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const existingColumns = await loadColumns(client);
    const paths = new Map();

    for (const [table, column] of UPLOAD_COLUMNS) {
      if (!existingColumns.get(table)?.has(column)) continue;

      const { rows } = await client.query(`
        SELECT ${quoteIdent(column)} AS upload_path
        FROM ${quoteIdent(table)}
        WHERE ${quoteIdent(column)} IS NOT NULL AND ${quoteIdent(column)} <> ''
      `);

      for (const row of rows) {
        const normalized = normalizeUploadPath(row.upload_path);
        if (!normalized) continue;

        const references = paths.get(normalized) ?? [];
        references.push(`${table}.${column}`);
        paths.set(normalized, references);
      }
    }

    return [...paths.entries()]
      .map(([uploadPath, references]) => ({ uploadPath, references }))
      .sort((a, b) => a.uploadPath.localeCompare(b.uploadPath));
  } finally {
    await client.end();
  }
}

export async function auditUploadPaths({ databaseUrl, sourceDir, targetDir }) {
  const uploads = await collectUploadPaths(databaseUrl);
  const foundInSource = [];
  const missingInSource = [];
  const foundInTarget = [];
  const missingInTarget = [];

  for (const upload of uploads) {
    const sourcePath = resolveUploadPath(sourceDir, upload.uploadPath);
    const targetPath = resolveUploadPath(targetDir, upload.uploadPath);
    const sourceExists = await fileExists(sourcePath);
    const targetExists = await fileExists(targetPath);

    const entry = {
      ...upload,
      sourcePath,
      targetPath,
    };

    if (sourceExists) foundInSource.push(entry);
    else missingInSource.push(entry);

    if (targetExists) foundInTarget.push(entry);
    else missingInTarget.push(entry);
  }

  return {
    total: uploads.length,
    foundInSource,
    missingInSource,
    foundInTarget,
    missingInTarget,
  };
}

export async function copyUploadPaths({ databaseUrl, sourceDir, targetDir, dryRun }) {
  const report = await auditUploadPaths({ databaseUrl, sourceDir, targetDir });
  const copied = [];
  const skippedExisting = [];
  const missing = report.missingInSource;

  for (const entry of report.foundInSource) {
    if (await fileExists(entry.targetPath)) {
      skippedExisting.push(entry);
      continue;
    }

    if (!dryRun) {
      await fs.mkdir(path.dirname(entry.targetPath), { recursive: true });
      await fs.copyFile(entry.sourcePath, entry.targetPath);
    }

    copied.push(entry);
  }

  return {
    ...report,
    copied,
    skippedExisting,
    missing,
  };
}

export function normalizeUploadPath(value) {
  if (!value || typeof value !== "string") return null;

  let normalized = value.trim().replaceAll("\\", "/");
  normalized = normalized.replace(/^https?:\/\/[^/]+\/+/i, "");
  normalized = normalized.replace(/^\/+/, "");
  normalized = normalized.replace(/^public\/+/i, "");
  normalized = normalized.replace(/^uploads\/+/i, "");

  if (!normalized || normalized === "." || normalized.includes("..")) return null;
  return normalized;
}

export function resolveUploadPath(baseDir, uploadPath) {
  const resolved = path.resolve(baseDir, uploadPath);
  const base = path.resolve(baseDir);

  if (resolved !== base && !resolved.startsWith(`${base}${path.sep}`)) {
    throw new Error(`Upload path escapes base directory: ${uploadPath}`);
  }

  return resolved;
}

export function parseUploadArgs(args) {
  const options = { help: false, execute: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--execute") options.execute = true;
    else if (arg === "--dry-run") options.execute = false;
    else if (arg === "--database") options.databaseUrl = args[++index];
    else if (arg.startsWith("--database=")) options.databaseUrl = arg.slice("--database=".length);
    else if (arg === "--source") options.sourceDir = args[++index];
    else if (arg.startsWith("--source=")) options.sourceDir = arg.slice("--source=".length);
    else if (arg === "--target") options.targetDir = args[++index];
    else if (arg.startsWith("--target=")) options.targetDir = arg.slice("--target=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  options.databaseUrl ??= process.env.DATABASE_URL;
  return options;
}

export function assertUploadOptions(options, { requireTarget = true } = {}) {
  if (!options.databaseUrl) throw new Error("--database or DATABASE_URL is required.");
  if (!options.sourceDir) throw new Error("--source is required.");
  if (requireTarget && !options.targetDir) throw new Error("--target is required.");
}

export function printUploadSummary(report, { mode }) {
  console.log(`Upload ${mode} summary:`);
  console.log(`- referenced files: ${report.total}`);
  console.log(`- found in source: ${report.foundInSource.length}`);
  console.log(`- missing in source: ${report.missingInSource.length}`);
  console.log(`- found in target: ${report.foundInTarget.length}`);
  console.log(`- missing in target: ${report.missingInTarget.length}`);

  if (report.copied) console.log(`- ${mode === "copy dry-run" ? "would copy" : "copied"}: ${report.copied.length}`);
  if (report.skippedExisting) console.log(`- skipped existing: ${report.skippedExisting.length}`);

  if (report.missingInSource.length > 0) {
    console.log("\nMissing source files:");
    for (const entry of report.missingInSource.slice(0, 25)) {
      console.log(`- ${entry.uploadPath} (${entry.references.join(", ")})`);
    }
    if (report.missingInSource.length > 25) {
      console.log(`- ...and ${report.missingInSource.length - 25} more`);
    }
  }
}

async function loadColumns(client) {
  const { rows } = await client.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);
  const columns = new Map();
  for (const row of rows) {
    if (!columns.has(row.table_name)) columns.set(row.table_name, new Set());
    columns.get(row.table_name).add(row.column_name);
  }
  return columns;
}

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function quoteIdent(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}
