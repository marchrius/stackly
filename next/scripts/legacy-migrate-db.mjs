import pg from "pg";
import { DIRECT_TABLES, JOIN_TABLES, POST_IMPORT_UPDATES } from "./_lib/legacy-db-mapping.mjs";

const { Client } = pg;

const SUPPORTED_LOCALES = new Set(["da", "de", "en", "es", "fr", "it", "nl", "pl", "pt", "pt_BR", "ru", "tr", "uk", "zh"]);
const VISIBILITIES = new Set(["public", "internal", "private"]);
const THEMES = new Set(["auto", "light", "dark"]);

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.source || !options.target) {
    throw new Error("Both --source and --target are required.");
  }

  const dryRun = !options.execute;
  const source = new Client({ connectionString: options.source });
  const target = new Client({ connectionString: options.target });
  const report = {
    mode: dryRun ? "dry-run" : "execute",
    tables: [],
    joins: [],
    updates: [],
    warnings: [],
  };

  await source.connect();
  await target.connect();

  try {
    const sourceColumns = await loadColumns(source);
    const targetColumns = await loadColumns(target);

    await assertTargetLooksEmpty(target, dryRun);

    if (!dryRun) {
      await target.query("BEGIN");
    }

    for (const table of DIRECT_TABLES) {
      const result = await copyTable({ source, target, sourceColumns, targetColumns, table, dryRun, warnings: report.warnings });
      report.tables.push(result);
      console.log(`${dryRun ? "Would copy" : "Copied"} ${result.rows} row(s): ${table.source} -> ${table.target}`);
    }

    for (const join of JOIN_TABLES) {
      const result = await copyJoinTable({ source, target, sourceColumns, targetColumns, join, dryRun });
      report.joins.push(result);
      console.log(`${dryRun ? "Would copy" : "Copied"} ${result.rows} row(s): ${join.source} -> ${join.target}`);
    }

    for (const update of POST_IMPORT_UPDATES) {
      const result = await applyDeferredUpdate({ source, target, sourceColumns, targetColumns, update, dryRun });
      report.updates.push(result);
      console.log(`${dryRun ? "Would update" : "Updated"} ${result.rows} row(s): ${update.target}`);
    }

    if (!dryRun) {
      await target.query("COMMIT");
    }
  } catch (error) {
    if (!dryRun) {
      await target.query("ROLLBACK").catch(() => {});
    }
    throw error;
  } finally {
    await source.end();
    await target.end();
  }

  if (report.warnings.length > 0) {
    console.warn("\nWarnings:");
    for (const warning of report.warnings) console.warn(`- ${warning}`);
  }

  console.log(`\nLegacy DB migration ${dryRun ? "dry-run completed" : "completed"}.`);
  if (dryRun) {
    console.log("Re-run with --execute to write to the target database.");
  }
}

async function copyTable(context) {
  const { source, target, sourceColumns, targetColumns, table, dryRun, warnings } = context;
  const availableSourceColumns = sourceColumns.get(table.source);
  const availableTargetColumns = targetColumns.get(table.target);

  if (!availableSourceColumns) return { source: table.source, target: table.target, rows: 0, skipped: "missing source table" };
  if (!availableTargetColumns) throw new Error(`Target table ${table.target} does not exist. Did you apply Prisma migrations?`);

  const { rows } = await source.query(`SELECT * FROM ${quoteIdent(table.source)} ORDER BY id`);
  const deferred = new Set(table.defer ?? []);
  let copied = 0;

  for (const row of rows) {
    const record = {};

    for (const definition of table.columns) {
      const [targetColumn, rawSourceColumn, fallback, transform] = definition;
      const sourceColumn = rawSourceColumn ?? targetColumn;
      if (deferred.has(targetColumn)) continue;
      if (!availableTargetColumns.has(targetColumn)) continue;

      let value;
      if (availableSourceColumns.has(sourceColumn)) {
        value = row[sourceColumn];
      } else if (fallback !== undefined) {
        value = fallback;
      } else {
        continue;
      }

      if (value === null && fallback !== undefined) {
        value = fallback;
      }

      record[targetColumn] = normalizeValue(value, transform, `${table.source}.${sourceColumn}`, warnings);
    }

    if (!dryRun) {
      await insertRecord(target, table.target, record);
    }
    copied += 1;
  }

  return { source: table.source, target: table.target, rows: copied };
}

