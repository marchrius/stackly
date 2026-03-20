export type ThemeMode = "light" | "dark";

/** ID dei temi concreti (classi CSS reali) */
export const CONCRETE_THEME_IDS = [
  "l_aqua",
  "l_rose",
  "l_mint",
  "d_neo",
  "d_ink",
  "d_ember",
] as const;

export type ConcreteThemeId = (typeof CONCRETE_THEME_IDS)[number];

/** Tutti gli ID validi incluso "auto" (salvati nel DB) */
export const THEME_IDS = ["auto", ...CONCRETE_THEME_IDS] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "l_aqua";

export interface AppTheme {
  id: ConcreteThemeId;
  mode: ThemeMode;
  nameKey: string;
  className: string;
  /** [background, primary, accent, text] */
  preview: readonly [string, string, string, string];
}

export const APP_THEMES: readonly AppTheme[] = [
  {
    id: "l_aqua",
    mode: "light",
    nameKey: "settings.themes.l_aqua",
    className: "theme-l_aqua",
    preview: ["#f8f6f2", "#8a7f73", "#d9d1c7", "#2f2721"],
  },
  {
    id: "l_rose",
    mode: "light",
    nameKey: "settings.themes.l_rose",
    className: "theme-l_rose",
    preview: ["#fff5f8", "#ff6fae", "#ffc2da", "#4a1730"],
  },
  {
    id: "l_mint",
    mode: "light",
    nameKey: "settings.themes.l_mint",
    className: "theme-l_mint",
    preview: ["#f5fbff", "#5fd6c2", "#b58cff", "#163042"],
  },
  {
    id: "d_neo",
    mode: "dark",
    nameKey: "settings.themes.d_neo",
    className: "theme-d_neo",
    preview: ["#141210", "#b8afa6", "#3a342f", "#f3ede6"],
  },
  {
    id: "d_ink",
    mode: "dark",
    nameKey: "settings.themes.d_ink",
    className: "theme-d_ink",
    preview: ["#18111d", "#d8a4ff", "#7d4fc5", "#f7efff"],
  },
  {
    id: "d_ember",
    mode: "dark",
    nameKey: "settings.themes.d_ember",
    className: "theme-d_ember",
    preview: ["#101722", "#6ee7d8", "#ff9ac1", "#edf6ff"],
  },
];

export const THEME_CLASSNAMES = [
  "theme-auto",
  ...APP_THEMES.map((theme) => theme.className),
] as const;

/** Preview colori del tema light di default (l_aqua) usata nel selettore Auto */
export const AUTO_PREVIEW_LIGHT = APP_THEMES.find((t) => t.id === "l_aqua")!.preview;
/** Preview colori del tema dark di default (d_neo) usata nel selettore Auto */
export const AUTO_PREVIEW_DARK = APP_THEMES.find((t) => t.id === "d_neo")!.preview;

export function isThemeId(value: string): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function normalizeTheme(value: string | null | undefined): ThemeId {
  if (!value) return DEFAULT_THEME;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export function getThemeClass(value: string | null | undefined): string {
  const themeId = normalizeTheme(value);
  if (themeId === "auto") return "theme-auto";
  const theme = APP_THEMES.find((entry) => entry.id === themeId);
  return theme?.className ?? "theme-l_aqua";
}
