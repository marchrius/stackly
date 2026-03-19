"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Monitor } from "lucide-react";
import { cn } from "@koillection/ui";
import {
  APP_THEMES,
  AUTO_PREVIEW_LIGHT,
  AUTO_PREVIEW_DARK,
  type ThemeId,
  type AppTheme,
} from "@/lib/theme/themes";

interface ThemePickerProps {
  defaultValue: ThemeId;
}

export function ThemePicker({ defaultValue }: ThemePickerProps) {
  const t = useTranslations("settings");
  const [selected, setSelected] = useState<ThemeId>(defaultValue);

  const lightThemes = APP_THEMES.filter((th) => th.mode === "light");
  const darkThemes = APP_THEMES.filter((th) => th.mode === "dark");

  return (
    <div className="space-y-5">
      {/* Hidden input per il form */}
      <input type="hidden" name="theme" value={selected} />

      {/* ─── Auto ─── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("themes.autoSection")}
        </p>
        <AutoCard
          selected={selected === "auto"}
          onClick={() => setSelected("auto")}
          label={t("themes.auto")}
          subtitle={t("themes.autoSubtitle")}
          lightPreview={AUTO_PREVIEW_LIGHT}
          darkPreview={AUTO_PREVIEW_DARK}
        />
      </div>

      {/* ─── Light themes ─── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("themes.lightSection")}
        </p>
        <div className="flex flex-wrap gap-3">
          {lightThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={selected === theme.id}
              onClick={() => setSelected(theme.id)}
              label={t(`themes.${theme.id}` as any)}
            />
          ))}
        </div>
      </div>

      {/* ─── Dark themes ─── */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("themes.darkSection")}
        </p>
        <div className="flex flex-wrap gap-3">
          {darkThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              selected={selected === theme.id}
              onClick={() => setSelected(theme.id)}
              label={t(`themes.${theme.id}` as any)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ThemeCard — card per un tema concreto
───────────────────────────────────────────── */
interface ThemeCardProps {
  theme: AppTheme;
  selected: boolean;
  onClick: () => void;
  label: string;
}

function ThemeCard({ theme, selected, onClick, label }: ThemeCardProps) {
  const [bg, primary, accent, text] = theme.preview;
  const isDark = theme.mode === "dark";

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative w-24 rounded-xl overflow-hidden border-2 transition-all duration-150",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-105"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      {/* Preview colori */}
      <div
        className="h-[60px] w-full flex items-center justify-center gap-2"
        style={{ backgroundColor: bg }}
      >
        {/* Dot primario (grande) */}
        <span
          className="h-6 w-6 rounded-full shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: primary }}
        />
        {/* Dot accent (medio) */}
        <span
          className="h-4 w-4 rounded-full shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: accent }}
        />
        {/* Dot testo (piccolo) */}
        <span
          className="h-2.5 w-2.5 rounded-full shadow-sm ring-1 ring-black/10"
          style={{ backgroundColor: text }}
        />
      </div>

      {/* Label */}
      <div
        className="px-1.5 py-1.5 text-center text-xs font-semibold leading-none"
        style={{
          backgroundColor: isDark ? "#0a0f1a" : "#f8fafc",
          color: isDark ? "#c8d8e8" : "#1a2a3a",
        }}
      >
        {label}
      </div>

      {/* Checkmark selezione */}
      {selected && (
        <div
          className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: primary }}
        >
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   AutoCard — card speciale con preview diviso
───────────────────────────────────────────── */
interface AutoCardProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  subtitle: string;
  lightPreview: readonly [string, string, string, string];
  darkPreview: readonly [string, string, string, string];
}

function AutoCard({
  selected,
  onClick,
  label,
  subtitle,
  lightPreview,
  darkPreview,
}: AutoCardProps) {
  const [lBg, lPrimary, lAccent] = lightPreview;
  const [dBg, dPrimary, dAccent] = darkPreview;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative rounded-xl overflow-hidden border-2 transition-all duration-150",
        "hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "flex items-stretch",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-[1.02]"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      {/* Preview divisa: light | dark */}
      <div className="flex">
        {/* Metà light */}
        <div
          className="w-20 h-[60px] flex items-center justify-center gap-1.5"
          style={{ backgroundColor: lBg }}
        >
          <span
            className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: lPrimary }}
          />
          <span
            className="h-3 w-3 rounded-full shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: lAccent }}
          />
        </div>

        {/* Separatore diagonale */}
        <div
          className="relative w-4 h-[60px] overflow-hidden flex-shrink-0"
          style={{
            background: `linear-gradient(to bottom right, ${lBg} 50%, ${dBg} 50%)`,
          }}
        />

        {/* Metà dark */}
        <div
          className="w-20 h-[60px] flex items-center justify-center gap-1.5"
          style={{ backgroundColor: dBg }}
        >
          <span
            className="h-3 w-3 rounded-full shadow-sm ring-1 ring-white/10"
            style={{ backgroundColor: dAccent }}
          />
          <span
            className="h-5 w-5 rounded-full shadow-sm ring-1 ring-white/10"
            style={{ backgroundColor: dPrimary }}
          />
        </div>
      </div>

      {/* Label + sottotitolo */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 px-3 py-1.5"
        style={{
          background: "linear-gradient(to right, #f0fbfc 0%, #080d1c 100%)",
        }}
      >
        <Monitor className="h-3 w-3 shrink-0" style={{ color: "#6b7a8a" }} />
        <span className="text-xs font-semibold" style={{ color: "#6b7a8a" }}>
          {label}
        </span>
        <span className="text-[10px] hidden sm:inline" style={{ color: "#8a9aaa" }}>
          — {subtitle}
        </span>
      </div>

      {/* Checkmark selezione */}
      {selected && (
        <div className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