async function copyJoinTable({ source, target, sourceColumns, targetColumns, join, dryRun }) {
  const sourceTable = sourceColumns.get(join.source);
  const targetTableName = join.target.replaceAll('"', "");
  const targetTable = targetColumns.get(targetTableName);
  if (!sourceTable) return { source: join.source, target: targetTableName, rows: 0, skipped: "missing source table" };
  if (!targetTable) throw new Error(`Target join table ${join.target} does not exist.`);

  const sourceSelect = join.columns.map(([, sourceColumn]) => quoteIdent(sourceColumn)).join(", ");
  const { rows } = await source.query(`SELECT ${sourceSelect} FROM ${quoteIdent(join.source)}`);
  let copied = 0;

  for (const row of rows) {
    const record = Object.fromEntries(join.columns.map(([targetColumn, sourceColumn]) => [targetColumn, row[sourceColumn]]));
    if (!dryRun) {
      await insertRecord(target, join.target, record, true);
    }
    copied += 1;
  }

  return { source: join.source, target: targetTableName, rows: copied };
}

async function applyDeferredUpdate({ source, target, sourceColumns, targetColumns, update, dryRun }) {
  const sourceTable = sourceColumns.get(update.source);
  const targetTable = targetColumns.get(update.target);
  if (!sourceTable || !targetTable) return { source: update.source, target: update.target, rows: 0, skipped: "missing table" };
  let updated = 0;

  for (const [targetColumn, sourceColumn = targetColumn] of update.columns) {
    if (!sourceTable.has(sourceColumn) || !targetTable.has(targetColumn)) continue;
    const { rows } = await source.query(
      `SELECT ${quoteIdent(update.key)} AS id, ${quoteIdent(sourceColumn)} AS value FROM ${quoteIdent(update.source)} WHERE ${quoteIdent(sourceColumn)} IS NOT NULL`,
    );
    for (const row of rows) {
      if (!dryRun) {
        await target.query(
          `UPDATE ${quoteIdent(update.target)} SET ${quoteIdent(targetColumn)} = $1 WHERE ${quoteIdent(update.key)} = $2`,
          [row.value, row.id],
        );
      }
      updated += 1;
    }
  }

  return { source: update.source, target: update.target, rows: updated };
}

