import pg from "pg";
import { COUNT_TABLES } from "./_lib/legacy-db-mapping.mjs";

const { Client } = pg;

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.source || !options.target) {
    throw new Error("Both --source and --target are required.");
  }

  const source = new Client({ connectionString: options.source });
  const target = new Client({ connectionString: options.target });
  const failures = [];

  await source.connect();
  await target.connect();

  try {
    const sourceTables = await loadTables(source);
    const targetTables = await loadTables(target);

    console.log("Row counts:");
    for (const table of COUNT_TABLES) {
      if (!sourceTables.has(table.source)) {
        console.log(`- ${table.source}: source table missing, skipped`);
        continue;
      }
      if (!targetTables.has(table.target)) {
        failures.push(`${table.target} is missing in target database`);
        continue;
      }

      const sourceCount = await countRows(source, table.source);
      const targetCount = await countRows(target, table.target);
      const ok = sourceCount === targetCount;
      console.log(`- ${table.source} -> ${table.target}: ${sourceCount} / ${targetCount}${ok ? "" : " MISMATCH"}`);
      if (!ok) failures.push(`${table.source} -> ${table.target}: expected ${sourceCount}, got ${targetCount}`);
    }

    await validateNoBrokenForeignKeys(target, failures);
    await validateCounters(target, failures);
  } finally {
    await source.end();
    await target.end();
  }

  if (failures.length > 0) {
    console.error("\nValidation failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nValidation completed successfully.");
}

async function validateNoBrokenForeignKeys(client, failures) {
  const checks = [
    ["stk_collection", "owner_id", "stk_user"],
    ["stk_collection", "parent_id", "stk_collection"],
    ["stk_collection", "items_default_template_id", "stk_template"],
    ["stk_item", "collection_id", "stk_collection"],
    ["stk_item", "owner_id", "stk_user"],
    ["stk_datum", "item_id", "stk_item"],
    ["stk_datum", "collection_id", "stk_collection"],
    ["stk_datum", "choice_list_id", "stk_choice_list"],
    ["stk_tag", "owner_id", "stk_user"],
    ["stk_tag", "category_id", "stk_tag_category"],
    ["stk_album", "owner_id", "stk_user"],
    ["stk_album", "parent_id", "stk_album"],
    ["stk_photo", "album_id", "stk_album"],
    ["stk_wishlist", "owner_id", "stk_user"],
    ["stk_wishlist", "parent_id", "stk_wishlist"],
    ["stk_wish", "wishlist_id", "stk_wishlist"],
    ["stk_loan", "item_id", "stk_item"],
    ["stk_path", "scraper_id", "stk_scraper"],
  ];

  console.log("\nForeign key integrity:");
  for (const [table, column, foreignTable] of checks) {
    const count = await countBrokenReferences(client, table, column, foreignTable);
    console.log(`- ${table}.${column}: ${count} broken reference(s)`);
    if (count > 0) failures.push(`${table}.${column} has ${count} broken reference(s)`);
  }
}

async function validateCounters(client, failures) {
  const checks = [
    ["stk_collection", "children_count", "stk_collection", "parent_id"],
    ["stk_album", "children_count", "stk_album", "parent_id"],
    ["stk_album", "photos_count", "stk_photo", "album_id"],
    ["stk_wishlist", "children_count", "stk_wishlist", "parent_id"],
    ["stk_wishlist", "wishes_count", "stk_wish", "wishlist_id"],
  ];

  console.log("\nCached counters:");
  for (const [table, countColumn, childTable, childColumn] of checks) {
    const { rows } = await client.query(`
      SELECT COUNT(*)::int AS mismatches
      FROM ${quoteIdent(table)} parent
      WHERE COALESCE(parent.${quoteIdent(countColumn)}, 0) <> (
        SELECT COUNT(*)::int
        FROM ${quoteIdent(childTable)} child
        WHERE child.${quoteIdent(childColumn)} = parent.id
      )
    `);
    const count = rows[0].mismatches;
    console.log(`- ${table}.${countColumn}: ${count} mismatch(es)`);
    if (count > 0) failures.push(`${table}.${countColumn} has ${count} mismatch(es); run maintenance:refresh-cached-values after migration`);
  }
}

async function countBrokenReferences(client, table, column, foreignTable) {
  const { rows } = await client.query(`
    SELECT COUNT(*)::int AS count
    FROM ${quoteIdent(table)} child
    LEFT JOIN ${quoteIdent(foreignTable)} parent ON parent.id = child.${quoteIdent(column)}
    WHERE child.${quoteIdent(column)} IS NOT NULL AND parent.id IS NULL
  `);
  return rows[0].count;
}

async function countRows(client, table) {
  const { rows } = await client.query(`SELECT COUNT(*)::int AS count FROM ${quoteIdent(table)}`);
  return rows[0].count;
}

async function loadTables(client) {
  const { rows } = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  return new Set(rows.map((row) => row.table_name));
}

function quoteIdent(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function parseArgs(args) {
  const options = { help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") options.help = true;
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
    "Usage: npm run legacy:validate -- --source <legacy-url> --target <next-url>",
    "",
    "Compares source koi_* row counts with target stk_* row counts and checks core target integrity.",
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
