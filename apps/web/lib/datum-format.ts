export function formatDateValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function formatPriceValue(value: string | null, currency: string | null) {
  if (!value) return null;
  if (!currency) return value;

  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`.trim();
  }
}

export function formatCurrencyAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${value} ${currency}`.trim();
  }
}

export function formatCountryValue(value: string | null) {
  if (!value) return null;

  try {
    const displayNames = new Intl.DisplayNames(undefined, { type: "region" });
    return displayNames.of(value.toUpperCase()) ?? value;
  } catch {
    return value;
  }
}

export function renderRatingValue(value: string | null) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating <= 0) return null;

  const fullStars = Math.max(0, Math.min(10, Math.round(rating)));
  return `${"★".repeat(fullStars)}${"☆".repeat(10 - fullStars)}`;
}

export function parseListValues(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [value];
  } catch {
    return value.split(",").map((entry) => entry.trim()).filter(Boolean);
  }
}
