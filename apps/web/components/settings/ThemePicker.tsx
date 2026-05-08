"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Monitor } from "lucide-react";
import { cn } from "@stackly/ui";
import {
  APP_THEMES,
  getThemeClass,
  type ThemeId,
  type AppTheme,
} from "@/lib/theme/themes";

interface ThemePickerProps {
  defaultValue: ThemeId;
}

export function ThemePicker({ defaultValue }: ThemePickerProps) {
  const t = useTranslations("settings");
  const [selected, setSelected] = useState<ThemeId>(defaultValue);
  const initialThemeClass = useRef<string | null>(null);

  useEffect(() => {
    setSelected(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (initialThemeClass.current === null) {
      initialThemeClass.current = document.documentElement.className;
    }

    document.documentElement.className = getThemeClass(selected);
  }, [selected]);

  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      if (initialThemeClass.current !== null) {
        document.documentElement.className = initialThemeClass.current;
      }
    };
  }, []);

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
    <label className={cn(
        "relative block w-28 cursor-pointer overflow-visible rounded-xl border-2 transition-all duration-150",
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
}

function AutoCard({ selected, onSelect, label }: AutoCardProps) {
  return (
    <label className={cn(
        "relative block w-28 cursor-pointer overflow-visible rounded-xl border-2 transition-all duration-150",
        "hover:scale-105",
        selected
          ? "border-primary shadow-md shadow-primary/20 scale-105"
          : "border-border hover:border-muted-foreground/60",
      )}
    >
      <input className="sr-only" type="radio" name="theme" value="auto" checked={selected} onChange={onSelect} />
      <div className="flex h-[60px] items-center justify-center gap-2 bg-card">
        <Monitor className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="whitespace-nowrap text-xs font-semibold">{label}</span>
      </div>

      {selected && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}
    </label>
  );
}
