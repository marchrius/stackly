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
  onChange?: (value: ThemeId) => void;
}

export function ThemePicker({ defaultValue, onChange }: ThemePickerProps) {
  const t = useTranslations("settings");
  const [selected, setSelected] = useState<ThemeId>(defaultValue);

  function selectTheme(value: ThemeId) {
    setSelected(value);
    onChange?.(value);
  }

  const lightThemes = APP_THEMES.filter((th) => th.mode === "light");
  const darkThemes = APP_THEMES.filter((th) => th.mode === "dark");

  return (
    <div className="space-y-5">
      <input type="hidden" name="theme" value={selected} />

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("themes.autoSection")}
        </p>
        <AutoCard
          selected={selected === "auto"}
          onClick={() => selectTheme("auto")}
          label={t("themes.auto")}
          subtitle={t("themes.autoSubtitle")}
          lightPreview={AUTO_PREVIEW_LIGHT}
          darkPreview={AUTO_PREVIEW_DARK}
        />
      </div>

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
              onClick={() => selectTheme(theme.id)}
              label={t(`themes.${theme.id}` as never)}
            />
          ))}
        </div>
      </div>

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
              onClick={() => selectTheme(theme.id)}
              label={t(`themes.${theme.id}` as never)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: AppTheme;
  selected: boolean;
  onClick: () => void;
  label: string;
}

function ThemeCard({ theme, selected, onClick, label }: ThemeCardProps) {
  const [bg, primary, accent, text] = theme.preview;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative w-24 overflow-hidden rounded-xl border-2 transition-all duration-150",
        "hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-105"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      <div className="flex h-[60px] w-full items-center justify-center gap-2" style={{ backgroundColor: bg }}>
        <span className="h-6 w-6 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: primary }} />
        <span className="h-4 w-4 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: accent }} />
        <span className="h-2.5 w-2.5 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: text }} />
      </div>

      <div className="bg-card px-1.5 py-1.5 text-center text-xs font-semibold leading-none text-card-foreground">
        {label}
      </div>

      {selected && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}

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
        "relative flex items-stretch overflow-hidden rounded-xl border-2 transition-all duration-150",
        "hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-[1.02]"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      <div className="flex">
        <div className="flex h-[60px] w-20 items-center justify-center gap-1.5" style={{ backgroundColor: lBg }}>
          <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: lPrimary }} />
          <span className="h-3 w-3 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: lAccent }} />
        </div>

        <div
          className="relative h-[60px] w-4 shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(to bottom right, ${lBg} 50%, ${dBg} 50%)` }}
        />

        <div className="flex h-[60px] w-20 items-center justify-center gap-1.5" style={{ backgroundColor: dBg }}>
          <span className="h-3 w-3 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: dAccent }} />
          <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: dPrimary }} />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-r from-card to-muted/90 px-3 py-1.5 text-card-foreground">
        <Monitor className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold">{label}</span>
        <span className="hidden text-[10px] text-muted-foreground sm:inline">- {subtitle}</span>
      </div>

      {selected && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
    </button>
  );
}
