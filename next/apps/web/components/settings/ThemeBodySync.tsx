"use client";

import { useEffect } from "react";
import { THEME_CLASSNAMES } from "@/lib/theme/themes";

interface ThemeBodySyncProps {
  themeClass: string;
}

export function ThemeBodySync({ themeClass }: ThemeBodySyncProps) {
  useEffect(() => {
    document.documentElement.classList.remove(...THEME_CLASSNAMES);
    document.body.classList.remove(...THEME_CLASSNAMES);
    document.documentElement.classList.add(themeClass);
    document.body.classList.add(themeClass);
  }, [themeClass]);

  return null;
}
