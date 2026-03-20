import { type Prisma } from "@koillection/db";

export type ManagedCollectionDatumPayload = {
  id?: string | null;
  label: string;
  type: string;
  visibility: "public" | "internal" | "private";
  choiceListId?: string | null;
  position?: number;
  value?: string | null;
  file?: string | null;
  originalFilename?: string | null;
  uploadKey?: string | null;
};

const SUPPORTED_COLLECTION_DATUM_TYPES = new Set([
  "text",
  "number",
  "country",
  "date",
  "file",
  "checkbox",
  "choice-list",
]);

export async function syncCollectionDatumEntries(
  tx: Prisma.TransactionClient,
  collectionId: string,
  collectionFinalVisibility: string,
  dataPayload: ManagedCollectionDatumPayload[],
  existingData: Array<{ id: string }>,
) {
  const existingIds = new Set(existingData.map((datum) => datum.id));
  const keptIds = new Set<string>();

  for (const entry of dataPayload) {
    if (!SUPPORTED_COLLECTION_DATUM_TYPES.has(entry.type)) continue;

    const normalized = normalizeCollectionDatumEntry(entry);
    const hasMeaningfulValue = isMeaningfulCollectionDatumEntry(normalized);

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
          file: normalized.file,
          originalFilename: normalized.originalFilename,
          visibility: normalized.visibility,
          parentVisibility: collectionFinalVisibility,
          finalVisibility: computeFinalVisibility(normalized.visibility, collectionFinalVisibility),
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
        file: normalized.file,
        originalFilename: normalized.originalFilename,
        visibility: normalized.visibility,
        parentVisibility: collectionFinalVisibility,
        finalVisibility: computeFinalVisibility(normalized.visibility, collectionFinalVisibility),
        choiceListId: normalized.choiceListId,
        position: normalized.position,
        collectionId,
      },
    });

    keptIds.add(created.id);
  }

  const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));
  if (idsToDelete.length > 0) {
    await tx.datum.deleteMany({ where: { id: { in: idsToDelete } } });
  }
}

function normalizeCollectionDatumEntry(entry: ManagedCollectionDatumPayload) {
  return {
    id: entry.id ?? null,
    label: (entry.label ?? "").trim(),
    type: entry.type,
    visibility: entry.visibility,
    choiceListId: entry.choiceListId || null,
    position: entry.position ?? null,
    value: normalizeCollectionDatumValue(entry.type, entry.value ?? ""),
    file: entry.type === "file" ? entry.file ?? null : null,
    originalFilename: entry.type === "file" ? entry.originalFilename ?? null : null,
  };
}

function isMeaningfulCollectionDatumEntry(entry: ReturnType<typeof normalizeCollectionDatumEntry>) {
  if (entry.type === "checkbox") return entry.value === "1";
  if (entry.type === "file") return Boolean(entry.file);
  return entry.value.length > 0;
}

function normalizeCollectionDatumValue(type: string, value: string) {
  const normalized = value.trim();
  if (type === "checkbox") return normalized === "1" ? "1" : "0";
  return normalized;
}

function computeFinalVisibility(own: string, parent: string): string {
  const order = ["public", "internal", "private"];
  return order[Math.max(order.indexOf(own), order.indexOf(parent))] ?? "private";
}