async function insertRecord(client, table, record, alreadyQuoted = false) {
  const entries = Object.entries(record);
  if (entries.length === 0) return;

  const columns = entries.map(([column]) => quoteIdent(column)).join(", ");
  const placeholders = entries.map((_, index) => `$${index + 1}`).join(", ");
  const values = entries.map(([, value]) => value);
  const tableName = alreadyQuoted ? table : quoteIdent(table);

  await client.query(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
}

async function assertTargetLooksEmpty(client, dryRun) {
  const tableNames = [
    ...DIRECT_TABLES.map((table) => table.target),
    ...JOIN_TABLES.map((table) => table.target.replaceAll('"', "")),
  ];
  const existing = await loadColumns(client);
  const nonEmpty = [];

  for (const table of tableNames) {
    if (!existing.has(table)) continue;
    const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
    if (rows[0].count > 0) nonEmpty.push(table);
  }

  if (nonEmpty.length > 0 && !dryRun) {
    throw new Error(`Target database is not empty: ${nonEmpty.join(", ")}`);
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

function normalizeValue(value, transform, label, warnings) {
  if (value === undefined) return undefined;
  if (value === null) return null;

  if (transform === "json") return normalizeJson(value, null, label, warnings);
  if (transform === "arrayJson") return normalizeJson(value, [], label, warnings);
  if (transform === "locale") return normalizeLocale(value);
  if (transform === "visibility") return normalizeVisibility(value);
  if (transform === "theme") return normalizeTheme(value);

  return value;
}

function normalizeJson(value, fallback, label, warnings) {
  if (value === null) return fallback === null ? null : JSON.stringify(fallback);
  if (Array.isArray(value) || typeof value === "object") return JSON.stringify(value);
  if (typeof value !== "string") return value;
  if (value.trim() === "") return fallback;

  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    const phpArray = parsePhpSerializedStringArray(value);
    if (phpArray) return JSON.stringify(phpArray);
    const postgresqlArray = parsePostgresqlArrayLiteral(value);
    if (postgresqlArray) return JSON.stringify(postgresqlArray);
    if (value.includes(",") && !value.startsWith("a:")) {
      return JSON.stringify(value.split(",").map((entry) => entry.trim()).filter(Boolean));
    }
    warnings.push(`${label} is not JSON-compatible; using ${JSON.stringify(fallback)}.`);
    return fallback === null ? null : JSON.stringify(fallback);
  }
}

function parsePhpSerializedStringArray(value) {
  if (!value.startsWith("a:")) return null;

  const matches = [...value.matchAll(/s:\d+:"((?:[^"\\]|\\.)*)"/g)].map((match) =>
    match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\"),
  );

  return matches.length > 0 ? matches : null;
}

function parsePostgresqlArrayLiteral(value) {
  if (!value.startsWith("{") || !value.endsWith("}")) return null;

  const content = value.slice(1, -1);
  if (content.trim() === "") return [];

  return content
    .split(",")
    .map((entry) => entry.trim().replace(/^"|"$/g, "").replace(/\\"/g, '"'))
    .filter(Boolean);
}

function normalizeLocale(value) {
  const locale = String(value ?? "en").replace("-", "_");
  if (SUPPORTED_LOCALES.has(locale)) return locale;
  const short = locale.split("_")[0];
  return SUPPORTED_LOCALES.has(short) ? short : "en";
}

function normalizeVisibility(value) {
  const visibility = String(value ?? "public");
  if (visibility === "authenticated-users-only") return "internal";
  return VISIBILITIES.has(visibility) ? visibility : "public";
}

function normalizeTheme(value) {
  const theme = String(value ?? "auto");
  if (theme === "browser") return "auto";
  return THEMES.has(theme) ? theme : "auto";
}

function quoteIdent(identifier) {
  if (identifier.startsWith('"') && identifier.endsWith('"')) return identifier;
  return `"${identifier.replaceAll('"', '""')}"`;
}

function parseArgs(args) {
  const options = { execute: false, help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--execute") options.execute = true;
    else if (arg === "--dry-run") options.execute = false;
    else if (arg === "--source") options.source = args[++index];
    else if (arg.startsWith("--source=")) options.source = arg.slice("--source=".length);
    else if (arg === "--target") options.target = args[++index];
    else if (arg.startsWith("--target=")) options.target = arg.slice("--target=".length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  options.source ??= process.env.LEGACY_DATABASE_URL;
  options.target ??= process.env.DATABASE_URL;
  return options;
}

function printHelp() {
  console.log([
    "Usage: npm run legacy:migrate -- --source <legacy-url> --target <next-url> [--dry-run|--execute]",
    "",
    "Copies PostgreSQL legacy tables koi_* into a Prisma-created target database with stk_* tables.",
    "Dry-run is the default. Use --execute to write to the target database.",
    "",
    "Environment fallbacks:",
    "  LEGACY_DATABASE_URL  source PostgreSQL DSN",
    "  DATABASE_URL         target PostgreSQL DSN",
  ].join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
