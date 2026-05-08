export const SUPPORTED_LOCALES = [
  "da",
  "de",
  "en",
  "es",
  "fr",
  "it",
  "nl",
  "pl",
  "pt",
  "pt_BR",
  "ru",
  "tr",
  "uk",
  "zh",
] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

