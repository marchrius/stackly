import { prisma, type Prisma } from "@koillection/db";

export type ManagedDatumPayload = {
  id?: string | null;
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId?: string | null;
  position?: number;
  value?: string | null;
  image?: string | null;
  imageSmallThumbnail?: string | null;
  file?: string | null;
  video?: string | null;
  originalFilename?: string | null;
  uploadKey?: string | null;
  remoteUrl?: string | null;
};

const SUPPORTED_DATUM_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "price",
  "date",
  "rating",
  "country",
  "link",
  "list",
  "choice-list",
  "checkbox",
  "image",
  "file",
  "video",
  "sign",
  "blank-line",
  "section",
]);

const MEDIA_TYPES = new Set(["image", "file", "video", "sign"]);
const STRUCTURE_TYPES = new Set(["blank-line", "section"]);

export async function resolveItemContext(ownerId: string, collectionId: string | null | undefined, tagIds: string[]) {
  let parentVisibility = "public";

  if (collectionId) {
    const collection = await prisma.collection.findFirst({
      where: { id: collectionId, ownerId },
      select: { finalVisibility: true },
    });

    if (!collection) {
      return { error: "Collection not found" } as const;
    }

    parentVisibility = collection.finalVisibility;
  }

  if (tagIds.length > 0) {
    const uniqueTagIds = [...new Set(tagIds)];
    const ownedTags = await prisma.tag.count({ where: { id: { in: uniqueTagIds }, ownerId } });
    if (ownedTags !== uniqueTagIds.length) {
      return { error: "One or more tags are invalid" } as const;
    }
  }

  return { parentVisibility } as const;
}

export async function syncDatumEntries(
  tx: Prisma.TransactionClient,
  itemId: string,
  itemFinalVisibility: string,
  dataPayload: ManagedDatumPayload[],
  existingData: Array<{ id: string }>,
) {
  const existingIds = new Set(existingData.map((datum) => datum.id));
  const keptIds = new Set<string>();

  for (const entry of dataPayload) {
    if (!SUPPORTED_DATUM_TYPES.has(entry.type)) continue;

    const normalized = normalizeDatumEntry(entry);
    const hasMeaningfulValue = isMeaningfulEntry(normalized);

    if (entry.id && existingIds.has(entry.id)) {
      keptIds.add(entry.id);

      if (!hasMeaningfulValue) {
        await tx.datum.delete({ where: { id: entry.id } });
        keptIds.delete(entry.id);
        continue;
      }

      await tx.datum.update({
        where: { id: entry.id },
        data: {
          label: normalized.label,
          type: normalized.type,
          value: normalized.value,
          image: normalized.image,
          imageSmallThumbnail: normalized.imageSmallThumbnail,
          file: normalized.file,
          video: normalized.video,
          originalFilename: normalized.originalFilename,
          visibility: normalized.visibility,
          parentVisibility: itemFinalVisibility,
          finalVisibility: computeFinalVisibility(normalized.visibility, itemFinalVisibility),
          choiceListId: normalized.choiceListId,
          position: normalized.position,
        },
      });
      continue;
    }

    if (!hasMeaningfulValue) continue;

    const created = await tx.datum.create({
      data: {
        label: normalized.label,
        type: normalized.type,
        value: normalized.value,
        image: normalized.image,
        imageSmallThumbnail: normalized.imageSmallThumbnail,
        file: normalized.file,
        video: normalized.video,
        originalFilename: normalized.originalFilename,
        visibility: normalized.visibility,
        parentVisibility: itemFinalVisibility,
        finalVisibility: computeFinalVisibility(normalized.visibility, itemFinalVisibility),
        choiceListId: normalized.choiceListId,
        position: normalized.position,
        itemId,
      },
    });

    keptIds.add(created.id);
  }

  const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (idsToDelete.length > 0) {
    await tx.datum.deleteMany({ where: { id: { in: idsToDelete } } });
  }
}

export function computeFinalVisibility(own: string, parent: string): string {
  const order = ["public", "internal", "private"];
  return order[Math.max(order.indexOf(own), order.indexOf(parent))] ?? "private";
}

function normalizeDatumEntry(entry: ManagedDatumPayload) {
  const type = entry.type;
  const label = STRUCTURE_TYPES.has(type) ? (entry.label ?? "").trim() : (entry.label ?? "").trim();
  const value = normalizeDatumValue(type, entry.value ?? "");

  return {
    id: entry.id ?? null,
    label,
    type,
    visibility: entry.visibility,
    choiceListId: entry.choiceListId || null,
    position: entry.position ?? null,
    value,
    image: type === "image" || type === "sign" ? entry.image ?? null : null,
    imageSmallThumbnail: type === "image" || type === "sign" ? entry.imageSmallThumbnail ?? null : null,
    file: type === "file" ? entry.file ?? null : null,
    video: type === "video" ? entry.video ?? null : null,
    originalFilename: MEDIA_TYPES.has(type) ? entry.originalFilename ?? null : null,
  };
}

function isMeaningfulEntry(entry: ReturnType<typeof normalizeDatumEntry>) {
  if (entry.type === "blank-line") return true;
  if (entry.type === "section") return entry.label.length > 0;
  if (entry.type === "checkbox") return entry.value === "1";
  if (entry.type === "image" || entry.type === "sign") return Boolean(entry.image);
  if (entry.type === "file") return Boolean(entry.file);
  if (entry.type === "video") return Boolean(entry.video);
  return entry.value.length > 0;
}

function normalizeDatumValue(type: string, value: string) {
  const normalized = value.trim();
  if (type === "checkbox") return normalized === "1" ? "1" : "0";
  return normalized;
}
