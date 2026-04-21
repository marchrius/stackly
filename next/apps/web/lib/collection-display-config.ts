import type { DisplayConfiguration, Prisma } from "@stackly/db";

const TEXT_TYPES = ["text", "textarea", "country", "date", "rating", "number", "price", "link", "file", "list", "choice-list", "checkbox"];

export const RESERVED_SORTING_VALUES = {
  numberOfChildren: "koi-number-of-children",
  numberOfItems: "koi-number-of-items",
  quantity: "koi-quantity",
} as const;

export type DisplayConfigPayload = {
  label: string;
  displayMode: "grid" | "list";
  sortingProperty: string | null;
  sortingDirection: "ASC" | "DESC";
  showVisibility: boolean;
  showActions: boolean;
  showNumberOfChildren: boolean;
  showNumberOfItems: boolean;
  showItemQuantities: boolean;
  columns: string[];
};

export type DisplayConfigOption = {
  label: string;
  value: string;
  type: string | null;
};

export function getDefaultDisplayConfig(kind: "children" | "items", config?: DisplayConfiguration | null): DisplayConfigPayload {
  return {
    label: config?.label ?? "",
    displayMode: config?.displayMode === "list" ? "list" : "grid",
    sortingProperty: config?.sortingProperty ?? null,
    sortingDirection: config?.sortingDirection === "DESC" ? "DESC" : "ASC",
    showVisibility: config?.showVisibility ?? true,
    showActions: config?.showActions ?? true,
    showNumberOfChildren: kind === "children" ? (config?.showNumberOfChildren ?? true) : false,
    showNumberOfItems: kind === "children" ? (config?.showNumberOfItems ?? true) : false,
    showItemQuantities: kind === "items" ? (config?.showItemQuantities ?? false) : false,
    columns: parseColumns(config?.columns),
  };
}

export async function getCollectionDisplayConfigOptions(
  tx: Prisma.TransactionClient | Prisma.DefaultPrismaClient,
  ownerId: string,
  collectionId: string | null,
) {
  const [childrenLabels, itemLabels] = await Promise.all([
    collectionId
      ? tx.datum.findMany({
          where: {
            collection: { ownerId, parentId: collectionId },
            type: { in: TEXT_TYPES },
            label: { not: null },
          },
          distinct: ["label", "type"],
          select: { label: true, type: true },
          orderBy: { label: "asc" },
        })
      : tx.datum.findMany({
          where: {
            collection: { ownerId, parentId: null },
            type: { in: TEXT_TYPES },
            label: { not: null },
          },
          distinct: ["label", "type"],
          select: { label: true, type: true },
          orderBy: { label: "asc" },
        }),
    collectionId
      ? tx.datum.findMany({
          where: {
            item: { ownerId, collectionId },
            type: { in: TEXT_TYPES },
            label: { not: null },
          },
          distinct: ["label", "type"],
          select: { label: true, type: true },
          orderBy: { label: "asc" },
        })
      : [],
  ]);

  const normalizedChildren = childrenLabels.flatMap((entry) =>
    entry.label ? [{ label: entry.label, value: entry.label, type: entry.type }] : [],
  );
  const normalizedItems = itemLabels.flatMap((entry) =>
    entry.label ? [{ label: entry.label, value: entry.label, type: entry.type }] : [],
  );

  return {
    childrenSortingOptions: [
      { label: "Default value", value: "", type: null },
      { label: "Number of children", value: RESERVED_SORTING_VALUES.numberOfChildren, type: null },
      { label: "Number of items", value: RESERVED_SORTING_VALUES.numberOfItems, type: null },
      ...normalizedChildren,
    ],
    itemsSortingOptions: [
      { label: "Default value", value: "", type: null },
      { label: "Quantity", value: RESERVED_SORTING_VALUES.quantity, type: null },
      ...normalizedItems,
    ],
    childrenColumnOptions: normalizedChildren,
    itemsColumnOptions: normalizedItems,
  };
}

export async function upsertDisplayConfiguration(
  tx: Prisma.TransactionClient,
  ownerId: string,
  currentId: string | null | undefined,
  payload: DisplayConfigPayload,
  options: DisplayConfigOption[],
) {
  const data = {
    label: payload.label || null,
    displayMode: payload.displayMode,
    sortingProperty: payload.sortingProperty || null,
    sortingType: options.find((option) => option.value === payload.sortingProperty)?.type ?? null,
    sortingDirection: payload.sortingDirection,
    showVisibility: payload.showVisibility,
    showActions: payload.showActions,
    showNumberOfChildren: payload.showNumberOfChildren,
    showNumberOfItems: payload.showNumberOfItems,
    showItemQuantities: payload.showItemQuantities,
    columns: payload.columns,
    ownerId,
  };

  if (currentId) {
    const updated = await tx.displayConfiguration.update({
      where: { id: currentId },
      data: { ...data, updatedAt: new Date() },
    });
    return updated.id;
  }

  const created = await tx.displayConfiguration.create({ data });
  return created.id;
}

function parseColumns(columns: unknown) {
  return Array.isArray(columns) ? columns.filter((column): column is string => typeof column === "string") : [];
}
