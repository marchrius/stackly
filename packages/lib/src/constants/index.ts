import type { DatumType } from "../types/index";

export const DATUM_TYPES: Array<{ value: DatumType; label: string; hasFile: boolean; hasImage: boolean }> = [
  { value: "text", label: "Text", hasFile: false, hasImage: false },
  { value: "textarea", label: "Text area", hasFile: false, hasImage: false },
  { value: "number", label: "Number", hasFile: false, hasImage: false },
  { value: "price", label: "Price", hasFile: false, hasImage: false },
  { value: "date", label: "Date", hasFile: false, hasImage: false },
  { value: "rating", label: "Rating", hasFile: false, hasImage: false },
  { value: "country", label: "Country", hasFile: false, hasImage: false },
  { value: "link", label: "Link", hasFile: false, hasImage: false },
  { value: "list", label: "List", hasFile: false, hasImage: false },
  { value: "choice-list", label: "Choice list", hasFile: false, hasImage: false },
  { value: "checkbox", label: "Checkbox", hasFile: false, hasImage: false },
  { value: "image", label: "Image", hasFile: false, hasImage: true },
  { value: "file", label: "File", hasFile: true, hasImage: false },
  { value: "video", label: "Video", hasFile: true, hasImage: false },
  { value: "sign", label: "Sign", hasFile: false, hasImage: false },
  { value: "blank-line", label: "Blank line", hasFile: false, hasImage: false },
  { value: "section", label: "Section", hasFile: false, hasImage: false },
];

export const DATUM_TYPES_WITH_VALUE: DatumType[] = [
  "text", "textarea", "number", "price", "date", "rating", "country",
  "link", "list", "choice-list", "checkbox", "sign",
];

export const CURRENCIES = [
  { code: "EUR", symbol: "€" },
  { code: "USD", symbol: "$" },
  { code: "GBP", symbol: "£" },
  { code: "JPY", symbol: "¥" },
  { code: "CHF", symbol: "Fr" },
];

export const VISIBILITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal (logged-in users)" },
  { value: "private", label: "Private" },
];

export const DISPLAY_MODES = ["grid", "list"] as const;

export const ROLES = {
  USER: "ROLE_USER",
  ADMIN: "ROLE_ADMIN",
} as const;

export const DEFAULT_PAGE_SIZE = 30;

