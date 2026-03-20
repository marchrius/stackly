import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import {
  closePrisma,
  deriveThumbnailPath,
  ensureParentDir,
  fileExists,
  hasFlag,
  printHelp,
  prisma,
  toPosixPath,
  UPLOAD_DIR,
} from "./_lib/maintenance.mjs";

const TARGETS = [
  { delegate: "item", label: "Item", smallField: "imageSmallThumbnail", largeField: "imageLargeThumbnail" },
  { delegate: "datum", label: "Datum", smallField: "imageSmallThumbnail", largeField: null },
  { delegate: "wish", label: "Wish", smallField: "imageSmallThumbnail", largeField: null },
  { delegate: "photo", label: "Photo", smallField: "imageSmallThumbnail", largeField: null },
  { delegate: "tag", label: "Tag", smallField: "imageSmallThumbnail", largeField: null },
];

async function main() {
  if (hasFlag("--help")) {
    printHelp([
      "Usage: npm run maintenance:regenerate-thumbnails -- [--dry-run]",
      "",
      "Regenerates thumbnails for records with an original image, using the optional admin thumbnail format configuration.",
    ]);
    return;
  }

  const dryRun = hasFlag("--dry-run");
  const thumbnailFormat = await getThumbnailFormat();
  let regenerated = 0;
  let missingSources = 0;

  console.log(`Using upload dir: ${UPLOAD_DIR}`);
  console.log(`Thumbnail format: ${thumbnailFormat ?? "keep-original"}`);

  for (const target of TARGETS) {
    const rows = await prisma[target.delegate].findMany({
      where: { image: { not: null } },
      select: {
        id: true,
        image: true,
        [target.smallField]: true,
        ...(target.largeField ? { [target.largeField]: true } : {}),
      },
    });

    let targetCount = 0;
    for (const row of rows) {
      const imagePath = row.image;
      if (!imagePath) continue;

      const sourceFile = path.join(UPLOAD_DIR, imagePath);
      if (!(await fileExists(sourceFile))) {
        missingSources += 1;
        continue;
      }

      const nextSmall = deriveThumbnailPath(imagePath, "_small", thumbnailFormat);
      const updateData = {
        [target.smallField]: nextSmall,
      };

      const outputs = [{ absolutePath: path.join(UPLOAD_DIR, nextSmall), size: "small" }];

      if (target.largeField) {
        const nextLarge = deriveThumbnailPath(imagePath, "_large", thumbnailFormat);
        updateData[target.largeField] = nextLarge;
        outputs.push({ absolutePath: path.join(UPLOAD_DIR, nextLarge), size: "large" });
      }

      if (!dryRun) {
        for (const output of outputs) {
          await ensureParentDir(output.absolutePath);
          const pipeline = sharp(sourceFile);
          if (output.size === "small") {
            await applyFormat(pipeline.resize(200, 200, { fit: "cover" }), thumbnailFormat).toFile(output.absolutePath);
          } else {
            await applyFormat(pipeline.resize(600, 600, { fit: "inside", withoutEnlargement: true }), thumbnailFormat).toFile(output.absolutePath);
          }
        }

        await deleteIfReplaced(row[target.smallField], nextSmall);
        if (target.largeField) {
          await deleteIfReplaced(row[target.largeField], updateData[target.largeField]);
        }

        await prisma[target.delegate].update({
          where: { id: row.id },
          data: updateData,
        });
      }

      regenerated += 1;
      targetCount += 1;
    }

    console.log(`${target.label}: ${dryRun ? "would regenerate" : "regenerated"} ${targetCount} thumbnail set(s).`);
  }

  console.log(`${dryRun ? "Would regenerate" : "Regenerated"} ${regenerated} record(s).`);
  if (missingSources > 0) {
    console.log(`Skipped ${missingSources} record(s) because the original image was missing on disk.`);
  }
}

async function getThumbnailFormat() {
  const config = await prisma.configuration.findUnique({
    where: { label: "thumbnails-format" },
    select: { value: true },
  });

  return config?.value || null;
}

function applyFormat(pipeline, format) {
  if (!format) return pipeline;
  return pipeline.toFormat(format);
}

async function deleteIfReplaced(previousPath, nextPath) {
  if (!previousPath || previousPath === nextPath) return;
  const absolutePath = path.join(UPLOAD_DIR, toPosixPath(previousPath));
  if (await fileExists(absolutePath)) {
    await fs.unlink(absolutePath);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(closePrisma);
