import type { Collection, Datum, DisplayConfiguration } from "@stackly/db";
import { RESERVED_SORTING_VALUES } from "@/lib/collection-display-config";
import { getCollectionCachedSummary } from "@/lib/collection-detail";
import { formatCountryValue, formatPriceValue, parseListValues, renderRatingValue } from "@/lib/datum-format";

export type CollectionIndexCollection = Collection & {
  data?: Datum[];
  _count: { children: number; items: number };
};

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function sortCollectionsForDisplay(
  collections: CollectionIndexCollection[],
  displayConfiguration?: Pick<DisplayConfiguration, "sortingProperty" | "sortingType" | "sortingDirection"> | null,
) {
  const direction = displayConfiguration?.sortingDirection === "DESC" ? -1 : 1;
  const sortingProperty = displayConfiguration?.sortingProperty ?? null;
  const sortingType = displayConfiguration?.sortingType ?? null;

  return [...collections].sort((left, right) => {
    const fallback = collator.compare(left.title, right.title);
    if (!sortingProperty) {
      return fallback * direction;
    }

    const comparison = compareSortValues(
      getSortingValue(left, sortingProperty, sortingType),
      getSortingValue(right, sortingProperty, sortingType),
      sortingType,
    );

    return comparison === 0 ? fallback : comparison * direction;
  });
}

export function getCollectionCounter(collection: CollectionIndexCollection, key: "children" | "items") {
  const summary = getCollectionCachedSummary(collection.cachedValues);
  return summary.counters[key] || collection._count[key];
}

export function getCollectionDatumDisplayValue(collection: CollectionIndexCollection, label: string) {
  const datum = collection.data?.find((entry) => entry.label === label) ?? null;
  if (!datum) return null;

  switch (datum.type) {
    case "checkbox":
      return datum.value === "1" ? "✓" : "✗";
    case "country":
      return formatCountryValue(datum.value) ?? null;
    case "choice-list":
    case "list":
      return parseListValues(datum.value).join(", ") || null;
    case "price":
      return formatPriceValue(datum.value, datum.currency) ?? datum.value ?? null;
    case "rating":
      return renderRatingValue(datum.value);
    case "file":
      return datum.originalFilename ?? datum.file ?? null;
    default:
      return datum.value ?? null;
  }
}

function getSortingValue(collection: CollectionIndexCollection, property: string, type: string | null) {
  switch (property) {
    case RESERVED_SORTING_VALUES.numberOfChildren:
      return getCollectionCounter(collection, "children");
    case RESERVED_SORTING_VALUES.numberOfItems:
      return getCollectionCounter(collection, "items");
    default: {
      const datum = collection.data?.find((entry) => entry.label === property) ?? null;
      if (!datum) return null;

      switch (type ?? datum.type) {
        case "number":
        case "price":
        case "rating": {
          const value = Number(datum.value);
          return Number.isFinite(value) ? value : null;
        }
        case "checkbox":
          return datum.value === "1" ? 1 : 0;
        case "date": {
          const timestamp = datum.value ? Date.parse(datum.value) : Number.NaN;
          return Number.isFinite(timestamp) ? timestamp : datum.value ?? null;
        }
        case "country":
          return formatCountryValue(datum.value) ?? datum.value ?? null;
        case "choice-list":
        case "list":
          return parseListValues(datum.value).join(", ");
        case "file":
          return datum.originalFilename ?? datum.file ?? null;
        default:
          return datum.value ?? null;
      }
    }
  }
}

function compareSortValues(left: unknown, right: unknown, type: string | null) {
  if (typeof left === "number" && typeof right === "number") {
    return left - right;
  }

  if (left == null && right == null) return 0;
  if (left == null) return -1;
  if (right == null) return 1;

  if (type === "number" || type === "price" || type === "rating" || type === "checkbox" || type === "date") {
    const leftNumber = typeof left === "number" ? left : Number(left);
    const rightNumber = typeof right === "number" ? right : Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }
  }

  return collator.compare(String(left), String(right));
}
