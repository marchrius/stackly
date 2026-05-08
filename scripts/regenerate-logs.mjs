import { closePrisma, hasFlag, printHelp, prisma } from "./_lib/maintenance.mjs";

const TARGETS = [
  { delegate: "collection", objectClass: "Collection", labelField: "title" },
  { delegate: "item", objectClass: "Item", labelField: "name" },
  { delegate: "wishlist", objectClass: "Wishlist", labelField: "name" },
  { delegate: "wish", objectClass: "Wish", labelField: "name" },
  { delegate: "album", objectClass: "Album", labelField: "title" },
  { delegate: "photo", objectClass: "Photo", labelField: "title" },
  { delegate: "tag", objectClass: "Tag", labelField: "label" },
  { delegate: "tagCategory", objectClass: "TagCategory", labelField: "label" },
  { delegate: "template", objectClass: "Template", labelField: "name" },
  { delegate: "choiceList", objectClass: "ChoiceList", labelField: "name" },
  { delegate: "inventory", objectClass: "Inventory", labelField: "name" },
];

async function main() {
  if (hasFlag("--help")) {
    printHelp([
      "Usage: npm run maintenance:regenerate-logs -- [--dry-run]",
      "",
      "Regenerates missing create logs for migrated entities and marks delete logs as objectDeleted=true.",
    ]);
    return;
  }

  const dryRun = hasFlag("--dry-run");
  let createdCount = 0;

  for (const target of TARGETS) {
    const records = await prisma[target.delegate].findMany({
      select: {
        id: true,
        ownerId: true,
        createdAt: true,
        [target.labelField]: true,
      },
    });

    const existingLogs = await prisma.log.findMany({
      where: { type: "create", objectClass: target.objectClass },
      select: { objectId: true },
    });

    const existingIds = new Set(existingLogs.map((log) => log.objectId));
    const missingLogs = records
      .filter((record) => record.ownerId && !existingIds.has(record.id))
      .map((record) => ({
        type: "create",
        loggedAt: record.createdAt,
        objectId: record.id,
        objectLabel: String(record[target.labelField] ?? record.id),
        objectClass: target.objectClass,
        ownerId: record.ownerId,
      }));

    if (!dryRun && missingLogs.length > 0) {
      await prisma.log.createMany({ data: missingLogs });
    }

    createdCount += missingLogs.length;
    console.log(`${target.objectClass}: ${missingLogs.length} missing create log(s) ${dryRun ? "found" : "generated"}.`);
  }

  const deleteLogsCount = await prisma.log.count({
    where: { type: "delete", objectDeleted: false },
  });

  if (!dryRun && deleteLogsCount > 0) {
    await prisma.log.updateMany({
      where: { type: "delete", objectDeleted: false },
      data: { objectDeleted: true },
    });
  }

  console.log(`${dryRun ? "Would generate" : "Generated"} ${createdCount} create log(s).`);
  console.log(`${dryRun ? "Would mark" : "Marked"} ${deleteLogsCount} delete log(s) as deleted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePrisma);
