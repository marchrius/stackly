const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const textCollator = new Intl.Collator(undefined, { numeric: false, sensitivity: "base" });

export type SortDirection = "asc" | "desc";
export type SortNulls = "first" | "last";
export type SortValueType = "natural" | "text" | "number" | "date" | "position";
export type SortValue = string | number | boolean | Date | null | undefined;

export type SortDefinition<T> = {
  getValue: (item: T) => SortValue;
  type: SortValueType;
  direction?: SortDirection;
  nulls?: SortNulls;
};

export function compareNaturalText(left: string | null | undefined, right: string | null | undefined) {
  return naturalCollator.compare(left ?? "", right ?? "");
}

export function compareSortValues(left: SortValue, right: SortValue, definition: Pick<SortDefinition<unknown>, "type" | "direction" | "nulls">) {
  const direction = definition.direction === "desc" ? -1 : 1;
  const nulls = definition.nulls ?? "last";
  const leftEmpty = left == null;
  const rightEmpty = right == null;

  if (leftEmpty || rightEmpty) {
    if (leftEmpty && rightEmpty) return 0;
    return leftEmpty ? (nulls === "first" ? -1 : 1) : nulls === "first" ? 1 : -1;
  }

  let comparison: number;
  switch (definition.type) {
    case "number":
    case "position":
      comparison = compareNumbers(left, right);
      break;
    case "date":
      comparison = compareDates(left, right);
      break;
    case "text":
      comparison = textCollator.compare(String(left), String(right));
      break;
    case "natural":
    default:
      comparison = compareNaturalText(String(left), String(right));
      break;
  }

  return comparison * direction;
}

export function sortByDefinitions<T>(items: readonly T[], definitions: readonly SortDefinition<T>[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      for (const definition of definitions) {
        const comparison = compareSortValues(definition.getValue(left.item), definition.getValue(right.item), definition);
        if (comparison !== 0) return comparison;
      }
      return left.index - right.index;
    })
    .map(({ item }) => item);
}

export function sortByNaturalText<T>(items: readonly T[], getText: (item: T) => string | null | undefined, direction: SortDirection = "asc") {
  return sortByDefinitions(items, [{ getValue: getText, type: "natural", direction }]);
}

function compareNumbers(left: Exclude<SortValue, null | undefined>, right: Exclude<SortValue, null | undefined>) {
  const leftNumber = typeof left === "number" ? left : Number(left);
  const rightNumber = typeof right === "number" ? right : Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  return compareNaturalText(String(left), String(right));
}

function compareDates(left: Exclude<SortValue, null | undefined>, right: Exclude<SortValue, null | undefined>) {
  const leftTimestamp = left instanceof Date ? left.getTime() : Date.parse(String(left));
  const rightTimestamp = right instanceof Date ? right.getTime() : Date.parse(String(right));
  if (Number.isFinite(leftTimestamp) && Number.isFinite(rightTimestamp)) return leftTimestamp - rightTimestamp;
  return compareNaturalText(String(left), String(right));
}
