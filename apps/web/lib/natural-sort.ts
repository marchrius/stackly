const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function compareNaturalText(left: string | null | undefined, right: string | null | undefined) {
  return naturalCollator.compare(left ?? "", right ?? "");
}

export function sortByNaturalText<T>(items: readonly T[], getText: (item: T) => string | null | undefined, direction: "asc" | "desc" = "asc") {
  const factor = direction === "desc" ? -1 : 1;

  return [...items].sort((left, right) => compareNaturalText(getText(left), getText(right)) * factor);
}
