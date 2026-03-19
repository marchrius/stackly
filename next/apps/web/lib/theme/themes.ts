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
    preview: ["#f0fbfc", "#06b6d4", "#38bdf8", "#0e2a35"],
  },
  {
    id: "l_rose",
    mode: "light",
    nameKey: "settings.themes.l_rose",
    className: "theme-l_rose",
    preview: ["#fff0f2", "#f43f5e", "#fb7185", "#1a0810"],
  },
  {
    id: "l_mint",
    mode: "light",
    nameKey: "settings.themes.l_mint",
    className: "theme-l_mint",
    preview: ["#f0fdf5", "#10b981", "#34d399", "#052e16"],
  },
  {
    id: "d_neo",
    mode: "dark",
    nameKey: "settings.themes.d_neo",
    className: "theme-d_neo",
    preview: ["#080d1c", "#22d3ee", "#a78bfa", "#c8d8e8"],
  },
  {
    id: "d_ink",
    mode: "dark",
    nameKey: "settings.themes.d_ink",
    className: "theme-d_ink",
    preview: ["#09090b", "#6366f1", "#818cf8", "#e8ecf4"],
  },
  {
    id: "d_ember",
    mode: "dark",
    nameKey: "settings.themes.d_ember",
    className: "theme-d_ember",
    preview: ["#0e1420", "#f97316", "#fb923c", "#f0f4f8"],
  },
];

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
