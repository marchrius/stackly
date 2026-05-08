export type ChoiceListDisplayMode = "pill" | "list";
export type ChoiceListSelectionMode = "single" | "multiple";

export interface ChoiceListModeLike {
  displayMode?: string | null;
  selectionMode?: string | null;
}

export function normalizeChoiceValues(choices: unknown): string[] {
  return Array.isArray(choices) ? choices.filter((choice): choice is string => typeof choice === "string") : [];
}

export function parseChoiceListValues(value: string | null | undefined) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((choice): choice is string => typeof choice === "string") : [];
  } catch {
    return value ? [value] : [];
  }
}

export function isSingleChoiceList(choiceList: ChoiceListModeLike | null | undefined) {
  return choiceList?.selectionMode === "single";
}

export function getChoiceListDisplayMode(choiceList: ChoiceListModeLike | null | undefined): ChoiceListDisplayMode {
  return choiceList?.displayMode === "list" ? "list" : "pill";
}

export function limitChoiceValues(values: string[], choiceList: ChoiceListModeLike | null | undefined) {
  return isSingleChoiceList(choiceList) ? values.slice(0, 1) : values;
}
