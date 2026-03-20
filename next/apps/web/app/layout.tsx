import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { auth } from "@/auth";
import { prisma } from "@koillection/db";
import { buildCustomThemeCss, CONFIGURATION_LABELS, readAdminConfiguration } from "@/lib/configuration";
import { getThemeClass, normalizeTheme, THEME_COOKIE_NAME } from "@/lib/theme/themes";
import { cookies } from "next/headers";
import { ThemeBodySync } from "@/components/settings/ThemeBodySync";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | Koillection",
    default: "Koillection",
  },
  description: "Gestisci le tue collezioni personali",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const session = await auth();
  const cookieStore = await cookies();

  let themeValue: string | null | undefined = cookieStore.get(THEME_COOKIE_NAME)?.value ?? session?.user?.theme;
  const [dbUser, configurationEntries] = await Promise.all([
    session?.user?.id
      ? prisma.user.findUnique({
          where: { id: session.user.id },
          select: { theme: true },
        })
      : Promise.resolve(null),
    prisma.configuration.findMany({
      where: {
        label: {
          in: [CONFIGURATION_LABELS.customLightThemeCss, CONFIGURATION_LABELS.customDarkThemeCss],
        },
      },
      select: { label: true, value: true },
    }),
  ]);
  themeValue = cookieStore.get(THEME_COOKIE_NAME)?.value ?? dbUser?.theme ?? themeValue;

  const normalizedTheme = normalizeTheme(themeValue);
  const themeClass = getThemeClass(normalizedTheme);
  const customThemeCss = buildCustomThemeCss(normalizedTheme, readAdminConfiguration(configurationEntries));

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} ${themeClass}`}>
        {customThemeCss ? <style dangerouslySetInnerHTML={{ __html: customThemeCss }} /> : null}
        <NextIntlClientProvider messages={messages}>
          <ThemeBodySync themeClass={themeClass} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
