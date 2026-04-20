"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setSelected(defaultValue);
  }, [defaultValue]);

  function selectTheme(value: ThemeId) {
    setSelected(value);
  }

  const lightThemes = APP_THEMES.filter((th) => th.mode === "light");
  const darkThemes = APP_THEMES.filter((th) => th.mode === "dark");

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {t("themes.autoSection")}
        </p>
        <AutoCard
          selected={selected === "auto"}
          onSelect={() => selectTheme("auto")}
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
              onSelect={() => selectTheme(theme.id)}
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
              onSelect={() => selectTheme(theme.id)}
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
  onSelect: () => void;
  label: string;
}

function ThemeCard({ theme, selected, onSelect, label }: ThemeCardProps) {
  const [bg, primary, accent, text] = theme.preview;

  return (
    <label
      className={cn(
        "relative block w-28 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-150",
        "hover:scale-105",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-105"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      <input
        className="sr-only"
        type="radio"
        name="theme"
        value={theme.id}
        checked={selected}
        onChange={onSelect}
      />
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
    </label>
  );
}

interface AutoCardProps {
  selected: boolean;
  onSelect: () => void;
  label: string;
  subtitle: string;
  lightPreview: readonly [string, string, string, string];
  darkPreview: readonly [string, string, string, string];
}

function AutoCard({
  selected,
  onSelect,
  label,
  subtitle,
  lightPreview,
  darkPreview,
}: AutoCardProps) {
  const [lBg, lPrimary, lAccent] = lightPreview;
  const [dBg, dPrimary, dAccent] = darkPreview;

  return (
    <label
      className={cn(
        "relative block w-28 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-150",
        "hover:scale-105",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-105"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      <input className="sr-only" type="radio" name="theme" value="auto" checked={selected} onChange={onSelect} />
      <div className="flex w-full">
        <div className="flex h-[60px] flex-1 items-center justify-center gap-1" style={{ backgroundColor: lBg }}>
          <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: lPrimary }} />
          <span className="h-3 w-3 rounded-full shadow-sm ring-1 ring-black/10" style={{ backgroundColor: lAccent }} />
        </div>

        <div
          className="relative h-[60px] w-3 shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(to bottom right, ${lBg} 50%, ${dBg} 50%)` }}
        />

        <div className="flex h-[60px] flex-1 items-center justify-center gap-1" style={{ backgroundColor: dBg }}>
          <span className="h-3 w-3 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: dAccent }} />
          <span className="h-5 w-5 rounded-full shadow-sm ring-1 ring-white/10" style={{ backgroundColor: dPrimary }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-1 bg-card px-1.5 py-1.5 text-center text-xs font-semibold leading-none text-card-foreground">
        <Monitor className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="whitespace-nowrap">{label}</span>
      </div>

      {selected && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
    </label>
  );
}
