import {
  assertUploadOptions,
  auditUploadPaths,
  parseUploadArgs,
  printUploadSummary,
} from "./_lib/legacy-uploads.mjs";

async function main() {
  const options = parseUploadArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  assertUploadOptions(options);

  const report = await auditUploadPaths({
    databaseUrl: options.databaseUrl,
    sourceDir: options.sourceDir,
    targetDir: options.targetDir,
  });

  printUploadSummary(report, { mode: "audit" });
}

function printHelp() {
  console.log([
    "Usage: npm run legacy:uploads:audit -- --database <url> --source <legacy-uploads-dir> --target <next-uploads-dir>",
    "",
    "Audits physical upload files referenced by the migrated database.",
    "",
    "Paths are user-defined. Pass directories that represent the root uploads folder.",
    "For a DB path like uploads/<user>/<file>, --source and --target should point to the directory containing <user>/.",
    "",
    "Environment fallback:",
    "  DATABASE_URL  migrated target PostgreSQL DSN",
  ].join("\n"));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
