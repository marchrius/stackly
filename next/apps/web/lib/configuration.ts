import { APP_THEMES, type ThemeId } from "@/lib/theme/themes";

export const CONFIGURATION_LABELS = {
  thumbnailsFormat: "thumbnails-format",
  customLightThemeCss: "custom-light-theme-css",
  customDarkThemeCss: "custom-dark-theme-css",
  enableMetrics: "enable-metrics",
} as const;

export const THUMBNAIL_FORMAT_VALUES = ["keep-original", "jpeg", "png", "webp", "avif"] as const;
export type ThumbnailFormatValue = (typeof THUMBNAIL_FORMAT_VALUES)[number];

export interface AdminConfigurationValues {
  thumbnailsFormat: ThumbnailFormatValue;
  customLightThemeCss: string;
  customDarkThemeCss: string;
  enableMetrics: boolean;
}

export const DEFAULT_ADMIN_CONFIGURATION: AdminConfigurationValues = {
  thumbnailsFormat: "keep-original",
  customLightThemeCss: "",
  customDarkThemeCss: "",
  enableMetrics: false,
};

export function readAdminConfiguration(
  entries: ReadonlyArray<{ label: string; value: string | null }>,
): AdminConfigurationValues {
  const byLabel = new Map(entries.map((entry) => [entry.label, entry.value]));
  const thumbnailsFormat = byLabel.get(CONFIGURATION_LABELS.thumbnailsFormat) ?? "keep-original";

  return {
    thumbnailsFormat: isThumbnailFormatValue(thumbnailsFormat) ? thumbnailsFormat : "keep-original",
    customLightThemeCss: byLabel.get(CONFIGURATION_LABELS.customLightThemeCss) ?? "",
    customDarkThemeCss: byLabel.get(CONFIGURATION_LABELS.customDarkThemeCss) ?? "",
    enableMetrics: (byLabel.get(CONFIGURATION_LABELS.enableMetrics) ?? "0") === "1",
  };
}

export function buildCustomThemeCss(
  theme: ThemeId,
  configuration: Pick<AdminConfigurationValues, "customLightThemeCss" | "customDarkThemeCss">,
): string | null {
  const lightCss = configuration.customLightThemeCss.trim();
  const darkCss = configuration.customDarkThemeCss.trim();

  if (theme === "auto") {
    const chunks = [
      lightCss ? `@media (prefers-color-scheme: light) {\n${lightCss}\n}` : null,
      darkCss ? `@media (prefers-color-scheme: dark) {\n${darkCss}\n}` : null,
    ].filter((value): value is string => Boolean(value));

    return chunks.length > 0 ? chunks.join("\n\n") : null;
  }

  const selectedTheme = APP_THEMES.find((entry) => entry.id === theme);
  if (!selectedTheme) return lightCss || darkCss || null;

  return selectedTheme.mode === "dark" ? darkCss || null : lightCss || null;
}

function isThumbnailFormatValue(value: string | null | undefined): value is ThumbnailFormatValue {
  return THUMBNAIL_FORMAT_VALUES.includes((value ?? "keep-original") as ThumbnailFormatValue);
}
