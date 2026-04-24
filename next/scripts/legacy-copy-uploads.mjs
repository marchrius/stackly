import {
  assertUploadOptions,
  copyUploadPaths,
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

  const dryRun = !options.execute;
  const report = await copyUploadPaths({
    databaseUrl: options.databaseUrl,
    sourceDir: options.sourceDir,
    targetDir: options.targetDir,
    dryRun,
  });

  printUploadSummary(report, { mode: dryRun ? "copy dry-run" : "copy" });

  if (dryRun) {
    console.log("\nRe-run with --execute to copy files.");
  }
}

function printHelp() {
  console.log([
    "Usage: npm run legacy:uploads:copy -- --database <url> --source <legacy-uploads-dir> --target <next-uploads-dir> [--dry-run|--execute]",
    "",
    "Copies physical upload files referenced by the migrated database.",
    "Dry-run is the default. Existing target files are skipped.",
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
